import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Changelog | Corely",
  description: "New features and product updates.",
};

const LOGS = [
  {
    version: "v1.2.0",
    date: "October 18, 2023",
    title: "Linear Integration & Automated Workflows",
    features: [
      "Added official support for Linear integration.",
      "You can now create autonomous workflows directly from search results.",
      "Significant performance improvements to the Notion ingestion pipeline."
    ]
  },
  {
    version: "v1.1.5",
    date: "September 30, 2023",
    title: "Enhanced Permissions & Global Shortcut",
    features: [
      "Introduced granular access control for Enterprise workspaces.",
      "Added Ctrl+K shortcut for instant global search from anywhere in the dashboard.",
      "Fixed UI layout jumping bugs on the settings page."
    ]
  },
  {
    version: "v1.0.0",
    date: "August 1, 2023",
    title: "Public Beta Launch",
    features: [
      "Corely is now available in public beta.",
      "Connect Slack, GitHub, and Google Drive.",
      "Ask natural language questions to your entire organizational memory."
    ]
  }
];

export default function ChangelogPage() {
  return (
    <SimplePageLayout title="Changelog" description="See what's new in Corely.">
      {/* Timeline: the newest release gets the brand-coloured marker */}
      <div className="not-prose relative flex flex-col gap-12 ml-1.5 pl-8 border-l border-hairline">
        {LOGS.map((log, idx) => (
          <div key={idx} className="relative">
            <div
              className={`absolute -left-[39px] top-1 size-3 rounded-full ring-4 ring-canvas ${idx === 0 ? "bg-accent-fill" : "bg-border-strong"}`}
              aria-hidden="true"
            />
            <div className="text-sm font-medium text-text-tertiary mb-2">{log.date}</div>
            <h3 className="text-xl font-semibold tracking-tight text-text-primary mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              {log.title}
              <span className="inline-flex items-center h-6 px-2 rounded-md border border-hairline bg-surface-secondary font-mono text-xs font-medium text-text-secondary">{log.version}</span>
            </h3>
            <ul className="list-disc pl-5 space-y-2 marker:text-text-disabled">
              {log.features.map((feature, fIdx) => (
                <li key={fIdx} className="text-base leading-relaxed text-text-secondary">{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SimplePageLayout>
  );
}
