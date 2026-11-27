// Claude models a workspace can choose for Ask Corely answers (Settings → AI).
// Kept free of the SDK import so client components can use the list too.
export const ANSWER_MODELS = [
  { value: "claude-opus-5-5", label: "Claude Opus 5.5" },
  { value: "claude-haiku-5-5", label: "Claude Haiku 5.5 (faster, lower cost)" },
] as const;

export type AnswerModel = (typeof ANSWER_MODELS)[number]["value"];

export const DEFAULT_ANSWER_MODEL: AnswerModel = "claude-opus-5-5";

/** Returns the saved model if it is one we offer, otherwise the default. */
export function normaliseAnswerModel(value: unknown): AnswerModel {
  return ANSWER_MODELS.some((m) => m.value === value) ? (value as AnswerModel) : DEFAULT_ANSWER_MODEL;
}
