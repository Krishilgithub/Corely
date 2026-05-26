import WorkflowsLayout from "./components/WorkflowsLayout";

export const metadata = {
  title: "Workflows — Corely Enterprise",
  description: "Automate repetitive work and orchestrate intelligent actions across your organization.",
};

export default function WorkflowsPage() {
  return (
    <main className="db-content">
      <WorkflowsLayout />
    </main>
  );
}
