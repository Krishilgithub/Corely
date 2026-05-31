import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Privacy Policy | Corely",
  description: "Corely's Privacy Policy.",
};

export default function PrivacyPage() {
  return (
    <SimplePageLayout title="Privacy Policy" description="Last updated: October 2023">
      <h2>1. Information We Collect</h2>
      <p>
        We collect information you provide directly to us, such as when you create an account, connect integrations (like Slack, GitHub, or Google Drive), request customer support, or otherwise communicate with us.
      </p>
      <h2>2. How We Use Your Information</h2>
      <p>
        We use the information we collect to provide, maintain, and improve our services, to develop new features, and to protect Corely and our users. Importantly, data indexed from your integrations is strictly isolated and never used to train generalized AI models shared across other customers.
      </p>
      <h2>3. Information Sharing</h2>
      <p>
        We do not share your personal information or indexed organizational data with third parties except as necessary to provide our services, comply with the law, or protect our rights.
      </p>
      <h2>4. Data Security</h2>
      <p>
        We take reasonable measures to help protect your information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. We use enterprise-grade encryption for data at rest and in transit.
      </p>
    </SimplePageLayout>
  );
}
