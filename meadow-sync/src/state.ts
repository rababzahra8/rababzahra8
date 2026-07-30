import {
  FLOWER_IDS,
  FlowerId,
  GardenState,
  PlantedFlower,
  defaultGarden,
  isFlowerId,
} from "./species";

export type Env = {
  GARDEN?: KVNamespace;
  PROFILE_URL: string;
  GARDEN_TITLE: string;
};

const STATE_KEY = "meadow:v1";
const MAX_PLANTS = 45;

/** Evenly spaced meadow plots — keeps blooms from stacking */
const PLOT_XS = [95, 155, 215, 275, 335, 395, 455, 515, 575, 635, 695, 755, 815, 875];
const PLOT_YS = [312, 348, 384];

function allPlots(): { x: number; y: number }[] {
  const plots: { x: number; y: number }[] = [];
  for (const y of PLOT_YS) {
    for (const x of PLOT_XS) {
      // Soft gap in the center front so path/HUD stays clear
      if (y === 384 && x >= 425 && x <= 545) continue;
      plots.push({ x, y });
    }
  }
  return plots;
}

export async function loadGarden(env: Env): Promise<GardenState> {
  if (!env.GARDEN) return defaultGarden();
  const raw = await env.GARDEN.get(STATE_KEY);
  if (!raw) {
    const seed = defaultGarden();
    await env.GARDEN.put(STATE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return { ...defaultGarden(), ...JSON.parse(raw) } as GardenState;
  } catch {
    return defaultGarden();
  }
}

export async function saveGarden(env: Env, state: GardenState): Promise<void> {
  if (!env.GARDEN) return;
  await env.GARDEN.put(STATE_KEY, JSON.stringify(state));
}

function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function plotKey(x: number, y: number): string {
  return `${x}:${y}`;
}

function occupiedKeys(plants: PlantedFlower[]): Set<string> {
  const plots = allPlots();
  const keys = new Set<string>();
  for (const p of plants) {
    let best = plots[0];
    let bestDist = Infinity;
    for (const plot of plots) {
      const d = (plot.x - p.x) ** 2 + (plot.y - p.y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        best = plot;
      }
    }
    keys.add(plotKey(best.x, best.y));
  }
  return keys;
}

function shuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let n = hash(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    const j = n % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickSlot(state: GardenState, species: FlowerId): { x: number; y: number; scale: number } {
  const taken = occupiedKeys(state.plants);
  const free = allPlots().filter((p) => !taken.has(plotKey(p.x, p.y)));
  const seed = `${species}-${state.version}-${state.plants.length}-${Date.now()}`;
  const pool = free.length ? shuffle(free, seed) : shuffle(allPlots(), seed);
  const chosen = pool[0];
  const n = hash(seed);
  return {
    x: chosen.x + ((n % 11) - 5) * 0.6,
    y: chosen.y + (((n >>> 8) % 7) - 3) * 0.5,
    scale: 0.82 + ((n >>> 16) % 28) / 100,
  };
}

/** Spread every plant onto unique plots (fixes stacked blooms) */
export function rearrangePlants(state: GardenState): GardenState {
  const plots = shuffle(allPlots(), `rearrange-${state.version}-${state.plants.length}`);
  const plants = state.plants.map((p, i) => {
    const plot = plots[i % plots.length];
    const n = hash(`${p.id}-${i}`);
    return {
      ...p,
      x: plot.x + ((n % 9) - 4) * 0.5,
      y: plot.y + (((n >>> 4) % 7) - 3) * 0.4,
      scale: 0.82 + ((n >>> 8) % 28) / 100,
      fresh: false,
    };
  });
  return { ...state, plants, version: state.version + 1 };
}

export async function plantFlower(
  env: Env,
  speciesInput: string,
  planter?: string,
): Promise<{ state: GardenState; planted: PlantedFlower }> {
  const state = await loadGarden(env);
  const species: FlowerId = isFlowerId(speciesInput)
    ? speciesInput
    : FLOWER_IDS[hash(speciesInput || String(Date.now())) % FLOWER_IDS.length];

  const slot = pickSlot(state, species);
  const planted: PlantedFlower = {
    id: `p${state.version + 1}-${Date.now().toString(36)}`,
    species,
    x: slot.x,
    y: slot.y,
    scale: slot.scale,
    plantedAt: Date.now(),
    planter,
    fresh: true,
  };

  state.plants = [...state.plants.map((p) => ({ ...p, fresh: false })), planted].slice(-MAX_PLANTS);
  state.version += 1;
  await saveGarden(env, state);
  return { state, planted };
}

export async function rearrangeGarden(env: Env): Promise<GardenState> {
  const state = rearrangePlants(await loadGarden(env));
  await saveGarden(env, state);
  return state;
}

export async function waterGarden(env: Env): Promise<GardenState> {
  const state = await loadGarden(env);
  state.watered += 1;
  state.version += 1;
  await saveGarden(env, state);
  return state;
}

export async function setWeather(
  env: Env,
  kind: "rain" | "snow" | "clear",
  minutes = 45,
): Promise<GardenState> {
  const state = await loadGarden(env);
  const until = Date.now() + minutes * 60_000;
  if (kind === "rain") {
    state.rainUntil = until;
    state.snowUntil = 0;
  } else if (kind === "snow") {
    state.snowUntil = until;
    state.rainUntil = 0;
  } else {
    state.rainUntil = 0;
    state.snowUntil = 0;
  }
  state.version += 1;
  await saveGarden(env, state);
  return state;
}
