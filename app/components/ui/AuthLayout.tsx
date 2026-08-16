import React from 'react';
import { Logo } from './Logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shell for the signed-out pages (login, register, forgot-password,
 * reset-password).
 *
 * These four did not share a shell: login/register used a centered gradient
 * layout while forgot/reset used an older `sm:mx-auto sm:max-w-md` pattern that
 * rendered full-bleed and square-cornered on mobile. This unifies them.
 */
export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-brand-50 to-emerald-100 px-4 py-10 pb-safe">
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" />
          <h1 className="mt-4 text-2xl font-bold text-gray-900 text-center">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600 text-center">{subtitle}</p>}
        </div>

        <div className="bg-white rounded-card shadow-card border border-gray-100 p-6 sm:p-8">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </div>
  );
}
