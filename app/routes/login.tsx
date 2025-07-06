import { Form, redirect, useActionData, Link } from 'react-router';
import { authenticateUser, createSession } from '../lib/auth';
import { createSessionCookie, getSessionToken } from '../lib/session';
import { loginSchema } from '../lib/validation';
import { Button, Input, Card, CardContent, Alert, Logo } from '../components/ui';
import type { Route } from './+types/login';

export async function loader({ request }: Route.LoaderArgs) {
  const sessionToken = getSessionToken(request);
  if (sessionToken) {
    throw redirect('/');
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = loginSchema.safeParse(data);
  
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      values: data,
    };
  }

  const { email, password } = result.data;

  try {
    const user = await authenticateUser(email, password);
    
    if (!user) {
      return { 
        error: 'Invalid email or password',
        values: data,
      };
    }

    const sessionToken = await createSession(user.id);
    
    return redirect('/', {
      headers: {
        'Set-Cookie': createSessionCookie(sessionToken),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return { 
      error: 'An error occurred during login',
      values: data,
    };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Scaletta Golf</h2>
              <p className="mt-2 text-gray-600">Sign in to your account</p>
            </div>

            <Form method="post" className="space-y-6">
              <Input
                name="email"
                type="email"
                autoComplete="email"
                label="Email Address"
                placeholder="Enter your email"
                defaultValue={actionData?.values?.email as string}
                error={actionData?.errors?.email?.[0]}
              />

              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                label="Password"
                placeholder="Enter your password"
                error={actionData?.errors?.password?.[0]}
              />

              {actionData?.error && (
                <Alert variant="error">
                  {actionData.error}
                </Alert>
              )}

              <Button type="submit" fullWidth>
                Sign In
              </Button>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-green-600 hover:text-green-500 font-medium">
                  Create one here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}