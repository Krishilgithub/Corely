"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Brain, Settings, Users, Search, Link2 } from "lucide-react";
import "./command-palette.css";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()}>
        <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu" className="cmdk-dialog">
          <Command.Input placeholder="Type a command or search..." className="cmdk-input" autoFocus />
          <Command.List className="cmdk-list">
            <Command.Empty className="cmdk-empty">No results found.</Command.Empty>
            
            <Command.Group heading="Quick Links">
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/ask-corely"))}>
                <Search size={16} /> Ask Corely
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/memory"))}>
                <Brain size={16} /> Timeline Memory
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/sources"))}>
                <Link2 size={16} /> Integrations & Sources
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Settings">
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
                <Settings size={16} /> General Settings
              </Command.Item>
              <Command.Item onSelect={() => runCommand(() => router.push("/dashboard/teams"))}>
                <Users size={16} /> Team Members
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command.Dialog>
      </div>
    </div>
  );
}
