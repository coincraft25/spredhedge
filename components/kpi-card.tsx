import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  suffix?: string;
}

export function KpiCard({ label, value, trend, suffix = '' }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-slate-900">
              {value}
              {suffix}
            </p>
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.direction === 'up' ? (
                  <ArrowUp className="h-4 w-4" />
                ) : (
                  <ArrowDown className="h-4 w-4" />
                )}
                <span>{trend.value}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
