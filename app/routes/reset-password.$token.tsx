import { Form, Link, useActionData, useLoaderData, useNavigation, redirect } from 'react-router';
import { z } from 'zod';
import { validatePasswordResetToken, resetPassword, getSessionUser } from '../lib/auth';
import { resetPasswordSchema, type ResetPasswordInput } from '../lib/validation';
import { getSessionToken } from '../lib/session';
import { Button, Input, Alert } from '../components/ui';
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
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Password Reset Successful
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Alert variant="success" className="mb-6">
              {actionData.message}
            </Alert>

            <div className="text-center">
              <Link 
                to="/login" 
                className="font-medium text-green-600 hover:text-green-500"
              >
                Sign in with your new password
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error only if token is invalid and it's not a revalidation after success
  if (!isValidToken && !isRevalidation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Invalid Reset Link
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <Alert variant="error" className="mb-6">
              This password reset link is invalid or has expired. Please request a new password reset.
            </Alert>

            <div className="text-center">
              <Link 
                to="/forgot-password" 
                className="font-medium text-green-600 hover:text-green-500"
              >
                Request new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Set new password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {actionData && !actionData.success && actionData.message && (
            <Alert variant="error" className="mb-6">
              {actionData.message}
            </Alert>
          )}

          <Form method="post" className="space-y-6">
            <Input
              id="password"
              name="password"
              type="password"
              label="New password"
              autoComplete="new-password"
              required
              error={actionData?.errors?.password?.[0]}
              helperText="Must be at least 8 characters long"
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

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating password...' : 'Update password'}
              </Button>
            </div>
          </Form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="font-medium text-green-600 hover:text-green-500"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}