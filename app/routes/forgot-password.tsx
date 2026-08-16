import { Form, Link, useActionData, useNavigation, redirect } from 'react-router';
import { z } from 'zod';
import { createPasswordResetToken } from '../lib/auth';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../lib/validation';
import { getSessionUser } from '../lib/auth';
import { getSessionToken } from '../lib/session';
import { sendEmail, createPasswordResetEmail } from '../lib/email';
import { prisma } from '../lib/db';
import { AuthLayout, Input, Button, Alert } from '../components/ui';
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
    <AuthLayout
      title="Reset your password"
      subtitle="We’ll email you a link to set a new one"
      footer={
        <Link to="/login" className="font-medium text-brand-700 hover:text-brand-800">
          Back to sign in
        </Link>
      }
    >
      {actionData?.success && (
        <Alert variant="success" className="mb-5">
          {actionData.message}
        </Alert>
      )}
      {actionData && !actionData.success && actionData.message && (
        <Alert variant="error" className="mb-5">
          {actionData.message}
        </Alert>
      )}

      <Form method="post" className="space-y-5">
        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          error={actionData?.errors?.email?.[0]}
        />
        <Button type="submit" fullWidth loading={isSubmitting} loadingText="Sending...">
          Send reset link
        </Button>
      </Form>
    </AuthLayout>
  );
}
