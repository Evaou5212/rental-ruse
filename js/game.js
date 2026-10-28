import {
  SCENES,
  CATEGORIES,
  AREAS,
  ITEMS,
  HOTSPOTS,
  DECOYS,
  RANKS,
  SCORING,
  HINT_TIMING,
} from "./data.js";
import { ICONS, mountIcons } from "./icons.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const TOTAL = Object.keys(ITEMS).length;
const SAVE_KEY = "rentalruse.save.v1";
const BEST_KEY = "rentalruse.best.v1";
const MUTE_KEY = "rentalruse.muted";

const fmtTime = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const rectCenter = ([l, t, w, h]) => ({ x: l + w / 2, y: t + h / 2 });

// ---------------------------------------------------------------------------
// Sound (tiny WebAudio synth, no assets)
// ---------------------------------------------------------------------------
const Sound = {
  ctx: null,
  muted: localStorage.getItem(MUTE_KEY) === "1",
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  },
  tone(freq, dur = 0.12, type = "sine", gain = 0.08, when = 0) {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  },
  click() { this.tone(520, 0.06, "triangle", 0.05); },
  miss() { this.tone(180, 0.15, "sawtooth", 0.03); },
  open() { this.tone(660, 0.1, "triangle", 0.06); this.tone(880, 0.1, "triangle", 0.05, 0.08); },
  found() {
    [523, 659, 784].forEach((f, i) => this.tone(f, 0.16, "triangle", 0.07, i * 0.09));
  },
  hint() { this.tone(440, 0.2, "sine", 0.06); this.tone(440, 0.2, "sine", 0.06, 0.25); },
  fanfare() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.08, i * 0.13));
  },
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const freshState = () => ({
  started: false,
  complete: false,
  scene: "room",
  visited: ["room"],
  found: [], // item ids in discovery order
  score: 0,
  elapsedMs: 0,
  lastFindAt: null, // elapsedMs at last find (for streaks)
  streak: 0,
  bestStreak: 0,
  hintsManual: 0,
  hintsAuto: 0,
  reveals: 0,
  clicks: 0,
  misclicks: 0,
  streakBonusTotal: 0,
  hintPenaltyTotal: 0,
  timeBonus: 0,
  revealed: {}, // sceneId -> markers currently shown
  revealPaid: {}, // sceneId -> already paid the reveal cost
});

let S = freshState();

// runtime (not saved)
const R = {
  lastTick: 0,
  cycleStart: 0, // elapsedMs when the current hint cycle started
  softShown: false,
  markerShown: false,
  manualHintReadyAt: 0,
  markers: new Map(), // hotspotId -> element
  modal: null, // { hotspot, itemIndex, stepIndex, review, toolDone }
  drawerOpen: false,
  toolTimers: [],
};

const isFound = (itemId) => S.found.includes(itemId);
const hotspotById = (id) => HOTSPOTS.find((h) => h.id === id);
const hotspotDone = (hs) => !hs.items || hs.items.every(isFound);
const hotspotNextIndex = (hs) => (hs.items ? hs.items.findIndex((i) => !isFound(i)) : -1);
const undiscoveredIn = (sceneId) => HOTSPOTS.filter((h) => h.scene === sceneId && h.items && !hotspotDone(h));
const itemsIn = (sceneId) => HOTSPOTS.filter((h) => h.scene === sceneId && h.items).flatMap((h) => h.items);
const foundIn = (sceneId) => itemsIn(sceneId).filter(isFound).length;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
function save() {
  if (!S.started || S.complete) {
    if (S.complete) localStorage.removeItem(SAVE_KEY);
    return;
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(S));
  } catch (e) {
    /* ignore quota */
  }
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.found) || s.found.length === 0) return null;
    return s;
  } catch (e) {
    return null;
  }
}
function loadBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY) || "null");
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Toasts & floaters
// ---------------------------------------------------------------------------
function toast(html, { kind = "", ms = 4200 } = {}) {
  const wrap = $("toasts");
  // keep at most 3 on screen
  while (wrap.children.length >= 3) wrap.firstElementChild.remove();
  const t = el("div", `toast ${kind}`, html);
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add("show"));
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, ms);
}
function floater(text, x, y, cls = "") {
  const f = el("div", `floater ${cls}`, text);
  f.style.left = `${x}px`;
  f.style.top = `${y}px`;
  $("floaters").appendChild(f);
  setTimeout(() => f.remove(), 1400);
}

// ---------------------------------------------------------------------------
// HUD
// ---------------------------------------------------------------------------
function updateHUD() {
  const n = S.found.length;
  $("progress-text").textContent = `${n} / ${TOTAL} checks`;
  $("progress-fill").style.width = `${(n / TOTAL) * 100}%`;
  $("stat-score").textContent = S.score;
  $("stat-hints").textContent = S.hintsManual + S.hintsAuto;
  $("stat-time").textContent = fmtTime(S.elapsedMs);
  const accNow = S.clicks ? Math.round(((S.clicks - S.misclicks) / S.clicks) * 100) : 100;
  $("stat-accuracy").textContent = `${accNow}%`;
  const st = $("streak-text");
  if (S.streak >= 2) {
    st.textContent = `×${S.streak} streak`;
    st.classList.remove("hidden");
  } else st.classList.add("hidden");

  // pockets
  $("tool-phone").classList.toggle("done", isFound("phone"));
  $("tool-listen").classList.toggle("done", isFound("listen"));
  $("tool-smell").classList.toggle("done", isFound("smell"));
  $("tool-building").classList.toggle("done", isFound("building"));

  // area summary
  const summary = $("area-summary");
  summary.innerHTML = "";
  Object.entries(AREAS).forEach(([key, a]) => {
    const ids = Object.entries(ITEMS).filter(([, it]) => it.area === key).map(([id]) => id);
    const left = ids.filter((id) => !isFound(id)).length;
    const chip = el(
      "span",
      `area-chip ${left === 0 ? "done" : ""}`,
      `${a.label} <b>${left === 0 ? "done" : left + " left"}</b>`
    );
    summary.appendChild(chip);
  });

  // reveal / hide-markers buttons
  const leftHere = undiscoveredIn(S.scene).length > 0;
  const revealUnlocked =
    !S.complete &&
    leftHere &&
    (S.hintsAuto >= HINT_TIMING.revealUnlockAfterMarkers || S.elapsedMs > 4 * 60 * 1000);
  $("btn-reveal").classList.toggle("hidden", !revealUnlocked || !!S.revealed[S.scene]);
  $("btn-hide-reveal").classList.toggle("hidden", !S.revealed[S.scene] || !leftHere);

  // hint button cooldown
  const hb = $("btn-hint");
  hb.disabled = S.elapsedMs < R.manualHintReadyAt || S.complete;

  const resultsOpen = !$("complete").classList.contains("hidden");
  $("btn-results").classList.toggle("hidden", !S.complete || resultsOpen);

  renderTabs();
  $("scene-name").textContent = SCENES[S.scene].name;
  $("btn-back").classList.toggle("hidden", S.scene === "room");
  renderDrawer();
  layoutScene();
}

function renderTabs() {
  const wrap = $("scene-tabs");
  wrap.innerHTML = "";
  Object.values(SCENES).forEach((sc) => {
    const total = itemsIn(sc.id).length;
    const found = foundIn(sc.id);
    const locked = !S.visited.includes(sc.id);
    const b = el(
      "button",
      `scene-tab ${sc.id === S.scene ? "active" : ""} ${locked ? "locked" : ""} ${found === total ? "done" : ""}`,
      locked
        ? `<span class="i">${ICONS.lock}</span><span>${sc.name}</span><small class="mono">find the door</small>`
        : `<span>${sc.name}</span><small class="mono">${found}/${total}</small>`
    );
    b.setAttribute("role", "tab");
    b.disabled = locked;
    b.addEventListener("click", () => {
      if (!locked && sc.id !== S.scene) switchScene(sc.id);
    });
    wrap.appendChild(b);
  });
}

// ---------------------------------------------------------------------------
// Scene rendering
// ---------------------------------------------------------------------------
function layoutScene() {
  const play = $("play");
  const stage = $("stage");
  const img = $("scene-img");
  const layer = $("hotspot-layer");
  const hudTop = $("hud-top");
  const hudBot = $("hud-bottom");
  const ratio = SCENES[S.scene].ratio;
  const stacked = window.matchMedia("(max-width: 1100px)").matches;
  const playW = play.clientWidth || 1;
  const topH = hudTop.offsetHeight || 56;
  const botH = hudBot.offsetHeight || 56;
  let w = playW;
  let h = Math.round(w / ratio);
  if (stacked) {
    const maxH = Math.max(180, window.innerHeight - topH - botH);
    if (h > maxH) {
      h = maxH;
      w = Math.round(h * ratio);
    }
  } else {
    const playH = play.clientHeight || 1;
    const avail = Math.max(120, playH - topH - botH);
    if (h > avail) {
      h = avail;
      w = Math.round(h * ratio);
    }
  }
  stage.style.width = w >= playW - 1 ? "100%" : `${w}px`;
  stage.style.height = `${h}px`;
  [img, layer].forEach((el) => {
    el.style.position = "absolute";
    el.style.inset = "0";
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = "100%";
    el.style.height = "100%";
  });
}

function renderScene({ intro = true } = {}) {
  const sc = SCENES[S.scene];
  if ($("scene-img").getAttribute("src") !== sc.image) $("scene-img").src = sc.image;
  // url() inside a custom property resolves against the stylesheet, so make it absolute
  document.documentElement.style.setProperty("--scene-bg", `url("${new URL(sc.image, document.baseURI).href}")`);
  const layer = $("hotspot-layer");
  layer.innerHTML = "";
  clearMarkers();

  // decoys first (lower z), then hotspots
  DECOYS.filter((d) => d.scene === S.scene).forEach((d, i) => {
    d.rects.forEach((r) => {
      const n = el("div", "decoy");
      placeRect(n, r);
      n.dataset.decoy = String(DECOYS.indexOf(d));
      layer.appendChild(n);
    });
  });

  HOTSPOTS.filter((h) => h.scene === S.scene).forEach((hs) => {
    const done = hotspotDone(hs);
    const next = hotspotNextIndex(hs);
    const partial = hs.items && next > 0 && !done;
    hs.rects.forEach((r, i) => {
      const n = el("div", `hotspot ${hs.goto ? "door" : ""} ${done ? "found" : ""} ${partial ? "partial" : ""}`);
      placeRect(n, r);
      n.dataset.hs = hs.id;
      n.dataset.rect = String(i);
      n.setAttribute("role", "button");
      n.setAttribute("aria-label", hs.goto ? `Go to ${SCENES[hs.goto].name}` : "Inspect this area");
      n.tabIndex = 0;
      layer.appendChild(n);
    });
    // pin on every rect — a hotspot can cover several objects (fridge + dishwasher)
    if (hs.items) {
      hs.rects.forEach((r, i) => {
        const c = rectCenter(r);
        const pin = el(
          "div",
          `pin ${done ? "found" : partial ? "partial" : "hidden"}`,
          done ? ICONS.check : `<span class="mono">${next}/${hs.items.length}</span>`
        );
        pin.style.left = `${c.x}%`;
        pin.style.top = `${c.y}%`;
        pin.dataset.hs = hs.id;
        pin.dataset.rect = String(i);
        layer.appendChild(pin);
      });
    } else if (hs.goto) {
      const c = rectCenter(hs.rects[0]);
      const pin = el("div", "pin door-pin", ICONS.door);
      pin.style.left = `${c.x}%`;
      pin.style.top = `${c.y}%`;
      pin.dataset.hs = hs.id;
      layer.appendChild(pin);
    }
  });

  if (S.revealed[S.scene]) undiscoveredIn(S.scene).forEach((h) => showMarker(h, true));

  // intro caption
  if (intro) {
    const cap = $("scene-intro");
    cap.textContent = sc.intro;
    cap.classList.add("show");
    clearTimeout(cap._t);
    cap._t = setTimeout(() => cap.classList.remove("show"), 5000);
  }

  layoutScene();
  updateHUD();
}

function placeRect(n, [l, t, w, h]) {
  n.style.left = `${l}%`;
  n.style.top = `${t}%`;
  n.style.width = `${w}%`;
  n.style.height = `${h}%`;
}

function switchScene(id) {
  if (!SCENES[id] || id === S.scene) return;
  S.scene = id;
  if (!S.visited.includes(id)) S.visited.push(id);
  Sound.open();
  const scene = $("scene");
  scene.classList.add("switching");
  setTimeout(() => {
    renderScene();
    scene.classList.remove("switching");
  }, 220);
  // scene change counts as progress for the hint timer
  resetHintCycle();
  save();
}

// ---------------------------------------------------------------------------
// Hint system
// ---------------------------------------------------------------------------
function resetHintCycle() {
  R.cycleStart = S.elapsedMs;
  R.softShown = false;
  R.markerShown = false;
}

function clearMarkers() {
  R.markers.forEach((m) => m.remove());
  R.markers.clear();
}

function showMarker(hs, persistent = false) {
  if (R.markers.has(hs.id)) return;
  const c = rectCenter(hs.rects[0]);
  const m = el("div", `marker ${persistent ? "persistent" : ""}`, `<span>?</span>`);
  m.style.left = `${c.x}%`;
  m.style.top = `${c.y}%`;
  m.dataset.hs = hs.id;
  $("hotspot-layer").appendChild(m);
  R.markers.set(hs.id, m);
  if (!persistent) {
    setTimeout(() => {
      if (R.markers.get(hs.id) === m) {
        m.classList.add("fade");
        setTimeout(() => {
          m.remove();
          R.markers.delete(hs.id);
        }, 500);
      }
    }, 9000);
  }
}

function pocketLeft() {
  return ["phone", "listen", "smell", "building"].filter((id) => !isFound(id));
}

/** Pick what to point at: an undiscovered hotspot in this scene, the door to a
 *  scene that still has items, or a pocket tool. */
function hintTarget() {
  const here = undiscoveredIn(S.scene).filter((h) => !R.markers.has(h.id));
  if (here.length) return { type: "hotspot", hs: pick(here) };
  const elsewhere = Object.keys(SCENES).find((id) => id !== S.scene && undiscoveredIn(id).length > 0);
  if (elsewhere) {
    const door = HOTSPOTS.find((h) => h.scene === S.scene && h.goto === elsewhere);
    return { type: "door", hs: door, scene: elsewhere };
  }
  const pockets = pocketLeft();
  if (pockets.length) return { type: "pocket", tool: pockets[0] };
  return null;
}

function softNudge() {
  const target = hintTarget();
  if (!target) return;
  if (target.type === "hotspot") {
    // Which area in this scene has the most left?
    const counts = {};
    undiscoveredIn(S.scene).forEach((h) => h.items.filter((i) => !isFound(i)).forEach((i) => {
      const a = ITEMS[i].area;
      counts[a] = (counts[a] || 0) + 1;
    }));
    const [areaKey, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    // riddle for an undiscovered item that is actually in that area
    const inArea = undiscoveredIn(S.scene)
      .map((h) => ITEMS[h.items[hotspotNextIndex(h)]])
      .filter((it) => it.area === areaKey);
    const item = inArea.length ? pick(inArea) : ITEMS[target.hs.items[hotspotNextIndex(target.hs)]];
    toast(
      `<b>Psst.</b> Still <b>${n}</b> thing${n > 1 ? "s" : ""} to check around the <b>${AREAS[areaKey].label}</b>.<br><i>${item.riddle}</i>`,
      { kind: "hint", ms: 7000 }
    );
  } else if (target.type === "door") {
    toast(`<b>Everything here is checked.</b> Find the way into the <b>${SCENES[target.scene].name.toLowerCase()}</b>.`, { kind: "hint", ms: 6000 });
  } else {
    if (target.tool === "building") {
      toast(`<b>One more thing before you leave.</b> ${ITEMS.building.riddle}`, { kind: "hint", ms: 7000 });
    } else {
      toast(`<b>Nothing left in the rooms.</b> ${ITEMS[target.tool].riddle}`, { kind: "hint", ms: 7000 });
    }
  }
}

function markerHint(manual) {
  const target = hintTarget();
  if (!target) return false;
  Sound.hint();
  if (target.type === "hotspot") {
    showMarker(target.hs);
  } else if (target.type === "door") {
    const name = SCENES[target.scene].name;
    if (target.hs) {
      showMarker(target.hs);
      toast(`The <b>${name.toLowerCase()}</b> still has things to check — go through the door.`, { kind: "hint" });
    } else {
      // no door hotspot from here: nudge the tabs / back button instead
      const back = $("btn-back");
      back.classList.add("nudge");
      setTimeout(() => back.classList.remove("nudge"), 6000);
      toast(`Nothing left in here. Head back to the <b>${name.toLowerCase()}</b> — use the button in the corner or the room tabs.`, { kind: "hint" });
    }
  } else {
    const btn = $(`tool-${target.tool}`);
    btn.classList.add("nudge");
    setTimeout(() => btn.classList.remove("nudge"), 6000);
    toast(
      target.tool === "building"
        ? `Before you leave — tap <b>Hallway</b> at the bottom left.`
        : `Check <b>your pockets</b> — bottom left.`,
      { kind: "hint" }
    );
  }
  if (manual) {
    S.hintsManual++;
    S.score = Math.max(0, S.score - SCORING.hintCost);
    S.hintPenaltyTotal += SCORING.hintCost;
    R.manualHintReadyAt = S.elapsedMs + HINT_TIMING.manualCooldownMs;
  } else {
    S.hintsAuto++;
  }
  updateHUD();
  save();
  return true;
}

function revealAll() {
  const left = undiscoveredIn(S.scene);
  if (!left.length) return;
  S.revealed[S.scene] = true;
  left.forEach((h) => showMarker(h, true));
  if (!S.revealPaid[S.scene]) {
    S.revealPaid[S.scene] = true;
    S.reveals++;
    S.score = Math.max(0, S.score - SCORING.revealCost);
    S.hintPenaltyTotal += SCORING.revealCost;
    toast(`All remaining spots in the <b>${SCENES[S.scene].name.toLowerCase()}</b> are marked. (−${SCORING.revealCost} pts)`, { kind: "warn" });
  } else {
    toast(`Markers shown again in the <b>${SCENES[S.scene].name.toLowerCase()}</b>.`, { kind: "hint" });
  }
  Sound.hint();
  updateHUD();
  save();
}

function hideReveal() {
  S.revealed[S.scene] = false;
  R.markers.forEach((m, id) => {
    if (m.classList.contains("persistent")) {
      m.remove();
      R.markers.delete(id);
    }
  });
  toast("Room markers are hidden again. You can reveal them later if you get stuck.", { kind: "hint" });
  updateHUD();
  save();
}

function hintTick() {
  if (R.modal || R.drawerOpen || S.complete || !S.started) {
    // pause the cycle while reading
    R.cycleStart += S.elapsedMs - R.lastElapsed;
    return;
  }
  const idle = S.elapsedMs - R.cycleStart;
  if (!R.softShown && idle > HINT_TIMING.softAfterMs) {
    R.softShown = true;
    softNudge();
  }
  if (!R.markerShown && idle > HINT_TIMING.markerAfterMs) {
    R.markerShown = true;
    if (markerHint(false)) {
      // schedule the next cycle
      R.cycleStart = S.elapsedMs - (HINT_TIMING.markerAfterMs - HINT_TIMING.repeatEveryMs);
      R.softShown = true; // skip the soft nudge on repeats, marker is enough
      R.markerShown = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Click handling
// ---------------------------------------------------------------------------
const MISS_LINES = [
  "Nothing to inspect here. Think about what you'd actually use every day.",
  "Pretty, but not on the checklist.",
  "Hmm. Try things that have doors, knobs, switches or water.",
  "Not that. Look higher — or lower.",
  "If you can open it, turn it on, or run water through it, it's worth a click.",
];

function onLayerClick(e) {
  if (!S.started) return;
  const t = e.target;

  const hsId = t.dataset.hs;
  if (hsId) {
    const hs = hotspotById(hsId);
    if (hs.goto) {
      switchScene(hs.goto);
      return;
    }
    Sound.click();
    openHotspot(hs, Number(t.dataset.rect || 0));
    return;
  }

  if (S.complete) return;
  S.clicks++;

  if (t.dataset.decoy !== undefined) {
    S.misclicks++;
    Sound.miss();
    toast(DECOYS[+t.dataset.decoy].text, { kind: "decoy" });
    ripple(e.clientX, e.clientY, true);
    save();
    return;
  }

  // empty click
  S.misclicks++;
  Sound.miss();
  ripple(e.clientX, e.clientY, false);
  if (S.misclicks % 3 === 0) toast(pick(MISS_LINES), { kind: "miss", ms: 3000 });
  save();
}

function ripple(x, y, decoy) {
  const r = el("div", `ripple ${decoy ? "decoy" : ""}`);
  r.style.left = `${x}px`;
  r.style.top = `${y}px`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 700);
}

// ---------------------------------------------------------------------------
// Modal (item detail / steps)
// ---------------------------------------------------------------------------
function openHotspot(hs, rectIndex = 0) {
  const done = hotspotDone(hs);
  const idx = done ? 0 : hotspotNextIndex(hs);
  const item = ITEMS[hs.items[idx] || hs.items[0]];
  const n = item.steps.length;
  let stepOrder = null;
  let stepIndex = done ? n - 1 : 0;
  if (hs.stepPerRect && n > 1) {
    const start = Math.min(Math.max(0, rectIndex), n - 1);
    if (done) stepIndex = start;
    else if (start > 0) stepOrder = [...Array(n).keys()].map((i) => (start + i) % n);
  }
  R.modal = { hotspot: hs, itemIndex: idx, stepIndex, stepOrder, review: done, toolDone: false };
  // remove marker on this hotspot
  const m = R.markers.get(hs.id);
  if (m) {
    m.remove();
    R.markers.delete(hs.id);
  }
  renderModal();
  $("modal").classList.remove("hidden");
}

function openTool(tool) {
  if (!S.started) return;
  Sound.click();
  const fake = { id: `tool_${tool}`, items: [tool], rects: [], scene: null, isTool: true };
  const done = isFound(tool);
  R.modal = { hotspot: fake, itemIndex: 0, stepIndex: done ? ITEMS[tool].steps.length - 1 : 0, review: done, toolDone: done };
  renderModal();
  $("modal").classList.remove("hidden");
}

function closeModal() {
  R.modal = null;
  R.toolTimers.forEach(clearTimeout);
  R.toolTimers = [];
  $("modal").classList.add("hidden");
}

function renderModal() {
  const M = R.modal;
  const hs = M.hotspot;
  const itemId = hs.items[M.itemIndex];
  const item = ITEMS[itemId];
  const steps = M.stepOrder ? M.stepOrder.map((i) => item.steps[i]) : item.steps;
  const step = steps[M.stepIndex];
  const last = M.stepIndex === steps.length - 1;
  const cat = CATEGORIES[item.category];

  // tabs (review mode with several items)
  const tabs = $("modal-tabs");
  if (M.review && hs.items.length > 1) {
    tabs.classList.remove("hidden");
    tabs.innerHTML = "";
    hs.items.forEach((id, i) => {
      const b = el("button", `modal-tab ${i === M.itemIndex ? "active" : ""}`, ITEMS[id].title);
      b.addEventListener("click", () => {
        M.itemIndex = i;
        M.stepIndex = ITEMS[id].steps.length - 1;
        renderModal();
      });
      tabs.appendChild(b);
    });
  } else tabs.classList.add("hidden");

  // media
  const media = $("modal-media");
  media.innerHTML = "";
  media.className = "modal-media";
  if (step.tool) {
    renderTool(media, step.tool, M);
  } else if (step.image) {
    media.style.aspectRatio = "3 / 2";
    const img = el("img");
    img.src = step.image;
    img.alt = item.title;
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        media.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
      }
    };
    media.appendChild(img);
  } else if (step.crop) {
    const sc = SCENES[hs.scene];
    const [l, t, w, h] = step.crop;
    const crop = el("div", "crop");
    crop.style.backgroundImage = `url(${sc.image})`;
    crop.style.backgroundSize = `${(100 / w) * 100}% ${(100 / h) * 100}%`;
    const px = w >= 100 ? 0 : (l / (100 - w)) * 100;
    const py = h >= 100 ? 0 : (t / (100 - h)) * 100;
    crop.style.backgroundPosition = `${px}% ${py}%`;
    const aspect = (w / h) * sc.ratio;
    media.style.aspectRatio = `${aspect}`;
    if (aspect < 1) media.classList.add("portrait"); // tall crops: cap height, center
    media.appendChild(crop);
  }
  if (step.overlay) media.appendChild(buildOverlay(step.overlay));
  media.classList.add("pop");
  requestAnimationFrame(() => media.classList.remove("pop"));

  $("modal-caption").textContent = step.caption || "";

  // body
  $("modal-cat").textContent = cat.label;
  $("modal-cat").style.setProperty("--c", cat.color);
  const pad = (n) => String(n).padStart(2, "0");
  $("modal-count").textContent = M.review
    ? `Check ${pad(S.found.indexOf(itemId) + 1)} / ${TOTAL} · collected`
    : `Check ${pad(S.found.length + 1)} / ${TOTAL}`;
  $("modal-title").textContent = item.title;
  const notice = $("modal-notice");
  if (M.notice) {
    notice.innerHTML = M.notice;
    notice.classList.remove("hidden");
    M.notice = null; // show once, on the first render after collecting
  } else notice.classList.add("hidden");
  $("modal-why").textContent = item.why;

  const details = $("modal-details");
  const showDetails = M.review || (last && (!step.tool || M.toolDone));
  details.classList.toggle("hidden", !showDetails);
  if (showDetails) {
    $("modal-tips").innerHTML = item.tips.map((t) => `<li>${t}</li>`).join("");
    $("modal-flags").innerHTML = item.redFlags.map((t) => `<li>${t}</li>`).join("");
    $("modal-ask").textContent = item.ask;
  }

  // primary button
  const btn = $("modal-primary");
  btn.className = "btn btn-primary";
  btn.disabled = false;
  if (M.review && !last) {
    btn.textContent = `${step.action || "Look closer"} →`;
    btn.onclick = () => {
      Sound.open();
      M.stepIndex++;
      renderModal();
    };
  } else if (M.review) {
    btn.textContent = "Close";
    btn.onclick = closeModal;
  } else if (step.tool && !M.toolDone) {
    btn.textContent = step.action || "Use it";
    btn.onclick = () => startTool(step.tool, M);
  } else if (!last) {
    btn.textContent = `${step.action || "Look closer"} →`;
    btn.onclick = () => {
      Sound.open();
      M.stepIndex++;
      renderModal();
    };
  } else {
    btn.innerHTML = `Add to checklist <span class="btn-pts mono">+${SCORING.find}</span>`;
    btn.classList.add("btn-collect");
    btn.onclick = () => collect(itemId);
  }
  $("modal-body").scrollTop = 0;
}

function buildOverlay(kind) {
  const o = el("div", `overlay-fx fx-${kind}`);
  switch (kind) {
    case "water":
      o.innerHTML = `<div class="stream"></div><div class="splash"></div><div class="fx-label" style="left:58%;top:33%">Hot water: 0s…</div>`;
      countUp(o.querySelector(".fx-label"), "Hot water: {n}s…", 48);
      break;
    case "drain":
      o.innerHTML = `<div class="pool"></div><div class="swirl"></div><div class="fx-label" style="left:60%;top:68%">Draining… slowly</div>`;
      break;
    case "steam":
      o.innerHTML = `<div class="ring" style="left:78%;top:63%"></div><div class="fx-label warn" style="left:70%;top:70%">Drip!</div>`;
      break;
    case "missing":
      o.innerHTML = `<div class="dashed"></div><div class="fx-label warn" style="left:50%;top:78%;transform:translateX(-50%)">Nothing here</div>`;
      break;
    case "pests":
      o.innerHTML = `<div class="fx-label warn" style="left:28%;top:74%;transform:translateX(-50%)">Droppings along the kickplate</div><div class="fx-label warn" style="left:72%;top:18%;transform:translateX(-50%)">Bed frame too</div>`;
      break;
    case "tape":
      o.innerHTML = `<div class="tape"></div><div class="fx-label" style="left:50%;top:22%;transform:translateX(-50%)">60″ queen — does it fit?</div>`;
      break;
    case "shower":
      o.innerHTML =
        `<div class="drops">${Array.from({ length: 9 }, (_, i) => `<i style="left:${42 + i * 1.4}%;animation-delay:${(i * 0.13).toFixed(2)}s"></i>`).join("")}</div>` +
        `<div class="fx-label" style="left:56%;top:30%">Hot water: 0s…</div>`;
      countUp(o.querySelector(".fx-label"), "Hot water: {n}s…", 35);
      break;
    case "flush":
      o.innerHTML = `<div class="ring" style="left:50%;top:63%"></div><div class="ring d2" style="left:50%;top:63%"></div><div class="fx-label" style="left:58%;top:50%">Listening… 0s</div>`;
      countUp(o.querySelector(".fx-label"), "Listening… {n}s", 120, 60);
      break;
  }
  return o;
}

function countUp(node, tpl, max, speed = 120) {
  let n = 0;
  const t = setInterval(() => {
    n++;
    node.textContent = tpl.replace("{n}", n);
    if (n >= max || !node.isConnected) {
      clearInterval(t);
      if (node.isConnected) node.textContent = tpl.replace("{n}", n) + (max >= 60 ? " — silence" : " — finally hot");
    }
  }, speed);
  R.toolTimers.push(t);
}

// ----- pocket tools -------------------------------------------------------
function renderTool(media, tool, M) {
  media.style.aspectRatio = "4 / 3";
  media.classList.add("tool-media");
  if (tool === "phone") {
    media.innerHTML = `
      <div class="tool-stage phone-stage">
        <div class="phone">
          <div class="phone-notch"></div>
          <div class="phone-status"><span id="phone-bars" class="bars"><i></i><i></i><i></i><i></i></span><span id="phone-net">—</span></div>
          <div class="phone-screen">
            <div id="phone-msg" class="phone-msg">${M.toolDone ? "Signal checked in every corner." : "Tap <b>Check signal</b> to scan the apartment."}</div>
            <ul id="phone-rooms" class="phone-rooms ${M.toolDone ? "" : "hidden"}">
              ${phoneRows()}
            </ul>
          </div>
        </div>
      </div>`;
    if (M.toolDone) media.querySelector("#phone-bars").dataset.level = "2";
  } else if (tool === "smell") {
    media.innerHTML = `
      <div class="tool-stage listen-stage">
        <div class="ear">${ICONS.nose}</div>
        <div class="wave" id="wave">${Array.from({ length: 24 }, () => "<i></i>").join("")}</div>
        <div id="listen-msg" class="listen-msg">${M.toolDone ? "Your nose caught what the photos hid." : "Stand in the doorway. Breathe in slowly."}</div>
        <ul id="listen-list" class="listen-list ${M.toolDone ? "" : "hidden"}">${smellRows()}</ul>
      </div>`;
  } else if (tool === "building") {
    media.innerHTML = `
      <div class="tool-stage listen-stage">
        <div class="ear">${ICONS.building}</div>
        <div id="listen-msg" class="listen-msg">${M.toolDone ? "The building told you as much as the apartment did." : "Step out. The hallway is part of the tour."}</div>
        <ul id="listen-list" class="listen-list ${M.toolDone ? "" : "hidden"}">${buildingRows()}</ul>
      </div>`;
  } else {
    media.innerHTML = `
      <div class="tool-stage listen-stage">
        <div class="ear">${ICONS.ear}</div>
        <div class="wave" id="wave">${Array.from({ length: 24 }, () => "<i></i>").join("")}</div>
        <div id="listen-msg" class="listen-msg">${M.toolDone ? "You heard everything the listing didn't mention." : "Put your phone away. Stand still."}</div>
        <ul id="listen-list" class="listen-list ${M.toolDone ? "" : "hidden"}">${listenRows()}</ul>
      </div>`;
  }
}

const PHONE_ROWS = [
  ["Living area", 3, "LTE"],
  ["Kitchen", 2, "LTE"],
  ["By the bed", 2, "LTE"],
  ["Bathroom", 1, "3G"],
  ["Hallway", 0, "SOS"],
];
const phoneRows = () =>
  PHONE_ROWS.map(
    ([room, bars, net]) =>
      `<li><span>${room}</span><span class="bars small" data-level="${bars}"><i></i><i></i><i></i><i></i></span><em class="${bars <= 1 ? "bad" : ""}">${net}</em></li>`
  ).join("");

const LISTEN_ROWS = [
  ["Footsteps upstairs", 3, "Clearly audible"],
  ["Elevator ding & doors", 3, "Right next door"],
  ["Hallway conversation", 2, "Muffled but there"],
  ["Street traffic", 1, "Faint, windows closed"],
  ["Boiler / pipes clanking", 2, "Every few minutes"],
];
const listenRows = () =>
  LISTEN_ROWS.map(
    ([name, lvl, note], i) =>
      `<li><span class="li-ic mono">${String(i + 1).padStart(2, "0")}</span><span class="li-name">${name}<small>${note}</small></span><span class="level l${lvl}"><i></i><i></i><i></i></span></li>`
  ).join("");

const SMELL_ROWS = [
  ["At the door", 2, "Faint musty note — follow it"],
  ["Kitchen sink / drain", 2, "Sewer sniff when the water sits"],
  ["Beside the gas stove", 0, "No gas. That's the one you want"],
  ["Under-sink cabinet", 3, "Moldy, damp, closed-in"],
  ["Closet by the bed", 1, "Stale, not alarming"],
];
const smellRows = () =>
  SMELL_ROWS.map(
    ([name, lvl, note], i) =>
      `<li><span class="li-ic mono">${String(i + 1).padStart(2, "0")}</span><span class="li-name">${name}<small>${note}</small></span><span class="level l${lvl}"><i></i><i></i><i></i></span></li>`
  ).join("");

const BUILDING_ROWS = [
  ["Hallway lights", 2, "One bulb out, a little grimy"],
  ["Stairs / elevator", 3, "Walk-up. Groceries will notice"],
  ["Trash", 2, "Bins in the yard, not a chute"],
  ["Shared laundry", 1, "Basement, $2.50 / load, evenings packed"],
  ["Mystery fees", 3, "Ask: heat, hot water, 'amenities'"],
];
const buildingRows = () =>
  BUILDING_ROWS.map(
    ([name, lvl, note], i) =>
      `<li><span class="li-ic mono">${String(i + 1).padStart(2, "0")}</span><span class="li-name">${name}<small>${note}</small></span><span class="level l${lvl}"><i></i><i></i><i></i></span></li>`
  ).join("");

function startTool(tool, M) {
  const btn = $("modal-primary");
  btn.disabled = true;
  if (tool === "phone") {
    const msg = $("phone-msg");
    const bars = $("phone-bars");
    const net = $("phone-net");
    const rooms = $("phone-rooms");
    btn.textContent = "Scanning…";
    const seq = [
      [300, "Searching for network…", 0, "—"],
      [900, "Walking to the kitchen…", 1, "3G"],
      [1500, "Checking by the bed…", 2, "LTE"],
      [2100, "Bathroom… hold on…", 1, "3G"],
      [2700, "Hallway… nothing.", 0, "SOS"],
      [3300, "Done. Mixed results.", 2, "LTE"],
    ];
    seq.forEach(([t, text, lvl, n]) => {
      R.toolTimers.push(
        setTimeout(() => {
          msg.innerHTML = text;
          bars.dataset.level = lvl;
          net.textContent = n;
          Sound.tone(600 + lvl * 80, 0.05, "square", 0.02);
        }, t)
      );
    });
    R.toolTimers.push(
      setTimeout(() => {
        rooms.classList.remove("hidden");
        M.toolDone = true;
        renderModal();
      }, 3600)
    );
  } else if (tool === "smell") {
    runTimedList(M, btn, {
      doing: "Breathing…",
      seq: [
        [400, "At the door… a little musty."],
        [1300, "The sink. Sewer, faintly, when the water sits."],
        [2200, "The stove. No gas. Good."],
        [3100, "Cabinet under the sink. Damp. Moldy."],
        [4000, "The closet. Just stale."],
      ],
      doneAt: 4800,
    });
  } else if (tool === "building") {
    runTimedList(M, btn, {
      doing: "Walking the hall…",
      seq: [
        [350, "Hallway: one light out."],
        [1100, "Stairs. No elevator. Count the flights."],
        [1900, "Trash bins in the yard — not a chute."],
        [2700, "Basement laundry. $2.50 a load."],
        [3500, "And that 'amenities fee' the listing skipped."],
      ],
      doneAt: 4200,
    });
  } else {
    runTimedList(M, btn, {
      doing: "Listening…",
      seq: [
        [400, "Shh…"],
        [1300, "…footsteps above you."],
        [2200, "…a ding. The elevator is right there."],
        [3100, "…voices in the hallway."],
        [4000, "…and the pipes just clanked."],
      ],
      doneAt: 4800,
    });
  }
}

function runTimedList(M, btn, { doing, seq, doneAt }) {
  const wave = $("wave");
  const msg = $("listen-msg");
  const list = $("listen-list");
  if (wave) wave.classList.add("active");
  btn.textContent = doing;
  seq.forEach(([t, text]) => R.toolTimers.push(setTimeout(() => (msg.textContent = text), t)));
  R.toolTimers.push(
    setTimeout(() => {
      if (wave) wave.classList.remove("active");
      list.classList.remove("hidden");
      M.toolDone = true;
      renderModal();
    }, doneAt)
  );
}

// ---------------------------------------------------------------------------
// Collecting
// ---------------------------------------------------------------------------
function collect(itemId) {
  if (isFound(itemId)) return;
  const M = R.modal;
  S.found.push(itemId);

  // scoring
  let gained = SCORING.find;
  if (S.lastFindAt !== null && S.elapsedMs - S.lastFindAt < SCORING.streakWindowMs) {
    S.streak++;
    gained += SCORING.streakBonus;
    S.streakBonusTotal += SCORING.streakBonus;
  } else S.streak = 1;
  S.bestStreak = Math.max(S.bestStreak, S.streak);
  S.lastFindAt = S.elapsedMs;
  S.score += gained;

  Sound.found();
  const btn = $("modal-primary");
  const b = btn.getBoundingClientRect();
  floater(`+${gained}`, b.left + b.width / 2, b.top, "gain");
  resetHintCycle();

  const item = ITEMS[itemId];
  toast(`<b>${item.title}</b> added to your checklist.${S.streak >= 2 ? ` <span class="mono">×${S.streak} streak</span>` : ""}`, { kind: "success" });

  // continue to the next item of this hotspot, or close
  const hs = M.hotspot;
  const next = hotspotNextIndex(hs);
  if (next !== -1) {
    const left = hs.items.length - next;
    M.itemIndex = next;
    M.stepIndex = 0;
    M.toolDone = false;
    M.notice = `<span class="i">${ICONS.check}</span><div><b>${item.title} collected (+${gained}).</b> There's more to check right here — ${left} more.</div>`;
    renderModal();
  } else {
    closeModal();
  }

  renderScene({ intro: false }); // refresh pins/classes
  save();

  if (S.found.length >= TOTAL) finishGame();
}

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------
function finishGame() {
  const first = !S.complete;
  S.complete = true;
  closeModal();
  closeDrawer();

  if (first) {
    const { timeBonusMax, timeBonusUnderMs, timeBonusZeroMs } = SCORING;
    const k = Math.min(1, Math.max(0, (timeBonusZeroMs - S.elapsedMs) / (timeBonusZeroMs - timeBonusUnderMs)));
    S.timeBonus = Math.round(timeBonusMax * k);
    S.score += S.timeBonus;
  }

  const rank = [...RANKS].reverse().find((r) => S.score >= r.min) || RANKS[0];
  $("rank-badge").textContent = rank.tier;
  $("rank-badge").dataset.tier = rank.tier;
  $("rank-title").textContent = rank.title;
  $("rank-blurb").textContent = rank.blurb;

  const accuracy = S.clicks ? Math.round(((S.clicks - S.misclicks) / S.clicks) * 100) : 100;
  const best = loadBest();
  const isBest = !best || S.score > best.score;
  if (first && isBest) localStorage.setItem(BEST_KEY, JSON.stringify({ score: S.score, timeMs: S.elapsedMs, rank: rank.title }));

  $("complete-stats").innerHTML = [
    ["Score", `${S.score}${isBest ? ' <small class="new-best">new best</small>' : best ? `<small>best ${best.score}</small>` : ""}`],
    ["Time", fmtTime(S.elapsedMs)],
    ["Checks", `${S.found.length} / ${TOTAL}`],
    ["Hints", `${S.hintsManual} manual · ${S.hintsAuto} auto${S.reveals ? ` · ${S.reveals} reveal` : ""}`],
    ["Accuracy", `${accuracy}% <small>${S.misclicks} stray clicks</small>`],
    ["Best streak", S.bestStreak >= 2 ? `×${S.bestStreak}` : "—"],
  ]
    .map(([l, v]) => `<div class="cstat"><span class="cstat-l mono">${l}</span><span class="cstat-v mono">${v}</span></div>`)
    .join("");

  $("complete-breakdown").innerHTML = `
    <div><span>${TOTAL} checks × ${SCORING.find}</span><b>+${TOTAL * SCORING.find}</b></div>
    <div><span>Streak bonuses</span><b>+${S.streakBonusTotal}</b></div>
    <div><span>Time bonus</span><b>+${S.timeBonus}</b></div>
    <div class="neg"><span>Hints &amp; reveals</span><b>−${S.hintPenaltyTotal}</b></div>
    <div class="total"><span>Total</span><b>${S.score}</b></div>`;

  // grouped checklist
  const list = $("complete-list");
  list.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const ids = Object.entries(ITEMS).filter(([, it]) => it.category === key).map(([id]) => id);
    if (!ids.length) return;
    const g = el("div", "cgroup");
    g.style.setProperty("--c", cat.color);
    g.innerHTML = `<h4>${cat.label}</h4>`;
    const ul = el("ul");
    ids.forEach((id) => {
      const it = ITEMS[id];
      const n = String(Object.keys(ITEMS).indexOf(id) + 1).padStart(2, "0");
      ul.appendChild(el("li", "", `<span class="cg-n mono">${n}</span><div><b>${it.title}</b><p>${it.takeaway}</p></div>`));
    });
    g.appendChild(ul);
    list.appendChild(g);
  });

  if (first) {
    Sound.fanfare();
    spawnConfetti();
    localStorage.removeItem(SAVE_KEY);
  }
  showComplete();
}

function showComplete() {
  closeModal();
  $("complete").classList.remove("hidden");
  updateHUD();
}

function hideComplete() {
  $("complete").classList.add("hidden");
  updateHUD();
}

function spawnConfetti() {
  const c = $("confetti");
  c.innerHTML = "";
  const colors = ["#ffffff", "#9fd8c3", "#f6d58a", "#f3a8b8", "#a9c9f2", "#d9c7f0"];
  for (let i = 0; i < 70; i++) {
    const p = el("i");
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${Math.random() * 1.5}s`;
    p.style.animationDuration = `${2.5 + Math.random() * 2}s`;
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    c.appendChild(p);
  }
}

function checklistText() {
  const lines = ["RENTAL RUSE — Apartment Viewing Checklist", ""];
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const ids = Object.entries(ITEMS).filter(([, it]) => it.category === key).map(([id]) => id);
    if (!ids.length) return;
    lines.push(cat.label.toUpperCase());
    ids.forEach((id) => {
      const it = ITEMS[id];
      lines.push(`  [ ] ${it.title} — ${it.takeaway}`);
      lines.push(`      Ask: ${it.ask}`);
    });
    lines.push("");
  });
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Drawer (checklist)
// ---------------------------------------------------------------------------
function openDrawer() {
  R.drawerOpen = true;
  renderDrawer();
  $("drawer").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
  $("drawer-backdrop").classList.add("show");
}
function closeDrawer() {
  R.drawerOpen = false;
  $("drawer").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
  $("drawer-backdrop").classList.remove("show");
}
function isPhoneNotes() {
  return window.matchMedia("(max-width: 1100px)").matches;
}
function renderDrawer() {
  $("drawer-sub").textContent = `${S.found.length} of ${TOTAL} collected · locked items show a clue`;
  const list = $("drawer-list");
  const keepY = list.scrollTop;
  list.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const ids = Object.entries(ITEMS).filter(([, it]) => it.category === key).map(([id]) => id);
    if (!ids.length) return;
    const found = ids.filter(isFound).length;
    const g = el("div", "dgroup");
    g.style.setProperty("--c", cat.color);
    g.innerHTML = `<h4><span class="dot"></span>${cat.label}<small class="mono">${found}/${ids.length}</small></h4>`;
    ids.forEach((id) => {
      const it = ITEMS[id];
      const f = isFound(id);
      const row = el(
        "button",
        `drow ${f ? "found" : "locked"}`,
        f
          ? `<span class="d-ic ok">${ICONS.check}</span><span class="d-t"><b>${it.title}</b><small>${it.takeaway}</small></span><span class="d-st">${ICONS.arrow}</span>`
          : `<span class="d-ic"></span><span class="d-t"><b>${it.riddle}</b></span><span class="d-st"></span>`
      );
      if (f) {
        row.addEventListener("click", () => {
          if (isPhoneNotes()) closeDrawer();
          const hs = HOTSPOTS.find((h) => h.items && h.items.includes(id));
          if (hs) {
            if (hs.scene !== S.scene) {
              switchScene(hs.scene);
              setTimeout(() => openHotspotAt(hs, id), 260);
            } else openHotspotAt(hs, id);
          } else openTool(id);
        });
      } else row.disabled = true;
      g.appendChild(row);
    });
    list.appendChild(g);
  });
  list.scrollTop = keepY;
}
function openHotspotAt(hs, itemId) {
  openHotspot(hs);
  const i = hs.items.indexOf(itemId);
  R.modal.itemIndex = i;
  R.modal.stepIndex = ITEMS[itemId].steps.length - 1;
  R.modal.review = true;
  renderModal();
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------
function tick(now) {
  if (S.started && !S.complete) {
    const dt = now - R.lastTick;
    R.lastElapsed = S.elapsedMs;
    S.elapsedMs += dt;
    hintTick();
    // cheap HUD refresh for the timer every ~250ms
    if (Math.floor(S.elapsedMs / 250) !== Math.floor(R.lastElapsed / 250)) {
      $("stat-time").textContent = fmtTime(S.elapsedMs);
      const hb = $("btn-hint");
      hb.disabled = S.elapsedMs < R.manualHintReadyAt;
      if (Math.floor(S.elapsedMs / 5000) !== Math.floor(R.lastElapsed / 5000)) {
        updateHUD(); // periodic refresh (reveal button unlock etc.)
        save();
      }
    }
  }
  R.lastTick = now;
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------------------------
// Start / restart
// ---------------------------------------------------------------------------
function startGame(resume) {
  const saved = resume ? loadSave() : null;
  S = saved ? { ...freshState(), ...saved } : freshState();
  if (!S.revealPaid) S.revealPaid = {};
  Object.entries(S.revealed || {}).forEach(([id, on]) => {
    if (on) S.revealPaid[id] = true;
  });
  S.started = true;
  S.complete = false;
  R.lastElapsed = S.elapsedMs;
  R.manualHintReadyAt = 0;
  resetHintCycle();
  $("intro").classList.add("hidden");
  $("complete").classList.add("hidden");
  renderScene();
  Sound.open();
  setTimeout(() => $("rotate-hint").classList.add("gone"), 6000);
  if (saved) toast(`Welcome back. <b>${S.found.length}</b> checks already in your notebook.`, { kind: "success" });
  else toast(`Click anything you'd want to inspect. Start with what you'd use every day.`, { kind: "hint", ms: 6000 });
  save();
}

function showIntro() {
  const saved = loadSave();
  $("btn-resume").classList.toggle("hidden", !saved);
  if (saved) $("btn-resume").textContent = `Resume saved tour (${saved.found.length}/${TOTAL})`;
  const best = loadBest();
  $("intro-best").textContent = best ? `Your best: ${best.score} pts · ${fmtTime(best.timeMs)} · ${best.rank}` : "";
  $("intro").classList.remove("hidden");
}

// ---------------------------------------------------------------------------
// Preload
// ---------------------------------------------------------------------------
function preload() {
  const urls = new Set(Object.values(SCENES).map((s) => s.image));
  Object.values(ITEMS).forEach((it) => it.steps.forEach((st) => st.image && urls.add(st.image)));
  const list = [...urls];
  let done = 0;
  return new Promise((resolve) => {
    const bump = () => {
      done++;
      const pct = Math.round((done / list.length) * 100);
      $("loader-fill").style.width = `${pct}%`;
      $("loader-pct").textContent = `${pct}%`;
      if (done >= list.length) resolve();
    };
    list.forEach((u) => {
      const img = new Image();
      img.onload = bump;
      img.onerror = bump;
      img.src = u;
    });
    setTimeout(resolve, 15000); // never block forever
  });
}

// ---------------------------------------------------------------------------
// Wire up
// ---------------------------------------------------------------------------
function bind() {
  $("hotspot-layer").addEventListener("click", onLayerClick);
  $("hotspot-layer").addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target.dataset.hs) {
      e.preventDefault();
      e.target.click();
    }
  });
  $("btn-start").addEventListener("click", () => startGame(false));
  $("btn-resume").addEventListener("click", () => startGame(true));
  $("btn-again").addEventListener("click", () => startGame(false));
  $("btn-restart").addEventListener("click", () => {
    if (!S.started || S.found.length === 0 || confirm("Restart the viewing? Your progress will be lost.")) {
      localStorage.removeItem(SAVE_KEY);
      startGame(false);
    }
  });
  $("btn-hint").addEventListener("click", () => {
    if ($("btn-hint").disabled) return;
    if (!markerHint(true)) toast("Nothing left to hint at — you're done!", { kind: "success" });
    else toast(`Hint used (−${SCORING.hintCost} pts). Look for the pulsing marker.`, { kind: "warn", ms: 3000 });
  });
  $("btn-reveal").addEventListener("click", revealAll);
  $("btn-hide-reveal").addEventListener("click", hideReveal);
  $("btn-checklist").addEventListener("click", () => (R.drawerOpen ? closeDrawer() : openDrawer()));
  $("btn-drawer-close").addEventListener("click", closeDrawer);
  $("drawer-backdrop").addEventListener("click", closeDrawer);
  $("btn-back").addEventListener("click", () => switchScene("room"));
  $("modal-close").addEventListener("click", closeModal);
  $("modal").addEventListener("click", (e) => {
    if (e.target === $("modal")) closeModal();
  });
  document.querySelectorAll(".tool").forEach((b) => b.addEventListener("click", () => openTool(b.dataset.tool)));
  const soundIcon = () => ($("btn-sound").innerHTML = `<span class="i">${Sound.muted ? ICONS.soundOff : ICONS.soundOn}</span>`);
  $("btn-sound").addEventListener("click", () => {
    Sound.muted = !Sound.muted;
    localStorage.setItem(MUTE_KEY, Sound.muted ? "1" : "0");
    soundIcon();
    if (!Sound.muted) Sound.click();
  });
  soundIcon();
  $("btn-copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(checklistText());
      toast("Checklist copied to clipboard.", { kind: "success" });
    } catch (e) {
      toast("Couldn't access the clipboard — use Print instead.", { kind: "warn" });
    }
  });
  $("btn-print").addEventListener("click", () => window.print());
  $("btn-results").addEventListener("click", showComplete);
  $("complete-close").addEventListener("click", hideComplete);
  $("complete").addEventListener("click", (e) => {
    if (e.target === $("complete")) hideComplete();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (R.modal) closeModal();
      else if (R.drawerOpen) closeDrawer();
      else if (!$("complete").classList.contains("hidden")) hideComplete();
    }
    if ((e.key === "h" || e.key === "H") && S.started && !R.modal && !S.complete) $("btn-hint").click();
    if ((e.key === "c" || e.key === "C") && S.started && !R.modal) $("btn-checklist").click();
  });
  window.addEventListener("resize", layoutScene);
  document.addEventListener("visibilitychange", () => {
    // don't count time while the tab is hidden
    R.lastTick = performance.now();
  });
}

(async function init() {
  mountIcons();
  bind();
  await preload();
  $("loader").classList.add("hide");
  renderScene(); // show the room behind the intro
  showIntro();
  R.lastTick = performance.now();
  requestAnimationFrame(tick);
})();
