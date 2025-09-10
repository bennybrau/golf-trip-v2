import { Navigation } from '../components/Navigation';
import { Card, CardContent } from '../components/ui';
import { requireAuth } from '../lib/session';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Install App - Scaletta Golf Trip" },
    { name: "description", content: "Learn how to install Golf Trip on your device" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await requireAuth(request);
    return { user };
  } catch (response) {
    throw response;
  }
}

export default function Install({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Install Golf Trip App
          </h1>
          <p className="text-gray-600">
            Add Golf Trip to your home screen for quick access and a native app experience.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* iOS Instructions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">📱</div>
                <h2 className="text-xl font-semibold text-gray-900">
                  iPhone & iPad
                </h2>
              </div>
              
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Step-by-step:</h3>
                  <ol className="list-decimal list-inside space-y-2 pl-2">
                    <li>Open Golf Trip in <strong>Safari</strong> (not Chrome or other browsers)</li>
                    <li>Tap the <strong>Share</strong> button <span className="inline-block text-blue-600">📤</span> at the bottom of the screen</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> to confirm</li>
                    <li>The Golf Trip app will appear on your home screen</li>
                  </ol>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> You must use Safari for this to work. Other browsers don't support adding to home screen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Android Instructions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">🤖</div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Android
                </h2>
              </div>
              
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Method 1 - Browser prompt:</h3>
                  <ol className="list-decimal list-inside space-y-2 pl-2">
                    <li>Open Golf Trip in <strong>Chrome</strong></li>
                    <li>Look for the <strong>"Install"</strong> banner or popup</li>
                    <li>Tap <strong>"Install"</strong> or <strong>"Add to Home Screen"</strong></li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Method 2 - Manual:</h3>
                  <ol className="list-decimal list-inside space-y-2 pl-2">
                    <li>Tap the menu button <strong>⋮</strong> in Chrome</li>
                    <li>Select <strong>"Add to Home screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> to confirm</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Instructions */}
          <Card className="md:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="text-3xl mr-3">💻</div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Desktop (Chrome, Edge, etc.)
                </h2>
              </div>
              
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Install as desktop app:</h3>
                  <ol className="list-decimal list-inside space-y-2 pl-2">
                    <li>Look for the <strong>install icon</strong> 📥 in the address bar</li>
                    <li>Click the install icon or look for an "Install Golf Trip" banner</li>
                    <li>Click <strong>"Install"</strong> to add it as a desktop app</li>
                  </ol>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-700 text-sm">
                    Once installed, Golf Trip will open in its own window and appear in your applications menu.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="text-2xl">✨</div>
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Benefits of Installing</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Quick access from your home screen</li>
                    <li>• Full-screen app experience</li>
                    <li>• Faster loading times</li>
                    <li>• Works offline for basic features</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}