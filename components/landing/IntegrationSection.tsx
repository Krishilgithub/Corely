"use client";

import Image from "next/image";
import React from "react";
import CorelyLogo from "@/components/icons/corely-logo";
import { SectionHeader } from "./primitives";

const APP_ICONS = [
  { icon: "/slack.png", name: "Slack", radius: 150, duration: 25, delay: 0 },
  { icon: "/drive.png", name: "Google Drive", radius: 150, duration: 25, delay: 12.5 },

  { icon: "/linear.png", name: "Linear", radius: 250, duration: 35, delay: 5 },
  { icon: "/notion.png", name: "Notion", radius: 250, duration: 35, delay: 22.5 },

  { icon: "/gmail.png", name: "Gmail", radius: 350, duration: 45, delay: 0 },
  { icon: "/file.svg", name: "Manual Documents", radius: 350, duration: 45, delay: 22.5 },
];

export default function IntegrationSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-canvas overflow-hidden border-t border-hairline">
      <div className="max-w-6xl mx-auto px-6">
        <SectionHeader
          eyebrow="Ecosystem integrations"
          title="Connects to everything."
          description="Out-of-the-box integrations with the tools your team already uses. Corely binds your fragmented ecosystem into a single, cohesive intelligence layer."
          className="mb-8 lg:mb-12"
        />
      </div>

      {/* Orbit: fades out at the edges, scales down on small screens */}
      <div className="relative w-full h-[420px] sm:h-[520px] md:h-[640px] flex items-center justify-center overflow-hidden [mask-image:radial-gradient(ellipse_at_center,#000_45%,transparent_72%)]">
        <div className="relative w-[760px] h-[760px] shrink-0 flex items-center justify-center scale-[0.55] sm:scale-75 md:scale-100">
          {/* Orbital rings */}
          <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-border-strong" />
          <div className="absolute w-[500px] h-[500px] rounded-full border border-dashed border-hairline" />
          <div className="absolute w-[700px] h-[700px] rounded-full border border-dashed border-hairline" />

          {/* Central Corely mark */}
          <div className="absolute z-20 flex items-center justify-center size-28 rounded-3xl border border-hairline bg-surface shadow-[0_0_0_10px_var(--accent-wash)]">
            <div className="flex items-center justify-center size-16 rounded-2xl border border-hairline bg-surface-secondary text-text-primary">
              <CorelyLogo size={36} />
            </div>
          </div>

          {/* Orbiting apps */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {APP_ICONS.map((app, i) => (
              <div
                key={i}
                className="landing-orbit absolute left-1/2 top-1/2"
                style={{
                  width: `${app.radius * 2}px`,
                  height: `${app.radius * 2}px`,
                  marginLeft: `-${app.radius}px`,
                  marginTop: `-${app.radius}px`,
                  animationDuration: `${app.duration}s`,
                  animationDelay: `-${app.delay}s`,
                }}
              >
                {/* The tile spins the other way so it stays upright */}
                <div
                  className="landing-orbit-counter group absolute top-0 left-1/2 -ml-7 -mt-7 size-14 rounded-2xl border border-hairline bg-white shadow-2xs flex items-center justify-center pointer-events-auto cursor-pointer transition-colors duration-200 hover:border-border-strong"
                  style={{
                    animationDuration: `${app.duration}s`,
                    animationDelay: `-${app.delay}s`,
                  }}
                >
                  <div className="relative size-6">
                    <Image
                      src={app.icon}
                      alt={app.name}
                      fill
                      className="object-contain grayscale opacity-80 transition duration-200 group-hover:grayscale-0 group-hover:opacity-100"
                    />
                  </div>

                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 px-2 py-1 rounded-md border border-hairline bg-surface text-xs font-semibold text-text-primary shadow-[var(--shadow-popover)] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {app.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
