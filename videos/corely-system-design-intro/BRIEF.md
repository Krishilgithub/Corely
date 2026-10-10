---
workflow: faceless-explainer
flow: automation
storyboard: no
message: "Corely turns your team's scattered tools into one memory you can ask, with cited, fresh answers"
destination: youtube
aspect: 1920x1080
language: en
audience: "Engineers, teammates and managers new to Corely"
length: 60s
angle: narrative
narration: yes
voice_engine: kokoro
voice: af_heart
music: none
---

## Intent

A one-minute intro video for Corely that explains its system design. The user asked:
"make a one min intro video of this product with voice explaining the system design of the project".
The story follows one "Ask Corely" question through the whole system: sources sync in, content is
chunked and embedded, pgvector finds matches, freshness is scored, and GPT-4o streams a cited answer.

## Customizations

- Voiceover narration. User first chose HeyGen, then switched to local Kokoro (af_heart) because HeyGen sign-in needs a real terminal. No background music (MusicGen not installed).

## Notes

- Facts come from the Corely codebase (CLAUDE.md and docs/corely-system-design.html). Keep every claim true to the code.
- Plain, simple English in the narration (user's global rule).
