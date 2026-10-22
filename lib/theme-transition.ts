/**
 * Switches light/dark with a circle that grows from the point the user
 * clicked. Uses the View Transitions API; browsers without it, and people who
 * prefer reduced motion, get an instant switch.
 *
 * `apply` must update app state (e.g. ThemeProvider.setTheme). The `dark`
 * class is set here as well, inside the transition, so the browser can
 * capture the new look straight away.
 */
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };

export function switchThemeWithTransition(
  next: "light" | "dark",
  apply: () => void,
  origin?: { x: number; y: number }
) {
  const doc = document as DocWithVT;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduce) {
    apply();
    return;
  }

  const root = document.documentElement;
  const x = origin?.x ?? window.innerWidth - 40;
  const y = origin?.y ?? 30;
  // Radius that reaches the farthest corner from the click.
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  root.style.setProperty("--vt-x", `${x}px`);
  root.style.setProperty("--vt-y", `${y}px`);
  root.style.setProperty("--vt-r", `${r}px`);
  root.classList.add("vt-theme");

  const t = doc.startViewTransition(() => {
    root.classList.toggle("dark", next === "dark");
    apply();
  });
  t.finished.finally(() => root.classList.remove("vt-theme"));
}
