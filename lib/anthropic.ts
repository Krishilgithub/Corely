import Anthropic from "@anthropic-ai/sdk";

// One shared Claude client. It reads ANTHROPIC_API_KEY from the environment.
const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic | undefined };

export const anthropic = globalForAnthropic.anthropic ?? new Anthropic();

if (process.env.NODE_ENV !== "production") globalForAnthropic.anthropic = anthropic;
