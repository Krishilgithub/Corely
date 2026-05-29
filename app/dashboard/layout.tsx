import "../globals.css";
import "./dashboard.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { Toaster } from "sonner";

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
    <div className="db-layout">
      <Sidebar />
      <Topbar />
      <div className="db-page-wrapper">{children}</div>
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
