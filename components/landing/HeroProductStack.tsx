"use client";

import React from "react";
import Image from "next/image";
import {
  ArrowUp,
  BarChart2,
  Brain,
  FileText,
  Home,
  Link2,
  MessageSquare,
  Plus,
  Users,
  Zap,
} from "lucide-react";
import CorelyLogo from "@/components/icons/corely-logo";
import { cn } from "../../lib/utils";

/*
 * Hero visual: three Corely app windows stacked like stairs in 3D.
 * Built with plain HTML and CSS (no screenshots, no WebGL) so it stays light
 * and follows the theme. Back = Sources, middle = Home dashboard, front = Ask Corely.
 * Hovering the stack eases it toward a flatter angle.
 */

function WindowChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 h-9 px-3.5 border-b border-hairline bg-surface-secondary">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-2.5 rounded-full bg-border-strong" />
      ))}
      <span className="ml-2 font-mono text-xs font-medium text-text-tertiary">{title}</span>
    </div>
  );
}

function AppLogo({ src, alt, size = 16 }: { src: string; alt: string; size?: number }) {
  return (
    <span className="inline-flex items-center justify-center size-7 shrink-0 rounded-md border border-hairline bg-white">
      <Image src={src} alt={alt} width={size} height={size} className="object-contain grayscale" />
    </span>
  );
}

const SOURCE_ROWS = [
  { name: "Slack", icon: "/slack.png", meta: "2m ago", status: "Synced" },
  { name: "Google Drive", icon: "/drive.png", meta: "5m ago", status: "Synced" },
  { name: "Notion", icon: "/notion.png", meta: "Now", status: "Syncing" },
  { name: "Gmail", icon: "/gmail.png", meta: "12m ago", status: "Synced" },
];

function SourcesWindow() {
  return (
    <div className="h-[300px] p-5 flex flex-col gap-4 bg-surface">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-text-primary">Sources</span>
          <span className="text-xs font-medium text-text-tertiary">Connected tools</span>
        </div>
        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-hairline bg-surface text-text-primary text-xs font-semibold">
          <Plus className="size-3.5" />
          Add source
        </span>
      </div>
      <div className="rounded-xl border border-hairline overflow-hidden divide-y divide-hairline">
        {SOURCE_ROWS.map((row) => (
          <div key={row.name} className="flex items-center gap-3 h-12 px-4">
            <AppLogo src={row.icon} alt={row.name} />
            <span className="text-sm font-medium text-text-primary">{row.name}</span>
            <span className="ml-auto text-xs font-medium text-text-tertiary">{row.meta}</span>
            <span className={cn("ui-badge", row.status === "Synced" ? "ui-badge--success" : "ui-badge--warning")}>
              <span className="ui-dot" />
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const NAV = [
  { icon: Home, label: "Home", active: true },
  { icon: MessageSquare, label: "Ask Corely" },
  { icon: Brain, label: "Memory" },
  { icon: BarChart2, label: "Insights" },
  { icon: Link2, label: "Sources" },
  { icon: Users, label: "Teams" },
];

const KPIS = [
  { icon: Brain, label: "Documents", value: "12.4k" },
  { icon: Zap, label: "Interactions", value: "1,208" },
  { icon: BarChart2, label: "Coverage", value: "86%" },
  { icon: Link2, label: "Sources", value: "6" },
];

const BARS = [28, 36, 32, 44, 40, 52, 48, 60, 56, 68, 64, 78, 74, 90];

function DashboardWindow() {
  return (
    <div className="h-[320px] flex bg-surface">
      <aside className="w-[150px] shrink-0 border-r border-hairline bg-canvas p-3 flex flex-col gap-1">
        <div className="flex items-center gap-2 h-9 px-2 mb-1 text-text-primary">
          <CorelyLogo size={16} />
          <span className="text-sm font-bold tracking-tight">Corely</span>
        </div>
        {NAV.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2 h-8 px-2 rounded-md text-xs font-medium",
              active ? "bg-accent-fill text-accent-fg" : "text-text-secondary"
            )}
          >
            <Icon className={cn("size-3.5", !active && "text-icon-secondary")} />
            {label}
          </div>
        ))}
      </aside>

      <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-medium tracking-tight text-text-primary">Home</span>
          <span className="text-xs font-medium text-text-tertiary">Across your organization today</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {KPIS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start justify-between h-[58px] p-3 rounded-lg border border-hairline bg-surface">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-text-tertiary leading-none">{label}</span>
                <span className="text-lg font-semibold tracking-tight tabular-nums leading-none text-text-primary">{value}</span>
              </div>
              <span className="inline-flex items-center justify-center size-6 rounded-md border border-hairline bg-surface-secondary text-icon-primary">
                <Icon className="size-3" />
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 rounded-lg border border-hairline p-3 flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-primary">Knowledge growth</span>
          <div className="flex-1 flex items-end gap-1.5 border-b border-dashed border-hairline">
            {BARS.map((h, i) => (
              <span
                key={i}
                className={cn(
                  "flex-1 rounded-t-[3px]",
                  i === BARS.length - 1
                    ? "bg-accent-fill"
                    : "bg-[linear-gradient(to_top,var(--text-tertiary),var(--border-strong))]"
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Citation({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center align-text-top mx-0.5 h-4 min-w-4 px-1 rounded border border-hairline bg-surface-secondary text-[10px] font-semibold leading-none text-text-secondary">
      {n}
    </span>
  );
}

function AskWindow() {
  return (
    <div className="h-[320px] p-4 flex flex-col gap-3 bg-surface">
      <div className="self-end max-w-[78%] rounded-xl rounded-br-sm border border-hairline bg-surface-secondary px-3 py-2 text-sm text-text-primary">
        What did we decide about the Q3 launch date?
      </div>

      <div className="flex gap-2.5">
        <span className="inline-flex items-center justify-center size-7 shrink-0 rounded-lg border border-hairline bg-surface text-text-primary">
          <CorelyLogo size={16} />
        </span>
        <div className="flex flex-col gap-2.5 min-w-0">
          <p className="text-sm leading-5 text-text-primary">
            The launch moved to 14 October so the new onboarding flow ships first
            <Citation n={1} />. Marketing owns the announcement, and sales outreach starts one week earlier
            <Citation n={2} />.
          </p>
          <div className="flex gap-2">
            {[
              { icon: "/slack.png", title: "#launch-q3", meta: "Slack" },
              { icon: "/notion.png", title: "Launch plan", meta: "Notion" },
            ].map((s) => (
              <div key={s.title} className="flex items-center gap-2 h-10 pl-1.5 pr-3 rounded-lg border border-hairline bg-canvas">
                <AppLogo src={s.icon} alt={s.meta} size={14} />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold leading-4 text-text-primary">{s.title}</span>
                  <span className="text-[10px] font-medium leading-3 text-text-tertiary">{s.meta}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1.5 h-10 px-3 rounded-lg border border-dashed border-hairline text-xs font-medium text-text-tertiary">
              <FileText className="size-3.5" />
              +3
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center h-10 pl-3 pr-1.5 rounded-lg border border-hairline bg-surface">
        <span className="text-sm text-text-disabled">Ask anything about your company</span>
        <span className="ml-auto inline-flex items-center justify-center size-7 rounded-md bg-text-primary text-text-inverse">
          <ArrowUp className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

export default function HeroProductStack() {
  return (
    <div
      className="group relative w-full h-[260px] sm:h-[420px] md:h-[480px] xl:h-[560px] select-none"
      aria-hidden="true"
    >
      {/* Fixed 760x560 stage, scaled to fit each breakpoint. The 3D tilt starts at md (768px). */}
      <div className="absolute top-1/2 left-1/2 lg:left-0 w-[760px] h-[560px] -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 origin-center lg:origin-left scale-[0.42] sm:scale-[0.7] md:scale-[0.8] lg:scale-[0.7] xl:scale-[0.9] [perspective:1400px]">
        <div className="relative w-full h-full [transform-style:preserve-3d] md:[transform:rotateY(-18deg)_rotateX(12deg)_rotateZ(2deg)] md:group-hover:[transform:rotateY(-8deg)_rotateX(6deg)_rotateZ(1deg)] transition-transform duration-700 ease-out">
          {/* Stair 1 (back): Sources */}
          <div className="absolute top-0 left-0 z-10 w-[560px] rounded-lg overflow-hidden border border-hairline bg-surface shadow-xl opacity-90 [transform:translateZ(0px)] md:group-hover:[transform:translate3d(-16px,-16px,-20px)] transition-transform duration-500 ease-out">
            <WindowChrome title="Sources" />
            <SourcesWindow />
          </div>

          {/* Stair 2 (middle): Home dashboard */}
          <div className="absolute top-[100px] left-[90px] z-20 w-[560px] rounded-lg overflow-hidden border border-hairline bg-surface shadow-2xl [transform:translateZ(50px)]">
            <WindowChrome title="Home" />
            <DashboardWindow />
          </div>

          {/* Stair 3 (front): Ask Corely */}
          <div className="absolute top-[200px] left-[180px] z-30 w-[560px] rounded-lg overflow-hidden border border-border-strong bg-surface shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] [transform:translateZ(100px)] md:group-hover:[transform:translate3d(16px,16px,100px)] transition-transform duration-500 ease-out">
            <WindowChrome title="Ask Corely" />
            <AskWindow />
          </div>
        </div>
      </div>
    </div>
  );
}
