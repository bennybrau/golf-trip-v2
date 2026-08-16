import React, { useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Shared geometry for every text-like control.
 *
 * Input previously used `rounded-lg py-3` while every hand-rolled <select> used
 * `rounded-md py-2`, so an Input and a Select sitting side by side in the same
 * form row were visibly different heights (most obvious on the foursome form,
 * where the Tee Time input sits next to the Round/Course selects). One constant
 * now guarantees they match.
 */
export const controlClasses =
  'w-full px-3 py-2.5 min-h-11 border rounded-control bg-white text-gray-900 ' +
  'placeholder-gray-400 shadow-sm transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500 ' +
  'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed';

export function controlBorder(hasError?: boolean) {
  return hasError ? 'border-red-300' : 'border-gray-300';
}

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

/**
 * The single spelling of a form label. The codebase had 53 labels across three
 * different class strings (`... mb-2`, `... mb-1`, and no margin at all).
 */
export function Label({ className, required, children, ...props }: LabelProps) {
  return (
    <label className={cn('block text-sm font-medium text-gray-700', className)} {...props}>
      {children}
      {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
    </label>
  );
}

interface FieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
  /** Receives the generated id so the control and label stay associated. */
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}

/**
 * Label + control + help/error text, correctly wired for screen readers.
 *
 * Uses a render prop so the caller keeps full control of the actual element
 * (input, select, textarea, or a composite) while Field owns the id plumbing.
 */
export function Field({ label, error, helperText, required, className, children }: FieldProps) {
  const id = useId();
  const describedById = error ? `${id}-error` : helperText ? `${id}-help` : undefined;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children({
        id,
        'aria-describedby': describedById,
        'aria-invalid': error ? true : undefined,
      })}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${id}-help`} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
