import SettingsMain from "./components/SettingsMain";

export const metadata = {
  title: "Settings — Corely Enterprise",
  description: "Manage your workspace, preferences, and configurations",
};

export default function SettingsPage() {
  return (
    <main className="db-content">
      <div className="set-page-grid">
        <SettingsMain />
      </div>
    </main>
  );
}
