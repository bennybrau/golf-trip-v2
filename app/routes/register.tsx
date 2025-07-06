import { useState, useEffect } from 'react';
import { Form, redirect, useActionData, Link } from 'react-router';
import { createUser, createSession } from '../lib/auth';
import { createSessionCookie, getSessionToken } from '../lib/session';
import { Button, Input, Card, CardContent, Alert, Logo, Spinner } from '../components/ui';
import { prisma } from '../lib/db';
import { z } from 'zod';

export function meta() {
  return [
    { title: "Create Account - Scaletta Golf Trip" },
    { name: "description", content: "Create your account to join Scaletta Golf Trip" },
  ];
}

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  name: z.string().min(1, 'Full name is required').max(100, 'Name must be less than 100 characters'),
  phone: z.string().transform((val) => val.trim() === '' ? undefined : val).optional().refine((val) => {
    if (!val) return true;
    return /^[\+]?[1-9][\d]{0,15}$/.test(val.replace(/[\s\-\(\)]/g, ''));
  }, 'Please enter a valid phone number'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function loader({ request }: { request: Request }) {
  const sessionToken = getSessionToken(request);
  if (sessionToken) {
    throw redirect('/');
  }
  return null;
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const result = registerSchema.safeParse(data);
  
  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
      values: data,
    };
  }

  const { email, password, name, phone } = result.data;

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { 
        error: 'An account with this email already exists',
        values: data,
      };
    }

    // Create the user
    const user = await createUser(email, password, name, false, phone);
    
    // Create the associated golfer
    await prisma.golfer.create({
      data: {
        name: name,
        email: email,
        phone: phone || null,
      },
    });

    // Create session and log them in
    const sessionToken = await createSession(user.id);
    
    return redirect('/', {
      headers: {
        'Set-Cookie': createSessionCookie(sessionToken),
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return { 
      error: 'An error occurred while creating your account. Please try again.',
      values: data,
    };
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
  };

  // Reset loading state on error
  useEffect(() => {
    if (actionData?.error || actionData?.errors) {
      setIsSubmitting(false);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
              <p className="mt-2 text-gray-600">Join Scaletta Golf Trip</p>
            </div>

            <Form method="post" className="space-y-6" onSubmit={handleSubmit}>
              <Input
                name="name"
                type="text"
                autoComplete="name"
                label="Full Name"
                placeholder="Enter your full name"
                required
                defaultValue={actionData?.values?.name as string}
                error={actionData?.errors?.name?.[0]}
              />

              <Input
                name="email"
                type="email"
                autoComplete="email"
                label="Email Address"
                placeholder="Enter your email"
                required
                defaultValue={actionData?.values?.email as string}
                error={actionData?.errors?.email?.[0]}
              />

              <Input
                name="phone"
                type="tel"
                autoComplete="tel"
                label="Phone Number (Optional)"
                placeholder="Enter your phone number"
                defaultValue={actionData?.values?.phone as string}
                error={actionData?.errors?.phone?.[0]}
              />

              <Input
                name="password"
                type="password"
                autoComplete="new-password"
                label="Password"
                placeholder="Enter your password"
                required
                error={actionData?.errors?.password?.[0]}
              />

              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                label="Confirm Password"
                placeholder="Confirm your password"
                required
                error={actionData?.errors?.confirmPassword?.[0]}
              />

              {actionData?.error && (
                <Alert variant="error">
                  {actionData.error}
                </Alert>
              )}

              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Spinner size="sm" />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-500 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}