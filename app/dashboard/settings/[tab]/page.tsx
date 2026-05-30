import SettingsMain from "../components/SettingsMain";

export default async function SettingsTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = await params;
  return (
    <div style={{ minWidth: 0, width: "100%" }}>
      <SettingsMain currentTabSlug={resolvedParams.tab} />
    </div>
  );
}
