import "../globals.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

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
    <div className="min-h-screen bg-white flex w-full relative">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Content offsets */}
      <div className="flex-1 flex flex-col min-w-0 pl-[240px]">
        {/* Fixed Topbar */}
        <Topbar />
        
        {/* Page Content area */}
        <div className="flex-1 mt-[64px]">
          {children}
        </div>
      </div>
    </div>
  );
}
