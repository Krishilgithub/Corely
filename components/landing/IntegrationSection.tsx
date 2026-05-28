"use client";

import { Globe, Server, Layers, Command, Monitor, Cloud, Box, Terminal } from "lucide-react";
import React from "react";

const APP_ICONS = [
  { icon: <Globe />, name: "GitHub", color: "#181717", radius: 150, duration: 25, delay: 0 },
  { icon: <Command />, name: "Slack", color: "#E01E5A", radius: 150, duration: 25, delay: 12.5 },
  
  { icon: <Layers />, name: "Drive", color: "#FFD04B", radius: 250, duration: 35, delay: 5 },
  { icon: <Server />, name: "Figma", color: "#F24E1E", radius: 250, duration: 35, delay: 17.5 },
  { icon: <Monitor />, name: "Web App", color: "#0052CC", radius: 250, duration: 35, delay: 28 },
  
  { icon: <Cloud />, name: "AWS", color: "#FF9900", radius: 350, duration: 45, delay: 0 },
  { icon: <Box />, name: "Docker", color: "#2496ED", radius: 350, duration: 45, delay: 15 },
  { icon: <Terminal />, name: "CLI", color: "#4AF626", radius: 350, duration: 45, delay: 30 },
];

export default function IntegrationSection() {
  return (
    <section className="relative py-32 bg-zinc-50 overflow-hidden border-t border-black/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,107,0,0.05),transparent_70%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-24">
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full border border-[#ff6b00]/20 bg-[#ff6b00]/5">
          <span className="text-[11px] font-bold tracking-[0.15em] text-[#ff6b00] uppercase">
            ECOSYSTEM INTEGRATIONS
          </span>
        </div>
        
        <h2 className="text-4xl md:text-6xl font-bold text-black tracking-tighter mb-6">
          Connects to everything.
        </h2>
        <p className="text-lg text-zinc-600 font-light max-w-2xl mx-auto leading-relaxed">
          Out-of-the-box integrations with the tools your team already uses. Corely binds your fragmented ecosystem into a single, cohesive intelligence layer.
        </p>
      </div>

      <div className="relative w-full h-[600px] flex items-center justify-center overflow-hidden mask-edges">
        
        {/* Glow behind the orb */}
        <div className="absolute w-[400px] h-[400px] bg-[#ff6b00]/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Central Corely Orb */}
        <div className="absolute z-20 flex items-center justify-center w-32 h-32 rounded-full bg-white shadow-[0_0_80px_rgba(255,107,0,0.2)] border border-[#ff6b00]/20">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff9240] flex items-center justify-center shadow-[0_0_30px_rgba(255,107,0,0.6)] animate-pulse">
            <span className="text-white font-bold text-3xl leading-none transform -rotate-45 block">
              ◆
            </span>
          </div>
        </div>

        {/* Orbital Rings */}
        <div className="absolute w-[300px] h-[300px] rounded-full border border-black/5 border-dashed" />
        <div className="absolute w-[500px] h-[500px] rounded-full border border-black/5 border-dashed" />
        <div className="absolute w-[700px] h-[700px] rounded-full border border-black/5 border-dashed" />

        {/* Orbiting Apps */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {APP_ICONS.map((app, i) => {
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: `${app.radius * 2}px`,
                  height: `${app.radius * 2}px`,
                  marginLeft: `-${app.radius}px`,
                  marginTop: `-${app.radius}px`,
                  animation: `spin ${app.duration}s linear infinite`,
                  animationDelay: `-${app.delay}s`,
                }}
              >
                {/* The app icon container - Counter spins so it stays upright */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-2xl bg-white shadow-md border border-black/5 flex items-center justify-center pointer-events-auto hover:scale-110 transition-transform cursor-pointer group"
                  style={{
                    animation: `spin-reverse ${app.duration}s linear infinite`,
                    animationDelay: `-${app.delay}s`,
                  }}
                >
                  <div className="text-zinc-400 group-hover:scale-110 transition-all duration-300" style={{ color: app.color }}>
                    {React.cloneElement(app.icon, { size: 24, strokeWidth: 1.5 })}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full mt-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-zinc-900 text-white text-xs font-medium rounded-md pointer-events-none whitespace-nowrap">
                    {app.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}} />
    </section>
  );
}
