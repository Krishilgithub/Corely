import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Terms of Service | Corely",
  description: "Corely's Terms of Service.",
};

export default function TermsPage() {
  return (
    <SimplePageLayout title="Terms of Service" description="Last updated: October 2023">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using the Corely service, you agree to be bound by these Terms of Service and all applicable laws and regulations.
      </p>
      <h2>2. Description of Service</h2>
      <p>
        Corely provides an enterprise intelligence layer that integrates with third-party services (e.g., Slack, GitHub) to index and query organizational data. We reserve the right to modify or discontinue the service at any time.
      </p>
      <h2>3. User Responsibilities</h2>
      <p>
        You are responsible for maintaining the security of your account and for all activities that occur under your account. You must ensure you have the appropriate rights and permissions to connect third-party integrations and process the associated data through Corely.
      </p>
      <h2>4. Limitation of Liability</h2>
      <p>
        In no event shall Corely be liable for any indirect, incidental, special, consequential or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of the service.
      </p>
    </SimplePageLayout>
  );
}
