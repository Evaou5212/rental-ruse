// Minimal inline line-icon set (24x24, stroke-based). Replaces emoji in the UI.
const svg = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const ICONS = {
  home: svg('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  door: svg('<path d="M4 21V5a2 2 0 0 1 2-2h8v18"/><path d="M14 21h6V8"/><circle cx="11" cy="12" r="1" fill="currentColor"/>'),
  pocket: svg('<path d="M5 3h14v11a7 7 0 0 1-14 0z"/><path d="M5 7h14"/>'),
  bulb: svg('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>'),
  list: svg('<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>'),
  soundOn: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),
  soundOff: svg('<path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/>'),
  restart: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  close: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  back: svg('<path d="m15 18-6-6 6-6"/>'),
  arrow: svg('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
  check: svg('<path d="m5 12 5 5L20 7"/>'),
  star: svg('<path d="M12 3l2.6 5.4 6 .9-4.3 4.2 1 5.9L12 16.8 6.7 19.4l1-5.9L3.4 9.3l6-.9z"/>'),
  lock: svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  phone: svg('<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>'),
  ear: svg('<path d="M6 9a6 6 0 0 1 12 0c0 3-2 4-3 6s-1 5-4 5"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-1 2-1.5 3"/>'),
  eye: svg('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  copy: svg('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  print: svg('<path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M6 14h12v7H6z"/>'),
  rotate: svg('<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M2 12a10 10 0 0 1 3-7"/><path d="M22 12a10 10 0 0 1-3 7"/>'),
  signal: svg('<path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4"/>'),
  wave: svg('<path d="M2 12h3l2-6 3 12 3-10 2 6 2-3 2 1h3"/>'),
  nose: svg('<path d="M12 4c2.2 3.2 3.5 6 3.5 8.4a3.5 3.5 0 1 1-7 0C8.5 10 9.8 7.2 12 4z"/><path d="M10.2 14.6c.4.7 1.1 1.2 1.8 1.2s1.4-.5 1.8-1.2"/>'),
  building: svg('<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-7h6v7"/><path d="M9 11h.01M15 11h.01M12 11h.01"/>'),
};

/** Fill every `[data-icon]` element with its SVG. */
export function mountIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((n) => {
    const ic = ICONS[n.dataset.icon];
    if (ic) n.innerHTML = ic;
  });
}
