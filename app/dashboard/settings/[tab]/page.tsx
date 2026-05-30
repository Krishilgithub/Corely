import SettingsMain from "../components/SettingsMain";

export default async function SettingsTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = await params;
  return (
    <main className="db-content">
      <div className="set-page-grid">
        <SettingsMain currentTabSlug={resolvedParams.tab} />
      </div>
    </main>
  );
}
