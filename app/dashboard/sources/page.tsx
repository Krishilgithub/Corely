import SourcesMain from "./components/SourcesMain";
import SourcesRightSidebar from "./components/SourcesRightSidebar";

export const metadata = {
  title: "Sources — Corely Enterprise",
  description: "Connect, manage, and monitor all your data sources",
};

export default function SourcesPage() {
  return (
    <main className="db-content">
      <div className="src-page-grid">
        <SourcesMain />
        <SourcesRightSidebar />
      </div>
    </main>
  );
}
