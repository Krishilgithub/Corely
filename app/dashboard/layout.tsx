import "../globals.css";
// Order matters: these files were split out of one dashboard.css and must load
// in the same order so the cascade stays the same.
import "./dashboard.css";
import "./ask-corely/ask-corely.css";
import "./sources/sources.css";
import "./settings/settings.css";
import "./workflows/workflows-page.css";
import "./dashboard-responsive.css";
import "./settings/settings-layout.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { Toaster } from "sonner";
import { CommandPalette } from "./components/CommandPalette";

export const metadata = {
  title: "Dashboard — Corely",
  description: "Your enterprise intelligence dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="db-layout">
        <Sidebar />
        <Topbar />
        <main className="db-page-wrapper">
          {/* Every page sits inside one bordered page card on the canvas. */}
          <div className="db-page-shell">{children}</div>
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "db-toast",
              title: "db-toast-title",
              description: "db-toast-description",
            },
          }}
        />
        <CommandPalette />
      </div>
    </>
  );
}
