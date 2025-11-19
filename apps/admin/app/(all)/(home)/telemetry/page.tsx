import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AHA Projects | Data collection and usage",
};

const telemetryPoints = [
  {
    title: "Instance admin details",
    body: "We store the instance admin’s name and email so we can share upgrade notices, security alerts, and other critical communications.",
  },
  {
    title: "Instance setup",
    body: "When you create an instance we record the instance ID to help troubleshoot upgrades, paid features, and support requests.",
  },
  {
    title: "Usage for billing",
    body: "Workspace, member, and role counts are used to power the Billing & Plans screen and ensure correct invoices.",
  },
  {
    title: "Application data",
    body: "We collect anonymized counts of projects, issues, cycles, modules, custom properties, comments, imports, and integrations to understand adoption.",
  },
  {
    title: "User interaction & behavior",
    body: "We analyze aggregate interactions—creating, updating, and deleting entities—to discover common journeys and friction points.",
  },
  {
    title: "Performance data",
    body: "Machine configuration, environment details, OS flavors, network throughput, and stack traces help us detect and prevent performance regressions.",
  },
];

const TelemetryPage = () => (
  <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12 text-custom-text-200">
    <header className="space-y-2">
      <p className="text-sm font-medium text-custom-text-300 uppercase tracking-wide">Data collection and usage</p>
      <h1 className="text-3xl font-semibold text-custom-text-100">How AHA Projects uses telemetry</h1>
      <p className="text-base leading-relaxed">
        AHA Projects collects anonymized data to enhance your experience, improve stability, and guide our product roadmap. We
        do not collect personally identifiable information (PII) beyond the instance admin’s email address, and none of the
        usage data is linked back to individual users.
      </p>
    </header>

    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-custom-text-100">What we collect</h2>
      <div className="grid gap-4">
        {telemetryPoints.map((point) => (
          <article key={point.title} className="rounded-lg border border-custom-border-200 bg-custom-background-90 p-5">
            <h3 className="text-lg font-semibold text-custom-text-100">{point.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-custom-text-200">{point.body}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-custom-text-100">Data sample</h2>
      <pre className="overflow-auto rounded-lg border border-custom-border-200 bg-custom-background-90 p-4 text-xs leading-6 text-custom-text-100">
{`{
  "Created At": "October 7, 2024, 1:50 PM",
  "Page Count": "14",
  "Is Telemetry Enabled": "true",
  "Updated At": "October 7, 2024, 1:50 PM",
  "User Count": "97",
  "Cycle Count": "62",
  "Cycle Issue Count": "710",
  "Module Issue Count": "428",
  "ID": "1234567890",
  "Updated By ID": null,
  "Current Version": "0.23.0",
  "Issue Count": "2,000",
  "Instance ID": "1234567890",
  "Latest Version": "0.23.0",
  "Module Count": "81",
  "Name": "Test",
  "Workspace Count": "11",
  "Project Count": "20"
}`}
      </pre>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-custom-text-100">How we use the data</h2>
      <ul className="grid gap-4">
        <li className="rounded-lg border border-custom-border-200 bg-custom-background-90 p-4">
          <h3 className="text-lg font-semibold text-custom-text-100">Improving your experience</h3>
          <p className="mt-1 text-sm leading-relaxed">
            Real-world usage signals help us simplify workflows and prioritize the most helpful improvements.
          </p>
        </li>
        <li className="rounded-lg border border-custom-border-200 bg-custom-background-90 p-4">
          <h3 className="text-lg font-semibold text-custom-text-100">Detecting and fixing bugs</h3>
          <p className="mt-1 text-sm leading-relaxed">
            Automatic error reporting shortens the time between a regression and its fix.
          </p>
        </li>
        <li className="rounded-lg border border-custom-border-200 bg-custom-background-90 p-4">
          <h3 className="text-lg font-semibold text-custom-text-100">Enhancing security</h3>
          <p className="mt-1 text-sm leading-relaxed">
            Monitoring for abnormal patterns helps us spot potential threats before they turn into incidents.
          </p>
        </li>
        <li className="rounded-lg border border-custom-border-200 bg-custom-background-90 p-4">
          <h3 className="text-lg font-semibold text-custom-text-100">Driving product decisions</h3>
          <p className="mt-1 text-sm leading-relaxed">
            Insights about adoption guide our roadmap toward high-impact features and smoother experiences.
          </p>
        </li>
      </ul>
    </section>

    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-custom-text-100">Disable telemetry</h2>
      <p className="text-sm leading-relaxed">
        Telemetry is optional. To opt out, open God Mode (`/god-mode`), locate the Telemetry toggle in General Settings, disable
        it, and click “Save changes.” Your instance will stop sending usage data immediately.
      </p>
    </section>
  </div>
);

export default TelemetryPage;

