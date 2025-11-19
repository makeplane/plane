// Telemetry stub interface
export interface TelemetryProvider {
  capture(event: string, properties?: Record<string, any>): void;
  identify(userId: string, traits?: Record<string, any>): void;
  group(groupName: string, groupId: string, properties?: Record<string, any>): void;
  page(name: string, properties?: Record<string, any>): void;
  reset?(): void;
}

// No-op implementation
export class NoOpTelemetry implements TelemetryProvider {
  capture(_event: string, _properties?: Record<string, any>): void {
    // No-op
  }
  identify(_userId: string, _traits?: Record<string, any>): void {
    // No-op
  }
  group(_groupName: string, _groupId: string, _properties?: Record<string, any>): void {
    // No-op
  }
  page(_name: string, _properties?: Record<string, any>): void {
    // No-op
  }
  reset(): void {
    // No-op
  }
}

// PostHog adapter (can be disabled)
export class PostHogTelemetry implements TelemetryProvider {
  private posthog: any = null;
  private initialized: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
    const enableTelemetry = process.env.NEXT_PUBLIC_ENABLE_TELEMETRY !== 'false';

    if (!enableTelemetry || !posthogKey) {
      return;
    }

    try {
      const posthogModule = await import('posthog-js');
      posthogModule.default.init(posthogKey, {
        api_host: posthogHost,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
      });
      this.posthog = posthogModule.default;
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize PostHog telemetry:', error);
    }
  }

  capture(event: string, properties?: Record<string, any>): void {
    this.posthog?.capture(event, properties);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    this.posthog?.identify(userId, traits);
  }

  group(groupName: string, groupId: string, properties?: Record<string, any>): void {
    this.posthog?.group(groupName, groupId, properties);
  }

  page(name: string, properties?: Record<string, any>): void {
    this.posthog?.capture('$pageview', { page: name, ...properties });
  }

  reset(): void {
    this.posthog?.reset();
  }
}

// Factory function
let telemetryInstance: TelemetryProvider | null = null;

export function createTelemetry(): TelemetryProvider {
  if (telemetryInstance) {
    return telemetryInstance;
  }

  const enableTelemetry = process.env.NEXT_PUBLIC_ENABLE_TELEMETRY !== 'false';
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (enableTelemetry && posthogKey && typeof window !== 'undefined') {
    telemetryInstance = new PostHogTelemetry();
  } else {
    telemetryInstance = new NoOpTelemetry();
  }

  return telemetryInstance;
}

// Export singleton instance
export const telemetry = createTelemetry();

