import SettingsMain from "../components/SettingsMain";

export default async function SettingsTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const resolvedParams = await params;
  return (
    <SettingsMain currentTabSlug={resolvedParams.tab} />
  );
}
