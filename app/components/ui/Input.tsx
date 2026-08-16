import React from 'react';
import { cn } from '../../lib/cn';
import { controlClasses, controlBorder, Label } from './Field';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const input = (
      <input
        ref={ref}
        id={id}
        // Shares controlClasses with Select and Textarea. Previously this was
        // `rounded-lg py-3` against the selects' `rounded-md py-2`, so controls
        // in the same row had different heights and corner radii.
        className={cn(controlClasses, controlBorder(!!error), className)}
        {...props}
      />
    );

    if (!label && !error && !helperText) return input;

    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        {input}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
