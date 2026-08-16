import React from 'react';
import { cn } from '../../lib/cn';
import { controlClasses, controlBorder, Label } from './Field';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/** Matches Input and Select geometry. Used by the champion Q&A fields. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 3, ...props }, ref) => {
    const textarea = (
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(controlClasses, controlBorder(!!error), 'min-h-0 resize-y', className)}
        {...props}
      />
    );

    if (!label && !error && !helperText) return textarea;

    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        {textarea}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
