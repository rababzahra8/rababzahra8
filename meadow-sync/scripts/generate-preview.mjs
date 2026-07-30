import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultGarden } from "../src/species.ts";
import { renderMeadow } from "../src/render.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const statePath = join(__dirname, "../../assets/garden-state.json");
const out = join(__dirname, "../../assets/meadow-sync.svg");

mkdirSync(dirname(out), { recursive: true });

let state = defaultGarden();
if (existsSync(statePath)) {
  state = { ...defaultGarden(), ...JSON.parse(readFileSync(statePath, "utf8")) };
}

const raining = (state.rainUntil || 0) > Date.now();
// README asset stays in the magical dusk/night look; Worker uses live UTC hour.
const hour = raining ? 21 : Number(process.env.MEADOW_HOUR || 21);
const svg = renderMeadow(state, { title: "Meadow Sync", hour });
writeFileSync(out, svg, "utf8");
console.log(`Wrote ${out} (${svg.length} bytes) · blooms=${state.plants.length} · hour=${hour}`);
