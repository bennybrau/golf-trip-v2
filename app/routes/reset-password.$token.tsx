import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from 'react-router';
import { z } from 'zod';
import { validatePasswordResetToken, resetPassword, getSessionUser } from '../lib/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '../lib/validation';
import { getSessionToken } from '../lib/session';
import { AuthLayout, Input, Button, Alert } from '../components/ui';
import type { Route } from './+types/reset-password.$token';

export async function loader({ request, params }: Route.LoaderArgs) {
  const sessionToken = getSessionToken(request);
  if (sessionToken) {
    const user = await getSessionUser(sessionToken);
    if (user) {
      throw redirect('/');
    }
  }

  const token = params.token;
  if (!token) {
    throw new Response('Reset token is required', { status: 400 });
  }

  // Check if this is a revalidation after form submission
  const url = new URL(request.url);
  const isRevalidation = url.searchParams.has('_data');
  
  const userId = await validatePasswordResetToken(token, false);
  if (!userId) {
    // If token is invalid and this is a revalidation, it might have been consumed
    // Let the action handle the success/error state
    if (isRevalidation) {
      return { isValidToken: false, isRevalidation: true };
    }
    return { isValidToken: false, isRevalidation: false };
  }

  return { isValidToken: true, isRevalidation: false };
}

export async function action({ request, params }: Route.ActionArgs) {
  const token = params.token;
  if (!token) {
    throw new Response('Reset token is required', { status: 400 });
  }

  const formData = await request.formData();
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  try {
    const { password: validatedPassword } = resetPasswordSchema.parse({ 
      password, 
      confirmPassword 
    });
    
    const success = await resetPassword(token, validatedPassword);
    
    if (!success) {
      return { 
        success: false, 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      };
    }
    
    return { 
      success: true, 
      message: 'Your password has been successfully reset. You can now sign in with your new password.' 
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.flatten().fieldErrors 
      };
    }
    
    return { 
      success: false, 
      message: 'Something went wrong. Please try again.' 
    };
  }
}

export default function ResetPassword() {
  const { isValidToken, isRevalidation } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Show success message if action succeeded
  if (actionData?.success) {
    return (
      <AuthLayout
        title="Password reset"
        footer={
          <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
            Sign in with your new password
          </Link>
        }
      >
        <Alert variant="success">{actionData.message}</Alert>
      </AuthLayout>
    );
  }

  // Show error only if token is invalid and it's not a revalidation after success
  if (!isValidToken && !isRevalidation) {
    return (
      <AuthLayout
        title="Link expired"
        subtitle="This password reset link is no longer valid"
        footer={
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:text-brand-800">
            Request a new link
          </Link>
        }
      >
        <Alert variant="error">
          Reset links expire one hour after they are sent, and can only be used once.
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below"
      footer={
        <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Back to sign in
        </Link>
      }
    >
      {actionData && !actionData.success && actionData.message && (
        <Alert variant="error" className="mb-5">
          {actionData.message}
        </Alert>
      )}

      <Form method="post" className="space-y-5">
        <Input
          id="password"
          name="password"
          type="password"
          label="New password"
          autoComplete="new-password"
          required
          error={actionData?.errors?.password?.[0]}
          helperText="At least 8 characters."
        />
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          required
          error={actionData?.errors?.confirmPassword?.[0]}
        />
        <Button type="submit" fullWidth loading={isSubmitting} loadingText="Updating...">
          Update password
        </Button>
      </Form>
    </AuthLayout>
  );
}
