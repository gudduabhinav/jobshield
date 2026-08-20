import { BrightDataConfig, BrightDataCollectorRequest, BrightDataCollectorResponse } from './types';

export class BrightDataClient {
  private config: BrightDataConfig;

  constructor(config?: Partial<BrightDataConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.BRIGHT_DATA_API_KEY || '',
      collectorId: config?.collectorId || process.env.BRIGHT_DATA_COLLECTOR_ID || '',
      webhookUrl: config?.webhookUrl,
    };

    if (!this.config.apiKey) {
      console.warn('[BrightData] API key not configured. Running in demo mode.');
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.collectorId);
  }

  async runCollector(request?: Partial<BrightDataCollectorRequest>): Promise<BrightDataCollectorResponse> {
    if (!this.isConfigured) {
      throw new Error('Bright Data API not configured. Set BRIGHT_DATA_API_KEY and BRIGHT_DATA_COLLECTOR_ID.');
    }

    const collectorId = request?.collector_id || this.config.collectorId;

    try {
      const response = await fetch(`https://api.brightdata.com/datasets/v3/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collector: collectorId,
          url: request?.url || 'https://www.indeed.com',
          ...request?.params,
        }),
      });

      if (!response.ok) {
        throw new Error(`Bright Data API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id || `run-${Date.now()}`,
        status: 'completed',
        results: data.results || data.data || [],
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BrightData] Collector run failed:', message);
      throw error;
    }
  }

  async getCollectorStatus(collectorId: string): Promise<{ status: string; recordsCount: number }> {
    if (!this.isConfigured) {
      throw new Error('Bright Data API not configured.');
    }

    try {
      const response = await fetch(`https://api.brightdata.com/datasets/v3/status/${collectorId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

let clientInstance: BrightDataClient | null = null;

export function getBrightDataClient(): BrightDataClient {
  if (!clientInstance) {
    clientInstance = new BrightDataClient();
  }
  return clientInstance;
}
