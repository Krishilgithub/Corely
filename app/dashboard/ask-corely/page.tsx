import AskMain from "./components/AskMain";
import AskRightSidebar from "./components/AskRightSidebar";

export const metadata = {
  title: "Ask Corely — Corely Enterprise",
  description: "Ask anything about your company",
};

export default function AskCorelyPage() {
  return (
    <main className="db-content">
      <div className="ac-page-grid">
        <AskMain />
        <AskRightSidebar />
      </div>
    </main>
  );
}
