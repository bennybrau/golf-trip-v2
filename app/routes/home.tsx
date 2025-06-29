import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Logo } from '../components/ui';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scaletta Golf - Home" },
    { name: "description", content: "Your premier golf experience" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    return { user };
  } catch (response) {
    // If authentication fails, the requireAuth function throws a redirect response
    throw response;
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Scaletta Golf
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Your premier golf experience awaits
          </p>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Hello, {user.name}!
              </h2>
              <p className="text-gray-600">
                Welcome to your golf management dashboard. Here you can track your games, 
                manage your profile, and connect with other golf enthusiasts.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
