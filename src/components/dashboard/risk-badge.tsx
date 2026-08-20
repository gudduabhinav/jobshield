import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskLevel } from '@/types/jobs';

interface RiskBadgeProps {
  level: RiskLevel;
  score: number;
  showScore?: boolean;
}

export function RiskBadge({ level, score, showScore = true }: RiskBadgeProps) {
  const config: Record<RiskLevel, { className: string; label: string }> = {
    LOW: { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'Low Risk' },
    MEDIUM: { className: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Needs Verification' },
    HIGH: { className: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'High Risk Signals' },
  };

  const { className, label } = config[level];

  return (
    <Badge variant="outline" className={cn('font-medium', className)}>
      {showScore ? `${score} - ${label}` : label}
    </Badge>
  );
}
