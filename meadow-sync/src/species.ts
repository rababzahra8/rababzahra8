export type FlowerId =
  | "sunflower"
  | "rose"
  | "tulip"
  | "lavender"
  | "daisy"
  | "nightbloom"
  | "ble"
  | "orchid"
  | "lotus";

export interface PlantedFlower {
  id: string;
  species: FlowerId;
  x: number;
  y: number;
  scale: number;
  plantedAt: number;
  planter?: string;
  fresh?: boolean;
}

export interface GardenState {
  plants: PlantedFlower[];
  watered: number;
  rainUntil: number;
  snowUntil: number;
  version: number;
}

export const SPECIES: Record<
  FlowerId,
  { label: string; emoji: string; petals: string; core: string; glow: string }
> = {
  sunflower: {
    label: "Sunflower",
    emoji: "🌻",
    petals: "#ffd56a",
    core: "#6b3e12",
    glow: "#ffe08a",
  },
  rose: {
    label: "Rose",
    emoji: "🌹",
    petals: "#ff6b8a",
    core: "#c73b55",
    glow: "#ff9aaf",
  },
  tulip: {
    label: "Tulip",
    emoji: "🌷",
    petals: "#7ec8ff",
    core: "#3d8fd4",
    glow: "#b8e0ff",
  },
  lavender: {
    label: "Lavender",
    emoji: "💜",
    petals: "#b794f6",
    core: "#7c5cbf",
    glow: "#d6bcff",
  },
  daisy: {
    label: "Daisy",
    emoji: "🌼",
    petals: "#fff8e7",
    core: "#f0c14a",
    glow: "#fff3c4",
  },
  nightbloom: {
    label: "Night Bloom",
    emoji: "✨",
    petals: "#ff9f43",
    core: "#ffd93d",
    glow: "#ffc078",
  },
  ble: {
    label: "BLE Pulse",
    emoji: "📡",
    petals: "#58a6ff",
    core: "#0b1220",
    glow: "#8ec8ff",
  },
  orchid: {
    label: "Orchid",
    emoji: "🦋",
    petals: "#e879f9",
    core: "#c026d3",
    glow: "#f0abfc",
  },
  lotus: {
    label: "Lotus",
    emoji: "🪷",
    petals: "#fda4af",
    core: "#fb7185",
    glow: "#fecdd3",
  },
};

export const FLOWER_IDS = Object.keys(SPECIES) as FlowerId[];

export function isFlowerId(value: string): value is FlowerId {
  return value in SPECIES;
}

export function defaultGarden(): GardenState {
  const now = Date.now();
  const starters: { id: string; species: FlowerId; x: number; y: number; scale: number; ago: number }[] = [
    { id: "s1", species: "sunflower", x: 95, y: 312, scale: 1.05, ago: 8e6 },
    { id: "s2", species: "rose", x: 215, y: 348, scale: 0.92, ago: 7e6 },
    { id: "s3", species: "tulip", x: 275, y: 312, scale: 1, ago: 6e6 },
    { id: "s4", species: "lavender", x: 335, y: 348, scale: 0.95, ago: 5e6 },
    { id: "s5", species: "ble", x: 455, y: 312, scale: 1.08, ago: 4e6 },
    { id: "s6", species: "daisy", x: 515, y: 348, scale: 0.9, ago: 3e6 },
    { id: "s7", species: "orchid", x: 575, y: 312, scale: 1, ago: 2e6 },
    { id: "s8", species: "lotus", x: 635, y: 348, scale: 0.96, ago: 1e6 },
    { id: "s9", species: "nightbloom", x: 755, y: 312, scale: 1.02, ago: 5e5 },
    { id: "s10", species: "tulip", x: 815, y: 348, scale: 0.88, ago: 2e5 },
    { id: "s11", species: "rose", x: 155, y: 384, scale: 0.78, ago: 9e5 },
    { id: "s12", species: "daisy", x: 695, y: 384, scale: 0.8, ago: 4e5 },
  ];
  return {
    watered: 12,
    rainUntil: 0,
    snowUntil: 0,
    version: 1,
    plants: starters.map((s) => ({
      id: s.id,
      species: s.species,
      x: s.x,
      y: s.y,
      scale: s.scale,
      plantedAt: now - s.ago,
    })),
  };
}
