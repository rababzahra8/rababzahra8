#!/usr/bin/env node
/**
 * Apply a garden issue command to assets/garden-state.json and regenerate the SVG.
 * Usage:
 *   node meadow-sync/scripts/apply-issue.mjs "garden: plant ble" "octocat"
 *   node meadow-sync/scripts/apply-issue.mjs "garden: water"
 *   node meadow-sync/scripts/apply-issue.mjs "garden: rain"
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");
const statePath = join(root, "assets/garden-state.json");
const SPECIES = [
  "sunflower",
  "rose",
  "tulip",
  "lavender",
  "daisy",
  "nightbloom",
  "ble",
  "orchid",
  "lotus",
];

function hash(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function load() {
  return JSON.parse(readFileSync(statePath, "utf8"));
}

function save(state) {
  writeFileSync(statePath, JSON.stringify(state, null, 2) + "\n");
}

function allPlots() {
  const xs = [95, 155, 215, 275, 335, 395, 455, 515, 575, 635, 695, 755, 815, 875];
  const ys = [312, 348, 384];
  const plots = [];
  for (const y of ys) {
    for (const x of xs) {
      if (y === 384 && x >= 425 && x <= 545) continue;
      plots.push({ x, y });
    }
  }
  return plots;
}

function shuffle(items, seed) {
  const arr = [...items];
  let n = hash(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = n % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickSlot(state, species) {
  const plots = allPlots();
  const taken = new Set();
  for (const p of state.plants) {
    let best = plots[0];
    let bestDist = Infinity;
    for (const plot of plots) {
      const d = (plot.x - p.x) ** 2 + (plot.y - p.y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = plot;
      }
    }
    taken.add(`${best.x}:${best.y}`);
  }
  const free = plots.filter((p) => !taken.has(`${p.x}:${p.y}`));
  const seed = `${species}-${state.version}-${state.plants.length}-${Date.now()}`;
  const pool = free.length ? shuffle(free, seed) : shuffle(plots, seed);
  const chosen = pool[0];
  const n = hash(seed);
  return {
    x: chosen.x + ((n % 11) - 5) * 0.6,
    y: chosen.y + (((n >>> 8) % 7) - 3) * 0.5,
    scale: 0.82 + ((n >>> 16) % 28) / 100,
  };
}

function apply(title, planter) {
  const state = load();
  const t = title.toLowerCase().trim();
  const now = Date.now();

  if (t.includes("water")) {
    state.watered += 1;
  } else if (t.includes("snow")) {
    state.snowUntil = now + 45 * 60_000;
    state.rainUntil = 0;
  } else if (t.includes("rain")) {
    state.rainUntil = now + 45 * 60_000;
    state.snowUntil = 0;
  } else if (t.includes("clear")) {
    state.rainUntil = 0;
    state.snowUntil = 0;
  } else if (t.includes("plant")) {
    const found = SPECIES.find((s) => t.includes(s)) || SPECIES[hash(t + now) % SPECIES.length];
    const slot = pickSlot(state, found);
    state.plants = state.plants.map((p) => ({ ...p, fresh: false }));
    state.plants.push({
      id: `p${state.version + 1}-${now.toString(36)}`,
      species: found,
      x: slot.x,
      y: slot.y,
      scale: slot.scale,
      plantedAt: now,
      planter: planter || undefined,
      fresh: true,
    });
    if (state.plants.length > 48) state.plants = state.plants.slice(-48);
  } else {
    console.log("No garden command matched:", title);
    return false;
  }

  state.version += 1;
  save(state);
  console.log("Updated garden state → version", state.version);
  return true;
}

const title = process.argv[2] || "";
const planter = process.argv[3] || "";
if (!title) {
  console.error("Missing issue title");
  process.exit(1);
}

const changed = apply(title, planter);
if (!changed) process.exit(0);

const gen = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", "scripts/generate-preview.mjs"],
  {
    cwd: join(root, "meadow-sync"),
    encoding: "utf8",
    env: process.env,
    shell: false,
  },
);
process.stdout.write(gen.stdout || "");
process.stderr.write(gen.stderr || "");
process.exit(gen.status ?? 1);
