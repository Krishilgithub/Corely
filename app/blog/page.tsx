import { ArrowRight } from "lucide-react";
import SimplePageLayout from "../../components/landing/SimplePageLayout";

export const metadata = {
  title: "Blog | Corely",
  description: "Insights, updates, and deep dives from the Corely team.",
};

const BLOG_POSTS = [
  {
    title: "Introducing Corely: The Unified Intelligence Layer",
    date: "October 12, 2023",
    excerpt: "We're thrilled to announce the public beta of Corely. Say goodbye to lost knowledge and fragmented search across your organization.",
  },
  {
    title: "How We Built Sub-50ms Vector Search on Postgres",
    date: "September 28, 2023",
    excerpt: "A deep dive into our engineering architecture, leveraging pgvector and custom indexing strategies to deliver instant results.",
  },
  {
    title: "The Problem with Modern SaaS Fragmentation",
    date: "August 15, 2023",
    excerpt: "Why the average enterprise uses over 130 SaaS tools, and how this explosion of apps is actually making teams less productive.",
  }
];

export default function BlogPage() {
  return (
    <SimplePageLayout title="Blog" description="Thoughts on knowledge management, AI, and engineering.">
      <div className="not-prose flex flex-col gap-4">
        {BLOG_POSTS.map((post, idx) => (
          <div key={idx} className="group p-6 rounded-2xl border border-hairline bg-surface hover:border-border-strong transition-colors duration-200 cursor-pointer">
            <div className="text-sm font-medium text-text-tertiary mb-2">{post.date}</div>
            <h3 className="flex items-start justify-between gap-4 text-lg font-semibold tracking-tight text-text-primary mb-2">
              {post.title}
              <ArrowRight
                size={16}
                className="mt-1 shrink-0 text-icon-secondary transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </h3>
            <p className="text-base leading-relaxed text-text-secondary">{post.excerpt}</p>
          </div>
        ))}
      </div>
    </SimplePageLayout>
  );
}
