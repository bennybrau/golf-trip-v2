import { useState } from 'react';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input } from '../components/ui';
import { prisma } from '../lib/db';
import { z } from 'zod';
import type { Route } from './+types/golfers';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scaletta Golf - Golfers" },
    { name: "description", content: "Manage golfers in your system" },
  ];
}

const GolferSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
});

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    const golfers = await prisma.golfer.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { user, golfers };
  } catch (response) {
    throw response;
  }
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  
  const formData = await request.formData();
  const action = formData.get('_action') as string;
  const golferId = formData.get('golferId') as string;
  
  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string || undefined,
    phone: formData.get('phone') as string || undefined,
  };

  try {
    const validatedData = GolferSchema.parse(data);
    
    if (action === 'edit' && golferId) {
      await prisma.golfer.update({
        where: { id: golferId },
        data: {
          ...validatedData,
          email: validatedData.email || null,
        }
      });
      return { success: true, message: 'Golfer updated successfully' };
    } else {
      await prisma.golfer.create({
        data: {
          ...validatedData,
          email: validatedData.email || null,
        }
      });
      return { success: true, message: 'Golfer created successfully' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: action === 'edit' ? "Failed to update golfer" : "Failed to create golfer" };
  }
}

export default function Golfers({ loaderData, actionData }: Route.ComponentProps) {
  const { user, golfers } = loaderData;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGolfer, setEditingGolfer] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Golfers
          </h1>
          <Button 
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              setEditingGolfer(null);
            }}
            className="mb-6"
          >
            {isFormOpen ? 'Cancel' : 'Add New Golfer'}
          </Button>
        </div>

        {(isFormOpen || editingGolfer) && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingGolfer ? 'Edit Golfer' : 'Add New Golfer'}
              </h2>
              
              <form method="post" className="space-y-4">
                <input type="hidden" name="_action" value={editingGolfer ? 'edit' : 'create'} />
                {editingGolfer && <input type="hidden" name="golferId" value={editingGolfer.id} />}
                
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input 
                    id="name"
                    name="name" 
                    type="text" 
                    required
                    defaultValue={editingGolfer?.name || ''}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input 
                    id="email"
                    name="email" 
                    type="email" 
                    defaultValue={editingGolfer?.email || ''}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input 
                    id="phone"
                    name="phone" 
                    type="tel" 
                    defaultValue={editingGolfer?.phone || ''}
                    className="w-full"
                  />
                </div>

                {actionData?.error && (
                  <div className="text-red-600 text-sm">
                    {actionData.error}
                  </div>
                )}

                {actionData?.success && (
                  <div className="text-green-600 text-sm">
                    {actionData.message}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit">
                    {editingGolfer ? 'Update Golfer' : 'Create Golfer'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingGolfer(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {golfers.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No golfers found. Add your first golfer to get started!</p>
              </CardContent>
            </Card>
          ) : (
            golfers.map((golfer: any) => (
              <Card key={golfer.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {golfer.name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        {golfer.email && (
                          <p className="text-sm text-gray-600">
                            Email: {golfer.email}
                          </p>
                        )}
                        {golfer.phone && (
                          <p className="text-sm text-gray-600">
                            Phone: {golfer.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditingGolfer(golfer);
                          setIsFormOpen(false);
                        }}
                      >
                        Edit
                      </Button>
                      <div className="text-xs text-gray-500">
                        Added {new Date(golfer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}