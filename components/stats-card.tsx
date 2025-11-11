import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LucideIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: LucideIcon;
  iconColor?: string;
  tooltip?: string;
}

export function StatsCard({ label, value, change, icon: Icon, iconColor = 'text-blue-600', tooltip }: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-lg bg-opacity-10', iconColor.replace('text-', 'bg-'))}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
          {change && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded-full',
                change.positive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}
            >
              {change.positive ? '+' : ''}{change.value}
            </span>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
          <div className="flex items-center gap-1">
            <p className="text-sm text-slate-600">{label}</p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-slate-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
