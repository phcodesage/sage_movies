/**
 * Scroll a homepage row (<MovieRow id="...">) into view, reliably.
 *
 * Two quirks of this page force the implementation:
 *
 * 1. `window.scrollTo()` does nothing here. `body { overflow-x: hidden }` in
 *    globals.css turns body into its own scroll box, so viewport-level scroll APIs
 *    no longer drive the page. `scrollIntoView` resolves the correct scrolling
 *    ancestor itself, so it works — use it, not scrollTo.
 * 2. Rows lazy-load their posters, so the document grows while the smooth animation
 *    is running and Chrome cancels it partway — it visibly stops short of the target
 *    and never resumes. So we re-assert until the position settles.
 *
 * `scrollMarginTop` offsets the fixed navbar, which would otherwise cover the
 * section heading.
 */

const NAV_OFFSET_PX = 72;
const CORRECTION_DELAYS = [300, 700, 1200, 1900];

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  el.style.scrollMarginTop = `${NAV_OFFSET_PX}px`;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Re-aim as images settle. A no-op once we've arrived.
  CORRECTION_DELAYS.forEach((delay) => {
    setTimeout(() => {
      const current = document.getElementById(id);
      if (!current) return;
      const offBy = current.getBoundingClientRect().top - NAV_OFFSET_PX;
      // Only correct a genuine miss; small deltas are just animation in flight.
      if (Math.abs(offBy) > 24) {
        current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, delay);
  });
}
