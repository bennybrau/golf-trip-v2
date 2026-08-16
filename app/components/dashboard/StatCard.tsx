import React from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';

type StatTone = 'brand' | 'blue' | 'amber' | 'violet' | 'slate';

interface StatCardProps {
  label: string;
  /** The headline figure. Rendered large and tabular. */
  value: React.ReactNode;
  /** Small line under the value giving the value context. */
  hint?: string;
  icon?: React.ReactNode;
  tone?: StatTone;
  to?: string;
  className?: string;
}

/**
 * One compact dashboard tile.
 *
 * Replaces six components (ScoreCard, CabinCard, LeaderCard, TeeTimeCard,
 * WeekendMenuCard, and the stat half of ChampionCard) that were each a copy of
 * the same "gradient + label + big number + emoji" skeleton in a different color
 * family, none of them responsive. Four of the six were never even mounted.
 *
 * Tones are flat tints rather than gradients: at small sizes the gradients read
 * as muddy on a phone screen, and six unrelated color families made the
 * dashboard look like a bag of sweets rather than one system.
 */
const toneClasses: Record<StatTone, { wrap: string; label: string; icon: string }> = {
  brand: { wrap: 'bg-brand-50 border-brand-200', label: 'text-brand-700', icon: 'text-brand-500' },
  blue: { wrap: 'bg-blue-50 border-blue-200', label: 'text-blue-700', icon: 'text-blue-500' },
  amber: { wrap: 'bg-amber-50 border-amber-200', label: 'text-amber-700', icon: 'text-amber-500' },
  violet: { wrap: 'bg-violet-50 border-violet-200', label: 'text-violet-700', icon: 'text-violet-500' },
  slate: { wrap: 'bg-slate-50 border-slate-200', label: 'text-slate-700', icon: 'text-slate-500' },
};

export function StatCard({ label, value, hint, icon, tone = 'slate', to, className }: StatCardProps) {
  const tones = toneClasses[tone];

  const body = (
    <div
      className={cn(
        'h-full rounded-card border p-4 transition-shadow',
        tones.wrap,
        to && 'hover:shadow-card-hover',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-xs font-medium uppercase tracking-wide', tones.label)}>{label}</p>
        {icon && <span className={cn('text-xl leading-none shrink-0', tones.icon)} aria-hidden="true">{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 tabular-nums truncate">{value}</div>
      {hint && <p className="mt-1 text-xs text-gray-600 truncate">{hint}</p>}
    </div>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

/** Renders a to-par score with the conventional +/- prefix, or an em dash. */
export function ScoreValue({ score }: { score: number | null }) {
  if (score === null) return <span className="text-gray-400">&mdash;</span>;
  return (
    <span className={score < 0 ? 'text-blue-600' : score > 0 ? 'text-gray-900' : 'text-gray-900'}>
      {score > 0 ? '+' : ''}
      {score === 0 ? 'E' : score}
    </span>
  );
}
