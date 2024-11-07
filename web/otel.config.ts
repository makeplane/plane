import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import packageConfig from "./package.json";

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "plane-ce-web",
    [ATTR_SERVICE_VERSION]: packageConfig.version || "1.0.0",
  }),
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTEL_COLLECTOR_URL || "https://telemetry.plane.so/v1/traces",
    })
  ),
});

// Handle shutdown gracefully
process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("SDK shut down successfully"))
    .catch((error) => console.log("Error shutting down SDK", error))
    .finally(() => process.exit(0));
});

sdk.start();
