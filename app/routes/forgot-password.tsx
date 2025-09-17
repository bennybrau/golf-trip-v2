import { Form, Link, useActionData, useNavigation, redirect } from 'react-router';
import { z } from 'zod';
import { createPasswordResetToken } from '../lib/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../lib/validation';
import { getSessionUser } from '../lib/auth';
import { getSessionToken } from '../lib/session';
import { sendEmail, createPasswordResetEmail } from '../lib/email';
import { prisma } from '../lib/db';
import { Button, Input, Alert } from '../components/ui';
import type { Route } from './+types/forgot-password';

export async function loader({ request }: Route.LoaderArgs) {
  const sessionToken = getSessionToken(request);
  if (sessionToken) {
    const user = await getSessionUser(sessionToken);
    if (user) {
      throw redirect('/');
    }
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email');

  try {
    const { email: validatedEmail } = forgotPasswordSchema.parse({ email });
    
    // Always return success to prevent email enumeration attacks
    const token = await createPasswordResetToken(validatedEmail);
    
    if (token) {
      // Get user name for personalized email
      const user = await prisma.user.findUnique({
        where: { email: validatedEmail },
        select: { name: true }
      });
      
      // Create reset link
      const baseUrl = process.env.APP_URL || 'http://localhost:5173';
      const resetLink = `${baseUrl}/reset-password/${token}`;
      
      // Send email
      const emailContent = createPasswordResetEmail(resetLink, user?.name || 'there');
      const emailResult = await sendEmail({
        to: validatedEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
      
      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        // Still return success to prevent enumeration
      } else {
        console.log('Password reset email sent successfully');
      }
    }
    
    return { 
      success: true, 
      message: 'If an account with that email exists, we\'ve sent you a password reset link.' 
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

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {actionData?.success && (
            <Alert variant="success" className="mb-6">
              {actionData.message}
            </Alert>
          )}
          
          {actionData && !actionData.success && actionData.message && (
            <Alert variant="error" className="mb-6">
              {actionData.message}
            </Alert>
          )}

          <Form method="post" className="space-y-6">
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              error={actionData?.errors?.email?.[0]}
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </Button>
            </div>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

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
    </div>
  );
}