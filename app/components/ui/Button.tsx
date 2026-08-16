import React from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  /** Shows a spinner and disables the button. Replaces the hand-rolled
   *  `{isX ? <Spinner/> + label : label}` pattern repeated at ~12 call sites. */
  loading?: boolean;
  loadingText?: string;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  // No `!important` needed any more: cn() resolves caller-vs-variant conflicts
  // by class-list order, so a caller passing text-white simply wins.
  primary: 'bg-brand-600 hover:bg-brand-700 text-white focus-visible:ring-brand-500 border border-transparent',
  secondary: 'bg-white hover:bg-gray-50 text-gray-900 focus-visible:ring-brand-500 border border-gray-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500 border border-transparent',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus-visible:ring-brand-500 border border-transparent',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  // min-h-11 == 44px, the minimum comfortable touch target. Every size meets it
  // except `sm`, which is reserved for dense desktop rows.
  sm: 'px-3 py-2 text-sm min-h-9',
  md: 'px-4 py-2.5 text-sm min-h-11',
  lg: 'px-6 py-3 text-base min-h-12',
  icon: 'p-2 min-h-11 min-w-11',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-control',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && (
          <Spinner
            size="sm"
            className={variant === 'secondary' || variant === 'ghost' ? undefined : 'border-white/40 border-t-white'}
          />
        )}
        {loading && loadingText ? loadingText : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
