"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AskMain from "./components/AskMain";
import AskRightSidebar from "./components/AskRightSidebar";

// useSearchParams needs a Suspense boundary in Next 15.
export default function AskCorelyPage() {
  return (
    <Suspense fallback={<main className="db-content ac-page" />}>
      <AskCorelyContent />
    </Suspense>
  );
}

function AskCorelyContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // "?q=" comes from links elsewhere (Topbar, Insights, ...).
  const urlQuestion = searchParams.get("q")?.trim() || null;
  const handledQuestion = useRef<string | null>(null);

  // "?session=" reopens a conversation (for example a shared link).
  // A "?q=" link always starts a new conversation instead.
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() =>
    urlQuestion ? null : searchParams.get("session")
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sharedPrompt, setSharedPrompt] = useState<string | null>(null);
  // Context panel on the right. Hiding it gives the chat the full page width.
  const [contextOpen, setContextOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem("corely-ask-context") === "hidden") setContextOpen(false);
    } catch {}
  }, []);

  // Send a "?q=" question once, in a new conversation. AskMain sends whatever
  // lands in sharedPrompt. The ref stops a second send before "q" leaves the URL.
  useEffect(() => {
    if (!urlQuestion) {
      handledQuestion.current = null;
      return;
    }
    if (handledQuestion.current === urlQuestion) return;
    handledQuestion.current = urlQuestion;
    setActiveSessionId(null);
    setSharedPrompt(urlQuestion);
  }, [urlQuestion]);

  // Keep the open conversation in the URL, and drop "?q=" so a refresh does not ask again.
  useEffect(() => {
    const urlSession = searchParams.get("session");
    if (urlSession === activeSessionId && !searchParams.has("q")) return;
    const next = activeSessionId ? `${pathname}?session=${encodeURIComponent(activeSessionId)}` : pathname;
    router.replace(next, { scroll: false });
  }, [activeSessionId, pathname, router, searchParams]);

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
