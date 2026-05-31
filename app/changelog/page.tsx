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
      "Corely is now available in public beta!",
      "Connect Slack, GitHub, and Google Drive.",
      "Ask natural language questions to your entire organizational memory."
    ]
  }
];

export default function ChangelogPage() {
  return (
    <SimplePageLayout title="Changelog" description="See what's new in Corely.">
      <div className="flex flex-col gap-12 mt-8 border-l border-zinc-200 pl-8 ml-4 relative">
        {LOGS.map((log, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-10 mt-1.5 w-4 h-4 rounded-full bg-[#ff6b00] border-4 border-white" />
            <div className="text-sm font-semibold text-[#ff6b00] mb-1">{log.date}</div>
            <h3 className="text-2xl font-bold text-zinc-900 mb-4 mt-0 flex items-center gap-3">
              {log.title}
              <span className="text-xs font-mono bg-zinc-100 text-zinc-500 px-2 py-1 rounded-md">{log.version}</span>
            </h3>
            <ul className="space-y-2 mt-0">
              {log.features.map((feature, fIdx) => (
                <li key={fIdx} className="text-zinc-600 m-0">{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SimplePageLayout>
  );
}
