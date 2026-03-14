/**
 * Observability instrumentation for ZUZZ API
 *
 * Sentry: Initialized in index.ts when SENTRY_DSN is set.
 * OpenTelemetry: Prepared but not yet activated.
 *
 * To enable OTEL tracing:
 * 1. Install: pnpm --filter @zuzz/api add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-otlp-grpc
 * 2. Set OTEL_EXPORTER_OTLP_ENDPOINT in .env
 * 3. Uncomment the code below
 * 4. Import this file at the very top of index.ts (before all other imports)
 *
 * For Jaeger: OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
 * For Grafana Tempo: OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4317
 */

// import { NodeSDK } from '@opentelemetry/sdk-node';
// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc';
//
// const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
// if (endpoint) {
//   const sdk = new NodeSDK({
//     serviceName: 'zuzz-api',
//     traceExporter: new OTLPTraceExporter({ url: endpoint }),
//     instrumentations: [getNodeAutoInstrumentations({
//       '@opentelemetry/instrumentation-fs': { enabled: false },
//     })],
//   });
//   sdk.start();
//   process.on('SIGTERM', () => sdk.shutdown());
// }

export {};
