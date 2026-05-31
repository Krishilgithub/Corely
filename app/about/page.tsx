import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "About Us | Corely",
  description: "Learn more about the team building the intelligence layer for modern organizations.",
};

export default function AboutPage() {
  return (
    <SimplePageLayout title="About Us" description="We are building the intelligence layer for modern organizations.">
      <h2>Our Mission</h2>
      <p>
        At Corely, we believe that organizational knowledge should not be fragmented across dozens of different SaaS tools. 
        Our mission is to create a seamless, unified intelligence layer that connects to everything your team uses—from Slack 
        to GitHub, Notion, and Google Drive—and makes that knowledge instantly accessible, queryable, and actionable.
      </p>
      <h2>The Team</h2>
      <p>
        We are a passionate team of engineers, designers, and product builders who have experienced the pain of lost institutional 
        knowledge firsthand. We are backed by top-tier investors and are rapidly growing.
      </p>
      <h2>Join Us</h2>
      <p>
        We are always looking for exceptional talent to join our mission. Check out our <a href="/careers">Careers page</a> for open roles.
      </p>
    </SimplePageLayout>
  );
}
