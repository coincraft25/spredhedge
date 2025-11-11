import { Position, PositionWithCalculations } from '@/lib/supabase/types';
import { differenceInDays, parseISO } from 'date-fns';

export function calculateUnrealizedPnL(position: Position): number {
  if (position.status === 'Closed' || !position.market_price) {
    return 0;
  }
  return (position.market_price - position.entry_price) * position.quantity;
}

export function calculatePerformancePct(position: Position): number {
  const currentPrice = position.status === 'Closed'
    ? position.closing_price
    : position.market_price;

  if (!currentPrice) {
    return 0;
  }

  return ((currentPrice / position.entry_price) - 1) * 100;
}

export function calculateDaysHeld(position: Position): number {
  const startDate = parseISO(position.entry_date);
  const endDate = position.status === 'Closed' && position.closing_date
    ? parseISO(position.closing_date)
    : new Date();

  return differenceInDays(endDate, startDate);
}

export function enrichPositionWithCalculations(position: Position): PositionWithCalculations {
  return {
    ...position,
    unrealized_pnl: calculateUnrealizedPnL(position),
    performance_pct: calculatePerformancePct(position),
    days_held: calculateDaysHeld(position),
  };
}

export function calculatePortfolioSize(positions: Position[]): number {
  return positions
    .filter(p => p.status === 'Live')
    .reduce((sum, p) => sum + p.cost_basis, 0);
}

export function calculateTotalUnrealizedPnL(positions: Position[]): number {
  return positions
    .filter(p => p.status === 'Live')
    .reduce((sum, p) => sum + calculateUnrealizedPnL(p), 0);
}

export function calculateTotalRealizedPnL(positions: Position[]): number {
  return positions
    .filter(p => p.status === 'Closed' && p.realized_pnl !== null)
    .reduce((sum, p) => sum + (p.realized_pnl || 0), 0);
}

export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function getStatusColor(status: Position['status']): string {
  switch (status) {
    case 'Live':
      return 'bg-emerald-500';
    case 'Draft':
      return 'bg-slate-400';
    case 'Closed':
      return 'bg-blue-500';
    case 'Archived':
      return 'bg-slate-600';
    default:
      return 'bg-slate-400';
  }
}

export function getPerformanceColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-slate-600';
}
