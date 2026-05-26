import SettingsMain from "./components/SettingsMain";
import SettingsRightSidebar from "./components/SettingsRightSidebar";

export const metadata = {
  title: "Settings — Corely Enterprise",
  description: "Manage your workspace, preferences, and configurations",
};

export default function SettingsPage() {
  return (
    <main className="db-content">
      <div className="set-page-grid">
        <SettingsMain />
        <SettingsRightSidebar />
      </div>
    </main>
  );
}
