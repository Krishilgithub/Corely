"use client";

import { motion } from "framer-motion";
import { Clock, Network, AlertTriangle, TrendingDown, LayoutGrid, Hourglass, SearchX } from "lucide-react";
import { IconTile, SectionHeader, landingCard, revealProps } from "./primitives";

const problems = [
  {
    title: "Time lost searching",
    description: "Teams waste hours searching across tools.",
    icon: <Clock />,
  },
  {
    title: "Knowledge silos",
    description: "Critical insights stay trapped in isolated systems.",
    icon: <Network />,
  },
  {
    title: "Delayed decisions",
    description: "Disconnected context slows business execution.",
    icon: <AlertTriangle />,
  },
];

const stats = [
  {
    value: "30%",
    label: "Productivity lost",
    icon: <TrendingDown />,
  },
  {
    value: "8+",
    label: "Tools per team",
    icon: <LayoutGrid />,
  },
  {
    value: "Hours",
    label: "Wasted weekly",
    icon: <Hourglass />,
  },
  {
    value: "Critical",
    label: "Context missing",
    icon: <SearchX />,
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="relative py-24 lg:py-32 bg-surface border-t border-hairline text-text-primary scroll-mt-24">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="The fragmentation crisis"
          title={
            <>
              Your knowledge is everywhere.{" "}
              <span className="block text-text-tertiary">Your intelligence is nowhere.</span>
            </>
          }
          description="Modern organizations operate across disconnected tools, fragmented conversations, and siloed systems—making knowledge impossible to access when it matters most."
          className="mb-14 lg:mb-16"
        />

        {/* Stats strip: one hairline grid, four cells */}
        <motion.div
          {...revealProps}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline mb-6"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-6 p-6 lg:p-8 bg-surface">
              <IconTile size="sm">{stat.icon}</IconTile>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tracking-tight tabular-nums text-text-primary">{stat.value}</span>
                <span className="text-sm font-medium text-text-tertiary">{stat.label}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Problem cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              {...revealProps}
              transition={{ ...revealProps.transition, delay: 0.1 + i * 0.08 }}
              className={`${landingCard} p-6 flex items-start gap-4`}
            >
              <IconTile>{problem.icon}</IconTile>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-base font-semibold tracking-tight text-text-primary">{problem.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{problem.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
