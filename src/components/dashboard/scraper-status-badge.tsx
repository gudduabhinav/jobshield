import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScraperStatus } from '@/types/jobs';

interface ScraperStatusBadgeProps {
  status: ScraperStatus;
}

export function ScraperStatusBadge({ status }: ScraperStatusBadgeProps) {
  const config: Record<ScraperStatus, { className: string; dotColor: string }> = {
    HEALTHY: { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', dotColor: 'bg-emerald-500' },
    DEGRADED: { className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', dotColor: 'bg-amber-500' },
    FAILED: { className: 'bg-red-500/10 text-red-500 border-red-500/20', dotColor: 'bg-red-500' },
    HEALING: { className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', dotColor: 'bg-blue-500' },
    RECOVERED: { className: 'bg-violet-500/10 text-violet-500 border-violet-500/20', dotColor: 'bg-violet-500' },
    IDLE: { className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20', dotColor: 'bg-zinc-400' },
  };

  const { className, dotColor } = config[status];

  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      <span className={cn('h-2 w-2 rounded-full mr-2', dotColor)} />
      {status}
    </Badge>
  );
}
