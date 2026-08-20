'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { HealingStatusBadge } from '@/components/dashboard/healing-status-badge';
import { HealingEvent } from '@/types/scraper';
import { HeartPulse, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';

export default function HealingEventsPage() {
  const [events, setEvents] = useState<HealingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/healing-events')
      .then(r => r.json())
      .then(data => { setEvents(data.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-red-500" />
          Healing Events
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Timeline of self-healing events when the scraper detected and recovered from extraction failures
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No healing events recorded yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <HealingStatusBadge status={event.healingStatus} />
                      <span className="text-sm text-muted-foreground font-mono">{event.collectorId}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Failure type: {event.failureType} | Failed field: {event.failedField}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.startedAt).toLocaleString()}
                  </span>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <span>Failed: {event.failedRecordCount.toLocaleString()} records</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-1.5 text-blue-500">
                      <Clock className="h-4 w-4" />
                      <span>Healing initiated</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <CheckCircle className="h-4 w-4" />
                      <span>Recovered: {event.recoveredRecordCount.toLocaleString()} records ({event.recoveryPercentage}%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-xs">
                    <div>
                      <div className="text-muted-foreground">Previous Records</div>
                      <div className="font-medium">{event.previousRecordCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Previous Completeness</div>
                      <div className="font-medium">{Math.round(event.previousCompleteness * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Current Completeness</div>
                      <div className="font-medium">{Math.round(event.currentCompleteness * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Recovery Time</div>
                      <div className="font-medium">
                        {event.completedAt
                          ? `${Math.round((new Date(event.completedAt).getTime() - new Date(event.startedAt).getTime()) / 1000)}s`
                          : 'In progress...'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual timeline */}
                <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1">
                  {['FAILURE', 'DETECTED', 'HEALING', 'RECOVERED'].map((step, i) => {
                    const isActive = (event.healingStatus === 'recovered' && i <= 3) ||
                      (event.healingStatus === 'healing' && i <= 2) ||
                      (event.healingStatus === 'detected' && i <= 1);
                    return (
                      <div key={step} className="flex items-center gap-2">
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          isActive
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {step}
                        </div>
                        {i < 3 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
