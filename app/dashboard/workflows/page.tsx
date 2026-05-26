import WorkflowsMain from "./components/WorkflowsMain";
import WorkflowsRightSidebar from "./components/WorkflowsRightSidebar";

export const metadata = {
  title: "Workflows — Corely Enterprise",
  description: "Automate repetitive work and orchestrate intelligent actions across your organization.",
};

export default function WorkflowsPage() {
  return (
    <main className="db-content">
      <div className="wf-page-grid">
        <WorkflowsMain />
        <WorkflowsRightSidebar />
      </div>
    </main>
  );
}
