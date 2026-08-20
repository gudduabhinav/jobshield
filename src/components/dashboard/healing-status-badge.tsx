import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HealingStatus } from '@/types/scraper';

interface HealingStatusBadgeProps {
  status: HealingStatus;
}

export function HealingStatusBadge({ status }: HealingStatusBadgeProps) {
  const config: Record<HealingStatus, { className: string; label: string }> = {
    detected: { className: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Detected' },
    healing: { className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Healing' },
    recovered: { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Recovered' },
    failed: { className: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Failed' },
  };

  const { className, label } = config[status];

  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      {label}
    </Badge>
  );
}
