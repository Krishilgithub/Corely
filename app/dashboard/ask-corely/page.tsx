"use client";

import { useState } from "react";
import AskMain from "./components/AskMain";
import AskRightSidebar from "./components/AskRightSidebar";

export default function AskCorelyPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="db-content" style={{ height: "calc(100vh - 60px)", minHeight: "0", padding: "20px 28px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="ac-page-grid" style={{ height: "100%", minHeight: "0", display: "grid", gap: "24px", overflow: "hidden" }}>
        <AskMain
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          onNewMessage={handleRefresh}
          sharedPrompt={sharedPrompt}
          setSharedPrompt={setSharedPrompt}
        />
        <AskRightSidebar
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          refreshTrigger={refreshTrigger}
          setSharedPrompt={setSharedPrompt}
        />
      </div>
    </main>
  );
}
