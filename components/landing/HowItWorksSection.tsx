"use client";

import { motion } from "framer-motion";
import { Orbit, Database, Network, Zap, Layers, History, Lightbulb, Lock, Users } from "lucide-react";
import { IconTile, SectionHeader, landingCard, revealProps } from "./primitives";

const mainFeatures = [
  {
    title: "Context Engine",
    description: "Understands people, teams, projects and workflows across your entire organization.",
    icon: <Orbit />,
  },
  {
    title: "Memory Layer",
    description: "Retains knowledge that matters across time and tools — nothing gets lost.",
    icon: <Database />,
  },
  {
    title: "Reasoning Core",
    description: "Synthesizes insights from complex, fragmented data to surface what matters most.",
    icon: <Network />,
  },
  {
    title: "Action Engine",
    description: "Takes action across tools and systems on your behalf — automatically.",
    icon: <Zap />,
  },
];

const smallFeatures = [
  {
    title: "Unified context",
    description: "Brings all your data and teams into one understanding.",
    icon: <Layers />,
  },
  {
    title: "Persistent memory",
    description: "Remembers what matters across time, projects, and people.",
    icon: <History />,
  },
  {
    title: "Intelligent reasoning",
    description: "Understands relationships, patterns, and what's really important.",
    icon: <Lightbulb />,
  },
  {
    title: "Action at scale",
    description: "Executes across systems so your team can move faster.",
    icon: <Zap />,
  },
  {
    title: "Enterprise grade",
    description: "Built with security, privacy, and compliance at every layer.",
    icon: <Lock />,
  },
  {
    title: "People amplified",
    description: "AI that empowers people — not replaces them.",
    icon: <Users />,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 bg-canvas border-t border-hairline scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Corely intelligence layer"
          title={
            <>
              One layer. <span className="text-text-tertiary">Infinite intelligence.</span>
            </>
          }
          description="Corely connects your data, understands your context, builds memory that lasts, and powers intelligent action across your organization."
          className="mb-14 lg:mb-16"
        />

        {/* Four engine cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {mainFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              {...revealProps}
              transition={{ ...revealProps.transition, delay: i * 0.08 }}
              className={`${landingCard} p-6 lg:p-8 flex items-start gap-5`}
            >
              <IconTile>{feature.icon}</IconTile>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-text-primary">{feature.title}</h3>
                <p className="text-sm sm:text-base leading-relaxed text-text-secondary max-w-md">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Six small benefits in one hairline grid */}
        <motion.div
          {...revealProps}
          transition={{ ...revealProps.transition, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline"
        >
          {smallFeatures.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4 p-6 bg-surface">
              <IconTile size="sm">{feature.icon}</IconTile>
              <div className="flex flex-col gap-1">
                <h4 className="text-sm font-semibold text-text-primary">{feature.title}</h4>
                <p className="text-sm leading-relaxed text-text-secondary">{feature.description}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
