"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Database, Shield, Search, Workflow, BrainCircuit } from "lucide-react";
import { cn } from "../../lib/utils";
import { IconTile, SectionHeader, revealProps } from "./primitives";

const CONNECTORS = ["notion", "slack", "drive", "gmail", "linear"];

/* Visual for the large card: connector logos and two stacked result cards. */
function KnowledgeGraphVisual() {
  return (
    <div className="relative mt-8 flex flex-col gap-6 md:absolute md:mt-0 md:right-8 md:bottom-8 md:w-[46%] md:max-w-[340px]" aria-hidden="true">
      <div className="flex flex-wrap gap-3">
        {CONNECTORS.map((icon, i) => (
          <motion.div
            key={icon}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: "easeOut" }}
            className="group/logo size-11 rounded-xl border border-hairline bg-white shadow-2xs flex items-center justify-center p-2.5"
          >
            <Image
              src={`/${icon}.png`}
              alt={icon}
              width={24}
              height={24}
              className="w-full h-full object-contain grayscale opacity-80 transition duration-200 group-hover/logo:grayscale-0 group-hover/logo:opacity-100"
            />
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-hairline bg-surface-secondary p-4 flex gap-3">
          <span className="size-9 shrink-0 rounded-lg border border-hairline bg-surface flex items-center justify-center text-icon-secondary">
            <Database className="size-4" />
          </span>
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <div className="h-2.5 w-1/3 rounded-full bg-border-strong" />
            <div className="h-2 w-full rounded-full bg-hairline" />
            <div className="h-2 w-5/6 rounded-full bg-hairline" />
          </div>
        </div>

        <div className="relative rounded-xl border border-border-strong bg-surface p-4 flex gap-3 shadow-sm">
          <span className="ui-badge ui-badge--accent absolute -top-3 right-4">Semantic match</span>
          <span className="size-9 shrink-0 rounded-lg border border-hairline bg-surface-secondary flex items-center justify-center text-icon-primary">
            <BrainCircuit className="size-4" />
          </span>
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-2.5 w-1/2 rounded-full bg-text-secondary" />
            <div className="h-2 w-full rounded-full bg-hairline" />
            <div className="h-2 w-full rounded-full bg-hairline" />
            <div className="h-2 w-2/3 rounded-full bg-hairline" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureItem {
  id?: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  className: string;
  inverse?: boolean;
  visual?: React.ReactNode;
}

const features: FeatureItem[] = [
  {
    title: "Unified Knowledge Graph",
    description: "Corely connects to all your tools—Slack, Drive, Notion, GitHub—and builds a real-time organizational brain that understands deep semantic context.",
    icon: <Database />,
    className: "md:col-span-2 md:row-span-2 md:min-h-[420px]",
    visual: <KnowledgeGraphVisual />,
  },
  {
    title: "Instant Retrieval",
    description: "Sub-50ms semantic search across billions of documents.",
    icon: <Search />,
    className: "md:col-span-1",
  },
  {
    title: "Autonomous Agents",
    description: "Deploy workflows that execute multi-step tasks across your ecosystem without human intervention.",
    icon: <Workflow />,
    className: "md:col-span-1",
  },
  {
    id: "security",
    title: "Zero-Trust Architecture",
    description: "SOC2 Type II compliant. Your data never trains our models. Strict role-based access control.",
    icon: <Shield />,
    className: "md:col-span-3",
    inverse: true,
  },
];

const FeatureCard = ({ feature, index }: { feature: FeatureItem; index: number }) => {
  const inverse = feature.inverse;

  return (
    <motion.div
      id={feature.id}
      {...revealProps}
      transition={{ ...revealProps.transition, delay: index * 0.08 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 lg:p-8 transition-colors duration-200 scroll-mt-28",
        inverse
          ? "bg-text-primary text-text-inverse border-text-primary"
          : "bg-surface border-hairline hover:border-border-strong",
        feature.className
      )}
    >
      {inverse && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_left,#000,transparent_70%)]"
          aria-hidden="true"
        />
      )}

      <div className={cn("relative z-10 flex flex-col gap-5", feature.visual && "md:max-w-[48%]")}>
        {inverse ? (
          <span className="size-10 shrink-0 inline-flex items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--text-inverse)_20%,transparent)] [&_svg]:size-5">
            {feature.icon}
          </span>
        ) : (
          <IconTile>{feature.icon}</IconTile>
        )}
        <div className="flex flex-col gap-2">
          <h3 className={cn("text-xl font-semibold tracking-tight", !inverse && "text-text-primary")}>{feature.title}</h3>
          <p className={cn("text-sm sm:text-base leading-relaxed max-w-md", inverse ? "opacity-70" : "text-text-secondary")}>
            {feature.description}
          </p>
        </div>
      </div>

      {feature.visual}
    </motion.div>
  );
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32 bg-surface border-t border-hairline scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="The engine"
          title={
            <>
              A nervous system for <span className="block">modern enterprises.</span>
            </>
          }
          description="Built from the ground up for massive scale, unmatched speed, and uncompromising security."
          className="mb-14 lg:mb-16"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
