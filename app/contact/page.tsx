import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Contact Us | Corely",
  description: "Get in touch with the Corely team.",
};

export default function ContactPage() {
  return (
    <SimplePageLayout title="Contact Us" description="We'd love to hear from you.">
      <h2>General Inquiries</h2>
      <p>
        For general questions, feedback, or press inquiries, please email us at <strong>hello@corely.ai</strong>.
      </p>
      <h2>Sales</h2>
      <p>
        Interested in Corely Enterprise? Contact our sales team at <strong>sales@corely.ai</strong> to schedule a demo and discuss your organization&apos;s needs.
      </p>
      <h2>Support</h2>
      <p>
        If you are an existing customer and need technical assistance, please visit our Help Center or email <strong>support@corely.ai</strong>.
      </p>
      <h2>Office Location</h2>
      <p>
        Corely Inc.<br />
        San Francisco, CA<br />
        United States
      </p>
    </SimplePageLayout>
  );
}
