// DOM helpers for locating tour targets and performing actions in Watch mode.

export function findTarget(id: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const all = document.querySelectorAll<HTMLElement>(`[data-tour="${CSS.escape(id)}"]`);
  for (const el of all) if (el.getClientRects().length > 0) return el;
  return null;
}

export function waitForTarget(id: string, timeoutMs: number, signal: { cancelled: boolean }): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = () => {
      if (signal.cancelled) return resolve(null);
      const el = findTarget(id);
      if (el) return resolve(el);
      if (performance.now() - start > timeoutMs) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function centerOf(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** Set a value on a React-controlled input/textarea/select so React's onChange fires. */
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
}

export async function typeInto(el: HTMLElement, value: string, perCharMs: number, signal: { cancelled: boolean }) {
  if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
  el.focus({ preventScroll: true });
  if (perCharMs <= 0) {
    setNativeValue(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }
  for (let i = 1; i <= value.length; i++) {
    if (signal.cancelled) return;
    setNativeValue(el, value.slice(0, i));
    el.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(perCharMs);
  }
}

export function selectValue(el: HTMLElement, value: string) {
  if (!(el instanceof HTMLSelectElement)) return;
  el.focus({ preventScroll: true });
  setNativeValue(el, value);
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export function isFocusable(el: HTMLElement) {
  return el.matches('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])');
}
