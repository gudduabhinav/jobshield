export interface BrightDataConfig {
  apiKey: string;
  collectorId: string;
  webhookUrl?: string;
}

export interface BrightDataCollectorRequest {
  collector_id: string;
  url: string;
  params?: Record<string, string | number | boolean>;
}

export interface BrightDataCollectorResponse {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Record<string, unknown>[];
  error?: string;
  started_at: string;
  completed_at?: string;
}

export interface BrightDataWebhookPayload {
  collector_id: string;
  status: string;
  results: Record<string, unknown>[];
  error?: string;
  timestamp: string;
}
