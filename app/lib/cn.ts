import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names, resolving Tailwind conflicts by class-list order.
 *
 * Why both libraries: clsx handles conditionals but NOT conflicts, and conflicts
 * are the actual problem here. Components previously concatenated with template
 * literals:
 *
 *   `${base} ${variantClasses[variant]} ${className}`
 *
 * When a caller passed `text-white` and the variant contributed `text-gray-900`,
 * BOTH landed in the class attribute and CSS *source order* -- not attribute
 * order -- picked the winner. That is why Button.tsx carried `!text-white` and
 * `!text-gray-900`, and why PhotoCard passed `bg-green-500` to a variant that
 * already sets `bg-green-600`, and why Spinner's baked-in border colors had to
 * be overridden with more specific ones at call sites.
 *
 * twMerge drops the earlier of two conflicting utilities, so the caller's class
 * wins predictably and the `!important` escapes are unnecessary.
 *
 * CAVEAT: twMerge recognises standard namespaces by prefix, so bg-brand-600 vs
 * bg-white resolves correctly with no configuration. Custom @utility names
 * (pb-safe, pt-safe) are NOT known to it -- keep those few, and do not rely on
 * cn() to resolve conflicts between them.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
