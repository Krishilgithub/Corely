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
      <div className="flex flex-col gap-8 mt-8">
        {BLOG_POSTS.map((post, idx) => (
          <div key={idx} className="p-6 rounded-2xl border border-black/5 hover:border-black/10 hover:shadow-sm transition-all bg-white cursor-pointer group">
            <div className="text-sm text-zinc-400 mb-2">{post.date}</div>
            <h3 className="text-xl font-bold text-zinc-900 group-hover:text-[#ff6b00] transition-colors mb-3 mt-0">{post.title}</h3>
            <p className="text-zinc-600 m-0">{post.excerpt}</p>
          </div>
        ))}
      </div>
    </SimplePageLayout>
  );
}
