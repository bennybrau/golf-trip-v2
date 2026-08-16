import { Form, redirect, useActionData, useNavigation, Link } from 'react-router';
import { authenticateUser, createSession } from '../lib/auth';
import { createSessionCookie, getSessionToken } from '../lib/session';
import { loginSchema } from '../lib/validation';
import { AuthLayout, Input, Button, Alert } from '../components/ui';
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
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <AuthLayout
      title="Scaletta Golf Trip"
      subtitle="Sign in to your account"
      footer={
        <>
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:text-brand-800">
            Forgot your password?
          </Link>
          <p className="mt-2">
            Don&rsquo;t have an account?{' '}
            <Link to="/register" className="font-medium text-brand-700 hover:text-brand-800">
              Create one here
            </Link>
          </p>
        </>
      }
    >
      <Form method="post" className="space-y-5">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          label="Email address"
          placeholder="you@example.com"
          defaultValue={actionData?.values?.email as string}
          error={actionData?.errors?.email?.[0]}
        />

        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          label="Password"
          placeholder="Your password"
          error={actionData?.errors?.password?.[0]}
        />

        {actionData?.error && <Alert variant="error">{actionData.error}</Alert>}

        <Button type="submit" fullWidth loading={isSubmitting} loadingText="Signing in...">
          Sign In
        </Button>
      </Form>
    </AuthLayout>
  );
}
