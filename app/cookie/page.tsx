import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Cookie Policy | Corely",
  description: "Corely's Cookie Policy.",
};

export default function CookiePage() {
  return (
    <SimplePageLayout title="Cookie Policy" description="Last updated: October 2023">
      <h2>What Are Cookies</h2>
      <p>
        Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work, or work more efficiently, as well as to provide reporting information.
      </p>
      <h2>How We Use Cookies</h2>
      <p>
        We use cookies for several reasons:
      </p>
      <ul>
        <li><strong>Essential Cookies:</strong> Required for the operation of our platform, such as maintaining user sessions and authentication.</li>
        <li><strong>Analytics Cookies:</strong> Used to understand how visitors interact with our website to improve our services.</li>
        <li><strong>Preference Cookies:</strong> Used to remember your settings and preferences.</li>
      </ul>
      <h2>Managing Cookies</h2>
      <p>
        Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized to you.
      </p>
    </SimplePageLayout>
  );
}
