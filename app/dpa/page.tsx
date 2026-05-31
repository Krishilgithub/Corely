import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Data Processing Agreement | Corely",
  description: "Corely's Data Processing Agreement (DPA).",
};

export default function DPAPage() {
  return (
    <SimplePageLayout title="Data Processing Agreement" description="Compliance and data processing terms for enterprise customers.">
      <h2>Overview</h2>
      <p>
        This Data Processing Agreement (&quot;DPA&quot;) forms part of the Master Services Agreement or Terms of Service between Corely and the customer. It governs the processing of personal data on behalf of our customers in accordance with GDPR, CCPA, and other applicable privacy laws.
      </p>
      <h2>Data Processing Roles</h2>
      <p>
        Corely acts as a Data Processor for the organizational data indexed through our integrations, and the Customer acts as the Data Controller.
      </p>
      <h2>Subprocessors</h2>
      <p>
        We use a limited set of strictly vetted subprocessors to provide our service, primarily for secure cloud hosting and essential infrastructure. A full list of our current subprocessors is available upon request.
      </p>
      <h2>Security and Compliance</h2>
      <p>
        We commit to maintaining robust technical and organizational security measures to protect your data, including SOC 2 compliance, end-to-end encryption, and routine external penetration testing.
      </p>
    </SimplePageLayout>
  );
}
