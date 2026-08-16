import { Link } from 'react-router';
import { requireAuth } from '../lib/session';
import {
  PageLayout,
  PageHeader,
  Card,
  CardContent,
  Button,
  Image,
  Badge,
  ConfirmButton,
  ActionMessage,
  EmptyState,
} from '../components/ui';
import { prisma } from '../lib/db';
import { cloudflareImages } from '../lib/cloudflare';
import type { Route } from './+types/champions';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Champions - Scaletta Golf Trip" },
    { name: "description", content: "Past tournament champions" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    
    // Get all champions with golfer information
    const champions = await prisma.champion.findMany({
      include: {
        golfer: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { year: 'desc' },
    });
    
    return { user, champions };
  } catch (response) {
    throw response;
  }
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAuth(request);
  
  if (!user.isAdmin) {
    throw new Response("Unauthorized", { status: 403 });
  }
  
  const formData = await request.formData();
  const action = formData.get('_action') as string;
  
  if (action === 'delete-champion') {
    const championId = formData.get('championId') as string;
    
    try {
      // Get champion from database
      const champion = await prisma.champion.findUnique({
        where: { id: championId },
      });

      if (!champion) {
        return { error: "Champion not found" };
      }

      // Try to delete from Cloudflare Images if photo exists
      if (champion.cloudflareId) {
        try {
          await cloudflareImages.deleteImage(champion.cloudflareId);
        } catch (cloudflareError) {
          console.warn('Failed to delete from Cloudflare Images:', cloudflareError);
          // Continue with database deletion even if Cloudflare fails
        }
      }
      
      // Delete from database
      await prisma.champion.delete({
        where: { id: championId },
      });
      
      return { success: true, message: 'Champion deleted successfully' };
    } catch (error) {
      console.error('Champion delete error:', error);
      return { error: "Failed to delete champion" };
    }
  }
  
  return { error: "Invalid action" };
}

/** Champion Q&A prompts, paired with their model fields. */
const QA_FIELDS = [
  { key: 'motivation', prompt: 'What was your motivation?' },
  { key: 'meaning', prompt: 'What does becoming a champion mean to you?' },
  { key: 'lifeChange', prompt: 'How has your life changed since winning?' },
  { key: 'favoriteQuote', prompt: 'Favourite quote' },
] as const;

export default function Champions({ loaderData, actionData }: Route.ComponentProps) {
  const { user, champions = [] } = loaderData;

  return (
    <PageLayout user={user}>
      <PageHeader
        title="Champions"
        subtitle={
          champions.length
            ? `${champions.length} winner${champions.length === 1 ? '' : 's'} of the annual tournament`
            : 'Past winners of the annual tournament'
        }
        actions={
          user.isAdmin ? (
            <Link to="/champions/new">
              <Button>Add Champion</Button>
            </Link>
          ) : undefined
        }
      />

      <ActionMessage actionData={actionData} />

      {champions.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="No champions recorded yet"
          description="Add the first champion to start the archive."
          action={
            user.isAdmin ? (
              <Link to="/champions/new">
                <Button size="sm">Add Champion</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {champions.map((champion) => {
            const name = champion.displayName || champion.golfer.name;
            const answered = QA_FIELDS.filter(
              (field) => (champion as any)[field.key]
            );

            return (
              <Card key={champion.id}>
                <CardContent className="py-5">
                  {/* Stacks on phones: a 192px fixed photo beside long-form Q&A
                      prose squeezed the text column to ~250px at 390px. */}
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="shrink-0 mx-auto sm:mx-0">
                      {champion.photoUrl ? (
                        <Image
                          src={champion.photoUrl}
                          alt=""
                          fallbackIcon="image"
                          className="h-40 w-40 rounded-card border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-40 w-40 items-center justify-center rounded-card border border-gray-200 bg-gray-100">
                          <span className="text-4xl" aria-hidden="true">🏌️</span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="warning">{champion.year}</Badge>
                        <h2 className="text-xl font-bold text-gray-900 truncate">{name}</h2>
                      </div>

                      {answered.length > 0 && (
                        <dl className="mt-3 space-y-3">
                          {answered.map((field) => (
                            <div key={field.key}>
                              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                {field.prompt}
                              </dt>
                              <dd className="mt-0.5 text-sm text-gray-700 whitespace-pre-line">
                                {(champion as any)[field.key]}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {user.isAdmin && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                          <Link to={`/champions/${champion.id}/edit`}>
                            <Button variant="secondary" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <ConfirmButton
                            fields={{ _action: 'delete-champion', championId: champion.id }}
                            confirmTitle={`Delete the ${champion.year} champion?`}
                            confirmMessage="The record and its photo will be removed."
                            aria-label={`Delete ${champion.year} champion`}
                            size="sm"
                            variant="danger"
                          >
                            Delete
                          </ConfirmButton>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageLayout>
  );
}
