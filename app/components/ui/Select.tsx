import React from 'react';
import { cn } from '../../lib/cn';
import { controlClasses, controlBorder, Label } from './Field';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Replaces 27 hand-rolled <select> elements that had drifted into three variants
 * of the same class string (one with disabled: states, one without text/bg
 * colors, one at text-xs). Geometry is shared with Input via controlClasses, so
 * inputs and selects finally line up in the same form row.
 *
 * `appearance-none` plus an inline chevron gives a consistent control across
 * platforms; the native arrow rendered differently on iOS Safari and drifted
 * against the border radius.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, id, children, ...props }, ref) => {
    const select = (
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            controlClasses,
            controlBorder(!!error),
            'appearance-none pr-10',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );

    if (!label && !error && !helperText) return select;

    return (
      <div className="space-y-1.5">
        {label && <Label htmlFor={id}>{label}</Label>}
        {select}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
