'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Activity, Play, Pause, RotateCcw, AlertTriangle, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';

type DemoPhase = 'idle' | 'healthy' | 'failure' | 'detecting' | 'healing' | 'recovered' | 'complete';

interface PhaseInfo {
  phase: DemoPhase;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const phases: PhaseInfo[] = [
  { phase: 'healthy', title: 'Scraper Healthy', description: 'Bright Data collector is running normally. 1,284 records extracted with 97.8% quality.', icon: CheckCircle, color: 'text-emerald-500' },
  { phase: 'failure', title: 'Extraction Failed', description: 'Source website changed its HTML structure. CSS selectors returned 0 results. Title field: 0% completeness.', icon: AlertTriangle, color: 'text-red-500' },
  { phase: 'detecting', title: 'Failure Detected', description: 'Validation layer detected anomalies: title completeness dropped from 98% to 4%. Record count: 0.', icon: Activity, color: 'text-amber-500' },
  { phase: 'healing', title: 'Self-Healing Initiated', description: 'Bright Data Scraper Studio self-healing workflow triggered. Analyzing new page structure and adapting extraction logic.', icon: Zap, color: 'text-blue-500' },
  { phase: 'recovered', title: 'Extraction Repaired', description: 'Scraper adapted to new layout. Extraction logic updated. Validating output quality.', icon: RotateCcw, color: 'text-violet-500' },
  { phase: 'complete', title: '1,284 Records Recovered', description: 'Pipeline resumed. All data flowing into JobShield. Extraction quality restored to 97.8%.', icon: CheckCircle, color: 'text-emerald-500' },
];

function TimelineStep({ info, isActive, isComplete }: { info: PhaseInfo; isActive: boolean; isComplete: boolean }) {
  const Icon = info.icon;
  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-500 ${
      isActive ? 'bg-muted border border-emerald-500/20 shadow-sm' : isComplete ? 'opacity-100' : 'opacity-40'
    }`}>
      <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${
        isActive ? 'bg-emerald-500/20' : isComplete ? 'bg-emerald-500/10' : 'bg-muted'
      }`}>
        <Icon className={`h-5 w-5 ${isActive || isComplete ? info.color : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{info.title}</h3>
          {isActive && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">CURRENT</Badge>}
          {isComplete && <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">DONE</Badge>}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{info.description}</p>
      </div>
    </div>
  );
}

function SimulatedMetrics({ phase }: { phase: DemoPhase }) {
  const metrics: Record<DemoPhase, { records: number; quality: number; status: string; fields: Record<string, number> }> = {
    idle: { records: 0, quality: 0, status: 'IDLE', fields: { title: 0, company: 0, location: 0, description: 0 } },
    healthy: { records: 1284, quality: 97.8, status: 'HEALTHY', fields: { title: 99.2, company: 98.7, location: 97.1, description: 96.4 } },
    failure: { records: 0, quality: 0, status: 'FAILED', fields: { title: 4, company: 2, location: 0, description: 0 } },
    detecting: { records: 0, quality: 0, status: 'DEGRADED', fields: { title: 4, company: 2, location: 0, description: 0 } },
    healing: { records: 0, quality: 0, status: 'HEALING', fields: { title: 45, company: 38, location: 20, description: 15 } },
    recovered: { records: 890, quality: 89.5, status: 'RECOVERED', fields: { title: 95.0, company: 92.0, location: 88.0, description: 85.0 } },
    complete: { records: 1284, quality: 97.8, status: 'HEALTHY', fields: { title: 99.2, company: 98.7, location: 97.1, description: 96.4 } },
  };

  const m = metrics[phase];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Simulated Scraper Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Records</div>
            <div className="text-2xl font-bold">{m.records.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Quality</div>
            <div className="text-2xl font-bold">{m.quality}%</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">Collector Status</div>
          <Badge variant="outline" className={
            m.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            m.status === 'FAILED' || m.status === 'DEGRADED' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
            'bg-blue-500/10 text-blue-500 border-blue-500/20'
          }>
            <span className={`h-2 w-2 rounded-full mr-2 ${
              m.status === 'HEALTHY' ? 'bg-emerald-500' :
              m.status === 'FAILED' || m.status === 'DEGRADED' ? 'bg-red-500' : 'bg-blue-500'
            }`} />
            {m.status}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Field Completeness</div>
          {Object.entries(m.fields).map(([field, value]) => (
            <div key={field} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="capitalize">{field}</span>
                <span>{value}%</span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DemoPage() {
  const [phase, setPhase] = useState<DemoPhase>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const phaseOrder: DemoPhase[] = ['healthy', 'failure', 'detecting', 'healing', 'recovered', 'complete'];

  const advancePhase = useCallback(() => {
    setPhase(current => {
      const currentIdx = phaseOrder.indexOf(current);
      if (currentIdx < phaseOrder.length - 1) {
        return phaseOrder[currentIdx + 1];
      }
      setIsPlaying(false);
      return current;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isPlaying) return;

    const phaseIdx = phaseOrder.indexOf(phase);
    const totalPhases = phaseOrder.length;

    if (phaseIdx >= totalPhases - 1) {
      setIsPlaying(false);
      return;
    }

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          advancePhase();
          return 0;
        }
        return p + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isPlaying, phase, advancePhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDemo = () => {
    setPhase('healthy');
    setIsPlaying(true);
    setProgress(0);
    setTimeout(() => advancePhase(), 3000);
  };

  const resetDemo = () => {
    setPhase('idle');
    setIsPlaying(false);
    setProgress(0);
  };

  const stepForward = () => {
    advancePhase();
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Shield className="h-4.5 w-4.5 text-emerald-500" />
            </div>
            <span className="text-lg font-bold">JobShield</span>
            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">DEMO</Badge>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Open Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Self-Healing Demo</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Watch how JobShield detects extraction failures and recovers automatically.
            This demo simulates a source website layout change and the self-healing response.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 text-sm text-amber-500">
            <AlertTriangle className="h-4 w-4" />
            This is a simulated demonstration. Simulated events are clearly distinguished from real Bright Data events.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <Button
                onClick={isPlaying ? () => setIsPlaying(false) : startDemo}
                className="bg-emerald-500 hover:bg-emerald-600"
                disabled={phase === 'complete'}
              >
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {phase === 'idle' ? 'Start Demo' : isPlaying ? 'Pause' : 'Resume'}
              </Button>
              <Button variant="outline" onClick={resetDemo}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" onClick={stepForward} disabled={phase === 'complete' || isPlaying}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Step
              </Button>
            </div>

            {isPlaying && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Phase {phaseOrder.indexOf(phase) + 1} of {phaseOrder.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="space-y-2">
              {phases.map((p, i) => {
                const currentIdx = phaseOrder.indexOf(phase);
                return (
                  <TimelineStep
                    key={p.phase}
                    info={p}
                    isActive={currentIdx === i}
                    isComplete={currentIdx > i}
                  />
                );
              })}
            </div>

            {phase === 'complete' && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold mb-2">Self-Healing Complete</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      The website changed. The scraper adapted. The data kept flowing.
                    </p>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      View in Dashboard <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <SimulatedMetrics phase={phase} />
          </div>
        </div>
      </main>
    </div>
  );
}
