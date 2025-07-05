import { useState } from 'react';
import { requireAuth } from '../lib/session';
import { Navigation } from '../components/Navigation';
import { Card, CardContent, Button, Input } from '../components/ui';
import { prisma } from '../lib/db';
import { z } from 'zod';
import type { Route } from './+types/foursomes';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Scaletta Golf - Foursomes" },
    { name: "description", content: "Manage foursomes for each round" },
  ];
}

const FoursomeSchema = z.object({
  round: z.enum(['FRIDAY_MORNING', 'FRIDAY_AFTERNOON', 'SATURDAY_MORNING', 'SATURDAY_AFTERNOON']),
  course: z.enum(['BLACK', 'SILVER']),
  teeTime: z.string().min(1, "Tee time is required"),
  golfer1Id: z.string().optional(),
  golfer2Id: z.string().optional(),
  golfer3Id: z.string().optional(),
  golfer4Id: z.string().optional(),
  score: z.string().optional(),
}).refine((data) => {
  const golfers = [data.golfer1Id, data.golfer2Id, data.golfer3Id, data.golfer4Id].filter(Boolean);
  return golfers.length > 0 && new Set(golfers).size === golfers.length;
}, {
  message: "At least one golfer is required and all golfers must be unique",
});

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    const [foursomes, golfers] = await Promise.all([
      prisma.foursome.findMany({
        include: {
          golfer1: true,
          golfer2: true,
          golfer3: true,
          golfer4: true,
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.golfer.findMany({
        orderBy: { name: 'asc' }
      })
    ]);
    return { user, foursomes, golfers };
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
  const foursomeId = formData.get('foursomeId') as string;
  
  const data = {
    round: formData.get('round') as string,
    course: formData.get('course') as string,
    teeTime: formData.get('teeTime') as string,
    golfer1Id: formData.get('golfer1Id') as string || undefined,
    golfer2Id: formData.get('golfer2Id') as string || undefined,
    golfer3Id: formData.get('golfer3Id') as string || undefined,
    golfer4Id: formData.get('golfer4Id') as string || undefined,
    score: formData.get('score') as string,
  };

  try {
    const validatedData = FoursomeSchema.parse(data);
    const scoreValue = validatedData.score && validatedData.score !== '' ? parseInt(validatedData.score) : 0;
    const teeTimeValue = new Date(validatedData.teeTime);
    
    if (action === 'edit' && foursomeId) {
      await prisma.foursome.update({
        where: { id: foursomeId },
        data: {
          round: validatedData.round,
          course: validatedData.course,
          teeTime: teeTimeValue,
          golfer1Id: validatedData.golfer1Id || null,
          golfer2Id: validatedData.golfer2Id || null,
          golfer3Id: validatedData.golfer3Id || null,
          golfer4Id: validatedData.golfer4Id || null,
          score: scoreValue,
        }
      });
      return { success: true, message: 'Foursome updated successfully' };
    } else {
      await prisma.foursome.create({
        data: {
          round: validatedData.round,
          course: validatedData.course,
          teeTime: teeTimeValue,
          golfer1Id: validatedData.golfer1Id || null,
          golfer2Id: validatedData.golfer2Id || null,
          golfer3Id: validatedData.golfer3Id || null,
          golfer4Id: validatedData.golfer4Id || null,
          score: scoreValue,
        }
      });
      return { success: true, message: 'Foursome created successfully' };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: action === 'edit' ? "Failed to update foursome" : "Failed to create foursome" };
  }
}

const roundLabels = {
  FRIDAY_MORNING: 'Friday Morning',
  FRIDAY_AFTERNOON: 'Friday Afternoon',
  SATURDAY_MORNING: 'Saturday Morning',
  SATURDAY_AFTERNOON: 'Saturday Afternoon',
};

export default function Foursomes({ loaderData, actionData }: Route.ComponentProps) {
  const { user, foursomes, golfers } = loaderData;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFoursome, setEditingFoursome] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Foursomes
          </h1>
          {user.isAdmin && (
            <Button 
              onClick={() => {
                setIsFormOpen(!isFormOpen);
                setEditingFoursome(null);
              }}
              className="mb-6"
            >
              {isFormOpen ? 'Cancel' : 'Create New Foursome'}
            </Button>
          )}
        </div>

        {user.isAdmin && (isFormOpen || editingFoursome) && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingFoursome ? 'Edit Foursome' : 'Create New Foursome'}
              </h2>
              
              <form method="post" className="space-y-4">
                <input type="hidden" name="_action" value={editingFoursome ? 'edit' : 'create'} />
                {editingFoursome && <input type="hidden" name="foursomeId" value={editingFoursome.id} />}
                
                <div>
                  <label htmlFor="round" className="block text-sm font-medium text-gray-700 mb-1">
                    Round *
                  </label>
                  <select 
                    id="round"
                    name="round" 
                    required
                    defaultValue={editingFoursome?.round || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a round</option>
                    {Object.entries(roundLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                    Course *
                  </label>
                  <select 
                    id="course"
                    name="course" 
                    required
                    defaultValue={editingFoursome?.course || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a course</option>
                    <option value="BLACK">Black</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="teeTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Tee Time *
                  </label>
                  <Input 
                    id="teeTime"
                    name="teeTime" 
                    type="datetime-local" 
                    required
                    defaultValue={editingFoursome?.teeTime ? new Date(editingFoursome.teeTime).toISOString().slice(0, 16) : ''}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="golfer1Id" className="block text-sm font-medium text-gray-700 mb-1">
                      Golfer 1
                    </label>
                    <select 
                      id="golfer1Id"
                      name="golfer1Id" 
                      defaultValue={editingFoursome?.golfer1Id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select golfer</option>
                      {golfers.map((golfer: any) => (
                        <option key={golfer.id} value={golfer.id}>{golfer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="golfer2Id" className="block text-sm font-medium text-gray-700 mb-1">
                      Golfer 2
                    </label>
                    <select 
                      id="golfer2Id"
                      name="golfer2Id" 
                      defaultValue={editingFoursome?.golfer2Id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select golfer</option>
                      {golfers.map((golfer: any) => (
                        <option key={golfer.id} value={golfer.id}>{golfer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="golfer3Id" className="block text-sm font-medium text-gray-700 mb-1">
                      Golfer 3
                    </label>
                    <select 
                      id="golfer3Id"
                      name="golfer3Id" 
                      defaultValue={editingFoursome?.golfer3Id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select golfer</option>
                      {golfers.map((golfer: any) => (
                        <option key={golfer.id} value={golfer.id}>{golfer.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="golfer4Id" className="block text-sm font-medium text-gray-700 mb-1">
                      Golfer 4
                    </label>
                    <select 
                      id="golfer4Id"
                      name="golfer4Id" 
                      defaultValue={editingFoursome?.golfer4Id || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select golfer</option>
                      {golfers.map((golfer: any) => (
                        <option key={golfer.id} value={golfer.id}>{golfer.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="score" className="block text-sm font-medium text-gray-700 mb-1">
                    Score (strokes above/below par)
                  </label>
                  <Input 
                    id="score"
                    name="score" 
                    type="number" 
                    placeholder="e.g., -2 (under par) or +5 (over par)"
                    defaultValue={editingFoursome?.score?.toString() || '0'}
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
                    {editingFoursome ? 'Update Foursome' : 'Create Foursome'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingFoursome(null);
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
          {foursomes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No foursomes found. Create your first foursome to get started!</p>
              </CardContent>
            </Card>
          ) : (
            foursomes.map((foursome: any) => (
              <Card key={foursome.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {roundLabels[foursome.round as keyof typeof roundLabels]}
                      </h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                          <strong>Course:</strong> {foursome.course}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Tee Time:</strong> {new Date(foursome.teeTime).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Players:</strong> {[foursome.golfer1?.name, foursome.golfer2?.name, foursome.golfer3?.name, foursome.golfer4?.name].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {user.isAdmin && (
                        <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingFoursome(foursome);
                            setIsFormOpen(false);
                          }}
                        >
                          Edit
                        </Button>
                      )}
                      <div className="text-2xl font-bold text-gray-900">
                        {foursome.score > 0 ? '+' : ''}{foursome.score}
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