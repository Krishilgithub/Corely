"use client";

import { useEffect, useState } from "react";
import AskMain from "./components/AskMain";
import AskRightSidebar from "./components/AskRightSidebar";

export default function AskCorelyPage() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);
  // Context panel on the right. Hiding it gives the chat the full page width.
  const [contextOpen, setContextOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem("corely-ask-context") === "hidden") setContextOpen(false);
    } catch {}
  }, []);

  const toggleContext = () => {
    setContextOpen((open) => {
      try { localStorage.setItem("corely-ask-context", open ? "hidden" : "shown"); } catch {}
      return !open;
    });
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    // Layout lives in ask-corely.css: header on top, chat on the left, sidebar on the right.
    <main className="db-content ac-page">
      <div className={`ac-page-grid${contextOpen ? "" : " ac-page-grid--wide"}`}>
        <AskMain
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          onNewMessage={handleRefresh}
          sharedPrompt={sharedPrompt}
          setSharedPrompt={setSharedPrompt}
          contextOpen={contextOpen}
          onToggleContext={toggleContext}
        />
        {contextOpen && (
        <AskRightSidebar
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          refreshTrigger={refreshTrigger}
          setSharedPrompt={setSharedPrompt}
        />
        )}
      </div>
    </main>
  );
}
