import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Careers | Corely",
  description: "Join our team to build the future of organizational intelligence.",
};

export default function CareersPage() {
  return (
    <SimplePageLayout title="Careers" description="Join us in building the future of organizational intelligence.">
      <h2>Why Corely?</h2>
      <p>
        Corely is an ambitious startup solving a fundamental problem for every modern organization: knowledge fragmentation. 
        We offer competitive compensation, comprehensive benefits, and the opportunity to work on deeply technical and challenging problems.
      </p>
      <h2>Open Roles</h2>
      <ul>
        <li>
          <strong>Senior Frontend Engineer</strong>
          <br />Remote (US/EU) - Help us build highly performant, beautiful interfaces using React, Next.js, and WebGL.
        </li>
        <li>
          <strong>Machine Learning Engineer</strong>
          <br />Remote (US/EU) - Improve our embedding models, retrieval-augmented generation pipelines, and core intelligence layer.
        </li>
        <li>
          <strong>Product Designer</strong>
          <br />Remote (US/EU) - Craft intuitive, deeply polished user experiences for complex data workflows.
        </li>
      </ul>
      <p>
        Don&apos;t see a role that fits? Email us at <strong>careers@corely.ai</strong> with your resume and a brief description of how you can contribute.
      </p>
    </SimplePageLayout>
  );
}
