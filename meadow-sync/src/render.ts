import { GardenState, PlantedFlower, SPECIES } from "./species";

const W = 960;
const H = 480;

type Phase = "sunrise" | "day" | "sunset" | "night";

function phaseOfHour(hour: number): Phase {
  if (hour >= 5 && hour < 8) return "sunrise";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
}

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function defs(): string {
  return `
  <defs>
    <linearGradient id="skyDawn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a2744"/>
      <stop offset="35%" stop-color="#ff7e6b"/>
      <stop offset="62%" stop-color="#ffb347"/>
      <stop offset="100%" stop-color="#ffe29a"/>
    </linearGradient>
    <linearGradient id="skyDay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3aa0ff"/>
      <stop offset="45%" stop-color="#7ec8ff"/>
      <stop offset="100%" stop-color="#d4f0ff"/>
    </linearGradient>
    <linearGradient id="skyDusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1b1140"/>
      <stop offset="30%" stop-color="#6b2d6b"/>
      <stop offset="58%" stop-color="#e85d4c"/>
      <stop offset="100%" stop-color="#ffb56b"/>
    </linearGradient>
    <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050814"/>
      <stop offset="45%" stop-color="#0d1630"/>
      <stop offset="100%" stop-color="#152238"/>
    </linearGradient>
    <linearGradient id="groundFar" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1a5c3a"/>
      <stop offset="100%" stop-color="#0d3322"/>
    </linearGradient>
    <linearGradient id="groundMid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#248a52"/>
      <stop offset="100%" stop-color="#145c36"/>
    </linearGradient>
    <linearGradient id="groundNear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2fbf6a"/>
      <stop offset="55%" stop-color="#1f8f4c"/>
      <stop offset="100%" stop-color="#0f4a2c"/>
    </linearGradient>
    <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c4a574" stop-opacity="0"/>
      <stop offset="20%" stop-color="#d8b88a" stop-opacity="0.85"/>
      <stop offset="80%" stop-color="#d8b88a" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#c4a574" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="sunCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff7d6"/>
      <stop offset="45%" stop-color="#ffd36b"/>
      <stop offset="100%" stop-color="#ff9a3c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moonCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f5f8ff"/>
      <stop offset="55%" stop-color="#c9d7ff"/>
      <stop offset="100%" stop-color="#8fa8e8" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bloomGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="40%" stop-color="#ffe08a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffe08a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="glassFill" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#0b1220" stop-opacity="0.55"/>
    </linearGradient>
    <linearGradient id="glassEdge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#58a6ff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.15"/>
    </linearGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softBlur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.4"/>
    </filter>
    <filter id="sparkle" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="drop" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#04150c" flood-opacity="0.35"/>
    </filter>
    <radialGradient id="vignette" cx="50%" cy="45%" r="70%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.55"/>
    </radialGradient>
    <linearGradient id="meteorTrail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff8e7" stop-opacity="0"/>
      <stop offset="55%" stop-color="#ffe9a8" stop-opacity="0.35"/>
      <stop offset="85%" stop-color="#ffffff" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>
    </linearGradient>
  </defs>`;
}

function skyLayers(phase: Phase): string {
  const opacity = {
    sunrise: { dawn: 1, day: 0.15, dusk: 0, night: 0.1 },
    day: { dawn: 0, day: 1, dusk: 0, night: 0 },
    sunset: { dawn: 0.15, day: 0.1, dusk: 1, night: 0.2 },
    night: { dawn: 0, day: 0, dusk: 0.1, night: 1 },
  }[phase];

  return `
  <g id="sky">
    <rect width="${W}" height="${H}" fill="url(#skyNight)" opacity="${opacity.night}"/>
    <rect width="${W}" height="${H}" fill="url(#skyDawn)" opacity="${opacity.dawn}">
      <animate attributeName="opacity" values="${opacity.dawn};${Math.min(1, opacity.dawn + 0.12)};${opacity.dawn}" dur="12s" repeatCount="indefinite"/>
    </rect>
    <rect width="${W}" height="${H}" fill="url(#skyDay)" opacity="${opacity.day}">
      <animate attributeName="opacity" values="${opacity.day};${Math.min(1, opacity.day + 0.08)};${opacity.day}" dur="16s" repeatCount="indefinite"/>
    </rect>
    <rect width="${W}" height="${H}" fill="url(#skyDusk)" opacity="${opacity.dusk}">
      <animate attributeName="opacity" values="${opacity.dusk};${Math.min(1, opacity.dusk + 0.1)};${opacity.dusk}" dur="14s" repeatCount="indefinite"/>
    </rect>
  </g>`;
}

function starField(): string {
  const dots = Array.from({ length: 52 }, (_, i) => {
    const x = 18 + ((i * 89 + 13) % 920);
    const y = 14 + ((i * 47 + 7) % 200);
    // Keep clear of the moon area (top-right)
    if (x > 760 && y < 130) return "";
    const r = 0.6 + (i % 4) * 0.35;
    const dur = 2 + (i % 6) * 0.45;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8f0ff"><animate attributeName="opacity" values="0.2;1;0.2" dur="${dur}s" begin="${(i % 9) * 0.22}s" repeatCount="indefinite"/></circle>`;
  }).join("");

  // Extra sparkle stars (4-point)
  const spark = Array.from({ length: 10 }, (_, i) => {
    const x = 40 + ((i * 91) % 700);
    const y = 24 + ((i * 37) % 150);
    return `<path d="M${x} ${y} l1.1 2.8 2.8 1.1 -2.8 1.1 -1.1 2.8 -1.1 -2.8 -2.8 -1.1 2.8 -1.1 z" fill="#fff7c2" opacity="0.7">
      <animate attributeName="opacity" values="0.2;0.95;0.2" dur="${2.8 + (i % 3)}s" begin="${i * 0.5}s" repeatCount="indefinite"/>
    </path>`;
  }).join("");

  return `<g id="stars">${dots}${spark}</g>`;
}

/** Constellation — star positions only (no lines / no label) */
function constellation(): string {
  const left = [
    [120, 70],
    [148, 58],
    [176, 52],
    [206, 58],
    [232, 72],
  ];
  const right = [
    [280, 48],
    [310, 42],
    [342, 50],
    [368, 66],
    [388, 88],
  ];
  const knot: [number, number] = [256, 78];
  const points = [...left, knot, ...right];
  const stars = points
    .map(([x, y], i) => {
      const r = i === left.length ? 2.4 : 1.6;
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#e0e7ff">
        <animate attributeName="opacity" values="0.55;1;0.55" dur="${3 + (i % 4) * 0.4}s" begin="${i * 0.15}s" repeatCount="indefinite"/>
      </circle>`;
    })
    .join("");

  return `<g id="constellation" opacity="0.95">${stars}</g>`;
}

/** Shooting star (meteor) streaking across the night sky */
/** Shooting star — quick soft streak (original timing, softer trail) */
function shootingStar(): string {
  return `
  <g id="shooting-star">
    <g opacity="0">
      <animate attributeName="opacity" values="0;0;1;0.7;0;0" keyTimes="0;0.72;0.76;0.86;0.91;1" dur="8s" repeatCount="indefinite"/>
      <animateTransform attributeName="transform" type="translate"
        values="70 42;70 42;340 118;470 165;470 165;470 165"
        keyTimes="0;0.72;0.86;0.91;0.95;1" dur="8s" repeatCount="indefinite"/>
      <!-- layered soft trail (fades out behind the head) -->
      <line x1="-38" y1="-16" x2="-2" y2="-1" stroke="#fff8e7" stroke-width="1.8" stroke-linecap="round" opacity="0.25"/>
      <line x1="-26" y1="-11" x2="-1" y2="-0.5" stroke="#ffe9a8" stroke-width="1.4" stroke-linecap="round" opacity="0.55"/>
      <line x1="-14" y1="-6" x2="0" y2="0" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity="0.9"/>
      <circle r="2.2" fill="#ffffff"/>
      <circle r="4.5" fill="#fff8e7" opacity="0.28"/>
    </g>
  </g>`;
}

function celestial(phase: Phase): string {
  if (phase === "night") {
    // Stars first, then moon on top — solid full moon (no dark crescent overlay)
    return `
    ${starField()}
    ${constellation()}
    ${shootingStar()}`;
  }

  const sunY = phase === "sunrise" ? 110 : phase === "sunset" ? 95 : 70;
  const sunX = phase === "sunrise" ? 140 : phase === "sunset" ? 820 : 780;
  return `
  <g id="sun" transform="translate(${sunX},${sunY})" filter="url(#softGlow)">
    <circle r="70" fill="url(#sunCore)" opacity="0.95">
      <animate attributeName="r" values="66;74;66" dur="6s" repeatCount="indefinite"/>
    </circle>
    <circle r="22" fill="#fff4c2"/>
    <g stroke="#ffe08a" stroke-width="2" opacity="0.45" stroke-linecap="round">
      ${[0, 45, 90, 135, 180, 225, 270, 315]
        .map(
          (a, i) =>
            `<line x1="0" y1="-34" x2="0" y2="-48" transform="rotate(${a})"><animate attributeName="opacity" values="0.2;0.7;0.2" dur="${3 + i * 0.2}s" repeatCount="indefinite"/></line>`,
        )
        .join("")}
    </g>
  </g>`;
}

function clouds(): string {
  const cloud = (_cx: number, cy: number, s: number, dur: number, delay: number, opacity: number) => `
    <g opacity="${opacity}">
      <g>
        <ellipse cx="0" cy="0" rx="${38 * s}" ry="${16 * s}" fill="#dbe7ff"/>
        <ellipse cx="${26 * s}" cy="${-6 * s}" rx="${24 * s}" ry="${14 * s}" fill="#e8f0ff"/>
        <ellipse cx="${-24 * s}" cy="${-3 * s}" rx="${20 * s}" ry="${12 * s}" fill="#dbe7ff"/>
        <ellipse cx="${8 * s}" cy="${-12 * s}" rx="${18 * s}" ry="${11 * s}" fill="#f5f8ff"/>
        <animateTransform attributeName="transform" type="translate" from="${-120} ${cy}" to="${1080} ${cy}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
      </g>
    </g>`;
  return `<g id="clouds">${cloud(0, 95, 1.1, 48, 0, 0.2)}${cloud(0, 130, 0.85, 62, 8, 0.14)}${cloud(0, 70, 0.7, 55, 18, 0.12)}</g>`;
}

function hills(): string {
  return `
  <g id="hills">
    <path d="M0 250 C120 210 210 235 320 218 C450 198 520 240 650 220 C780 200 860 230 960 215 L960 320 L0 320 Z" fill="#0f3a28" opacity="0.75"/>
    <path d="M0 275 C150 245 260 270 400 252 C560 230 680 275 960 248 L960 340 L0 340 Z" fill="url(#groundFar)" opacity="0.95"/>
    <path d="M0 300 C180 275 300 305 460 288 C620 270 760 310 960 292 L960 360 L0 360 Z" fill="url(#groundMid)"/>
  </g>`;
}

function tree(x: number, y: number, scale: number, sway: number, dur: number): string {
  return `
  <g transform="translate(${x} ${y}) scale(${scale})" filter="url(#drop)">
    <ellipse cx="8" cy="4" rx="22" ry="6" fill="#04150c" opacity="0.28"/>
    <path d="M2 8 C4 -20 5 -55 6 -78 C7 -55 9 -20 12 8 Z" fill="#6b4428"/>
    <path d="M5 8 C6 -30 6 -50 7 -70" fill="none" stroke="#8b5a33" stroke-width="1.2" opacity="0.5"/>
    <g>
      <ellipse cx="6" cy="-92" rx="40" ry="32" fill="#145c36" opacity="0.95"/>
      <ellipse cx="-14" cy="-78" rx="28" ry="22" fill="#1f7a45"/>
      <ellipse cx="28" cy="-76" rx="26" ry="20" fill="#259653"/>
      <ellipse cx="6" cy="-108" rx="22" ry="16" fill="#3dd87e" opacity="0.92"/>
      <ellipse cx="-4" cy="-88" rx="10" ry="7" fill="#7CFFB2" opacity="0.35" filter="url(#softGlow)"/>
      <animateTransform attributeName="transform" type="rotate" values="-${sway};${sway};-${sway}" dur="${dur}s" repeatCount="indefinite" additive="sum"/>
    </g>
  </g>`;
}

function grassBlades(): string {
  // Skip the center strip so we don't get tall glowing "yellow line" artifacts mid-meadow
  const blades = Array.from({ length: 46 }, (_, i) => {
    const x = 12 + i * 21;
    if (x > 400 && x < 560) return "";
    const h = 10 + (i % 4) * 3;
    const dur = 2.8 + (i % 4) * 0.4;
    return `<path d="M${x} 390 Q${x - 3} ${390 - h / 2} ${x + (i % 2 ? 2 : -2)} ${390 - h}" fill="none" stroke="#2fbf6a" stroke-width="1.6" stroke-linecap="round" opacity="0.4">
      <animate attributeName="d" dur="${dur}s" repeatCount="indefinite"
        values="M${x} 390 Q${x - 3} ${390 - h / 2} ${x + (i % 2 ? 2 : -2)} ${390 - h};M${x} 390 Q${x + 2} ${390 - h / 2} ${x - (i % 2 ? 2 : -2)} ${390 - h};M${x} 390 Q${x - 3} ${390 - h / 2} ${x + (i % 2 ? 2 : -2)} ${390 - h}"/>
    </path>`;
  }).join("");
  return `
  <g id="grass">
    <rect y="355" width="${W}" height="125" fill="url(#groundNear)"/>
    <path d="M0 355 Q140 338 280 356 T560 350 T960 360 L960 380 L0 380 Z" fill="#34c76f" opacity="0.85"/>
    ${blades}
  </g>`;
}

function renderFlower(p: PlantedFlower, index: number): string {
  const s = SPECIES[p.species];
  const fresh = p.fresh
    ? `<circle r="28" fill="url(#bloomGlow)" opacity="0.9"><animate attributeName="opacity" values="0.9;0;0.9" dur="2.2s" repeatCount="indefinite"/><animate attributeName="r" values="18;36;18" dur="2.2s" repeatCount="indefinite"/></circle>
       ${Array.from({ length: 8 }, (_, i) => {
         const a = (i * 45 * Math.PI) / 180;
         const x2 = Math.cos(a) * 34;
         const y2 = Math.sin(a) * 34;
         return `<circle r="2.2" fill="${s.glow}" filter="url(#sparkle)"><animateTransform attributeName="transform" type="translate" from="0 0" to="${x2} ${y2}" dur="1.6s" begin="${i * 0.08}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.6s" begin="${i * 0.08}s" repeatCount="indefinite"/></circle>`;
       }).join("")}`
    : "";

  const swayDur = 3.6 + (index % 5) * 0.35;
  const stem = `<line x1="0" y1="8" x2="0" y2="52" stroke="#2f9a55" stroke-width="${2.4 * p.scale}" stroke-linecap="round"/>
    <ellipse cx="-8" cy="28" rx="8" ry="3.5" fill="#3dd87e" transform="rotate(-28 -8 28)" opacity="0.9"/>
    <ellipse cx="8" cy="32" rx="7" ry="3" fill="#2fbf6a" transform="rotate(30 8 32)" opacity="0.9"/>`;

  let bloom = "";
  switch (p.species) {
    case "sunflower":
    case "daisy":
    case "ble":
      bloom = `
        <g>
          ${[0, 45, 90, 135, 180, 225, 270, 315]
            .map((a) => `<ellipse cx="0" cy="-16" rx="5" ry="11" fill="${s.petals}" transform="rotate(${a})" opacity="0.95"/>`)
            .join("")}
          <circle r="8" fill="${s.core}"/>
          <circle r="3.2" fill="${s.glow}" opacity="0.8"/>
          <animateTransform attributeName="transform" type="rotate" values="-5;5;-5" dur="${swayDur}s" repeatCount="indefinite"/>
        </g>`;
      break;
    case "rose":
    case "lotus":
      bloom = `
        <g>
          <circle r="11" fill="${s.petals}" filter="url(#softGlow)"/>
          <circle cx="-4" cy="-3" r="7" fill="${s.glow}" opacity="0.85"/>
          <circle cx="5" cy="-1" r="6" fill="${s.core}" opacity="0.9"/>
          <circle r="2.5" fill="#fff" opacity="0.55"/>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="${swayDur}s" repeatCount="indefinite"/>
        </g>`;
      break;
    case "tulip":
      bloom = `
        <path d="M0 -20 C-12 -8 -14 8 0 14 C14 8 12 -8 0 -20 Z" fill="${s.petals}" filter="url(#softGlow)">
          <animate attributeName="d" dur="${swayDur}s" repeatCount="indefinite"
            values="M0 -20 C-12 -8 -14 8 0 14 C14 8 12 -8 0 -20 Z;M0 -23 C-13 -9 -15 7 0 14 C15 7 13 -9 0 -23 Z;M0 -20 C-12 -8 -14 8 0 14 C14 8 12 -8 0 -20 Z"/>
        </path>
        <path d="M0 -8 C-4 0 -3 8 0 10 C3 8 4 0 0 -8 Z" fill="${s.core}" opacity="0.55"/>`;
      break;
    case "lavender":
      bloom = `
        <g>
          <line x1="-5" y1="10" x2="-5" y2="36" stroke="#2f9a55" stroke-width="2"/>
          <line x1="6" y1="10" x2="6" y2="34" stroke="#2f9a55" stroke-width="2"/>
          <ellipse cx="-5" cy="-2" rx="5" ry="14" fill="${s.petals}" opacity="0.95" filter="url(#softGlow)"/>
          <ellipse cx="6" cy="0" rx="4.5" ry="12" fill="${s.glow}" opacity="0.9"/>
          <circle cx="-5" cy="-12" r="2.2" fill="#ede9fe"/>
          <circle cx="6" cy="-10" r="2" fill="#ede9fe"/>
          <animateTransform attributeName="transform" type="rotate" values="-3;4;-3" dur="${swayDur}s" repeatCount="indefinite" additive="sum"/>
        </g>`;
      break;
    case "nightbloom":
      bloom = `
        <g filter="url(#softGlow)">
          <path d="M0 -16 L4 -4 L16 -2 L6 6 L8 18 L0 10 L-8 18 L-6 6 L-16 -2 L-4 -4 Z" fill="${s.petals}"/>
          <circle r="3.5" fill="${s.core}"/>
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="22s" repeatCount="indefinite"/>
        </g>`;
      break;
    case "orchid":
      bloom = `
        <g>
          <ellipse cx="0" cy="-6" rx="7" ry="12" fill="${s.petals}" transform="rotate(-18)" filter="url(#softGlow)"/>
          <ellipse cx="0" cy="-6" rx="7" ry="12" fill="${s.glow}" transform="rotate(18)" opacity="0.9"/>
          <ellipse cx="0" cy="2" rx="10" ry="5" fill="${s.core}" opacity="0.85"/>
          <circle r="2.4" fill="#fff" opacity="0.7"/>
          <animateTransform attributeName="transform" type="rotate" values="-4;4;-4" dur="${swayDur}s" repeatCount="indefinite"/>
        </g>`;
      break;
  }

  return `
  <g transform="translate(${p.x} ${p.y}) scale(${p.scale})" filter="url(#drop)">
    ${fresh}
    ${p.species === "lavender" ? "" : stem}
    ${bloom}
  </g>`;
}

function fireflies(phase: Phase): string {
  if (phase !== "night" && phase !== "sunset") return "";
  return `<g id="fireflies" filter="url(#sparkle)">
    ${Array.from({ length: 14 }, (_, i) => {
      const x = 80 + ((i * 67) % 800);
      const y = 250 + ((i * 41) % 120);
      const dur = 3 + (i % 4);
      return `<circle cx="${x}" cy="${y}" r="2.4" fill="${i % 2 ? "#ffe08a" : "#b8f0ff"}">
        <animate attributeName="opacity" values="0.1;1;0.1" dur="${dur}s" begin="${i * 0.3}s" repeatCount="indefinite"/>
        <animateTransform attributeName="transform" type="translate" values="0 0;8 -12;-6 6;0 0" dur="${dur + 2}s" repeatCount="indefinite"/>
      </circle>`;
    }).join("")}
  </g>`;
}

function fauna(): string {
  return `
  <g id="fauna">
    <g opacity="0.95" filter="url(#softGlow)">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="120 220;280 180;460 210;650 160;820 200;980 170" dur="28s" repeatCount="indefinite"/>
        <g>
          <ellipse cx="-5" cy="0" rx="6" ry="9" fill="#ff9ecd"/>
          <ellipse cx="5" cy="0" rx="6" ry="9" fill="#c084fc"/>
          <rect x="-1" y="-4" width="2" height="10" rx="1" fill="#3b2f2f"/>
          <animateTransform attributeName="transform" type="scale" values="1;1.18;0.88;1" dur="0.55s" repeatCount="indefinite"/>
        </g>
      </g>
    </g>
    <g opacity="0.88">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="900 240;700 190;480 230;260 170;80 210;-40 180" dur="34s" repeatCount="indefinite"/>
        <ellipse cx="-4" cy="0" rx="5" ry="7" fill="#7dd3fc"/>
        <ellipse cx="4" cy="0" rx="5" ry="7" fill="#38bdf8"/>
        <rect x="-1" y="-3" width="2" height="8" rx="1" fill="#334155"/>
      </g>
    </g>
    <g fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" opacity="0.5">
      <g>
        <animateTransform attributeName="transform" type="translate" from="-40 90" to="1000 70" dur="26s" repeatCount="indefinite"/>
        <path d="M0 0 Q8 -6 16 0 Q24 -6 32 0">
          <animate attributeName="d" values="M0 0 Q8 -6 16 0 Q24 -6 32 0;M0 0 Q8 -10 16 0 Q24 -10 32 0;M0 0 Q8 -6 16 0 Q24 -6 32 0" dur="0.7s" repeatCount="indefinite"/>
        </path>
      </g>
    </g>
    ${[0, 1, 2, 3, 4]
      .map((i) => {
        const y = 200 + i * 28;
        const dur = 18 + i * 3;
        const rot = -20 + i * 12;
        return `<g opacity="0.75">
          <animateTransform attributeName="transform" type="translate" from="${-30 + i * 40} ${y}" to="1000 ${y + 40}" dur="${dur}s" begin="${i * 2}s" repeatCount="indefinite"/>
          <ellipse rx="7" ry="3.5" fill="${i % 2 ? "#3dd87e" : "#f0c14a"}" transform="rotate(${rot})"/>
        </g>`;
      })
      .join("")}
  </g>`;
}

function weather(state: GardenState, phase: Phase): string {
  const now = Date.now();
  const raining = state.rainUntil > now;
  const snowing = state.snowUntil > now;
  if (!raining && !snowing) return "";

  if (snowing) {
    return `<g id="snow" fill="#ffffff">
      ${Array.from({ length: 36 }, (_, i) => {
        const x = 20 + ((i * 53) % 920);
        const dur = 4 + (i % 5);
        return `<circle cx="${x}" cy="0" r="${1.2 + (i % 3) * 0.6}" opacity="0.75">
          <animate attributeName="cy" from="${-10 - (i % 40)}" to="480" dur="${dur}s" begin="${(i % 8) * 0.35}s" repeatCount="indefinite"/>
          <animate attributeName="cx" values="${x};${x + 18};${x - 10};${x}" dur="${dur}s" repeatCount="indefinite"/>
        </circle>`;
      }).join("")}
    </g>`;
  }

  return `<g id="rain" stroke="#b6dcff" stroke-width="1.4" opacity="0.45">
    ${Array.from({ length: 28 }, (_, i) => {
      const x = 30 + ((i * 61) % 900);
      const dur = 1.1 + (i % 4) * 0.2;
      return `<line x1="${x}" y1="0" x2="${x - 8}" y2="22">
        <animate attributeName="y1" values="-20;420" dur="${dur}s" begin="${(i % 6) * 0.15}s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="10;450" dur="${dur}s" begin="${(i % 6) * 0.15}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0;0.55;0" dur="${dur}s" begin="${(i % 6) * 0.15}s" repeatCount="indefinite"/>
      </line>`;
    }).join("")}
  </g>`;
}

function glassHud(state: GardenState, title: string, phase: Phase): string {
  const mood = state.snowUntil > Date.now()
    ? "snow"
    : state.rainUntil > Date.now()
      ? "rain"
      : phase === "night"
        ? "night"
        : phase === "sunset"
          ? "dusk"
          : phase === "sunrise"
            ? "dawn"
            : "bloom";
  const moodColor =
    mood === "rain" ? "#7dd3fc" : mood === "snow" ? "#e2e8f0" : mood === "night" ? "#c4b5fd" : mood === "dusk" ? "#fb923c" : "#4ade80";

  // One horizontal bar — equal-height / equal-width stat cells
  const barX = 28;
  const barY = 412;
  const barW = 904;
  const barH = 48;
  const pad = 18;
  const gap = 12;
  const stats = [
    { label: "blooms", value: String(state.plants.length), color: "#7dd3fc" },
    { label: "watered", value: String(state.watered), color: "#4ade80" },
    { label: "mood", value: mood, color: moodColor },
  ];
  const titleW = 340;
  const statsAreaX = barX + titleW + gap;
  const statsAreaW = barW - titleW - gap - pad;
  const cellW = (statsAreaW - gap * (stats.length - 1)) / stats.length;

  const statCells = stats
    .map((s, i) => {
      const x = statsAreaX + i * (cellW + gap);
      return `
      <g transform="translate(${x},${barY + 8})">
        <rect width="${cellW}" height="32" rx="10" fill="#ffffff" fill-opacity="0.08" stroke="url(#glassEdge)" stroke-width="1"/>
        <text x="14" y="21" fill="#94a3b8" font-size="11">${s.label}</text>
        <text x="${cellW - 14}" y="21" text-anchor="end" fill="${s.color}" font-size="13" font-weight="700">${esc(s.value)}</text>
      </g>`;
    })
    .join("");

  return `
  <g id="hud" font-family="ui-rounded, 'SF Pro Rounded', 'Segoe UI', system-ui, sans-serif">
    <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="14" fill="url(#glassFill)" stroke="url(#glassEdge)" stroke-width="1.3"/>
    <text x="${barX + pad}" y="${barY + 20}" fill="#f8fafc" font-size="15" font-weight="700">${esc(title)}</text>
    <text x="${barX + pad}" y="${barY + 38}" fill="#cbd5e1" font-size="11">Click a flower badge below to plant in the meadow</text>
    ${statCells}
  </g>`;
}

function sparkles(): string {
  return `<g id="ambient-sparkles" filter="url(#sparkle)">
    ${Array.from({ length: 12 }, (_, i) => {
      const x = 60 + ((i * 79) % 860);
      const y = 160 + ((i * 37) % 180);
      return `<path d="M${x} ${y} l1.2 3.2 3.2 1.2 -3.2 1.2 -1.2 3.2 -1.2 -3.2 -3.2 -1.2 3.2 -1.2 z" fill="#fff7c2" opacity="0.55">
        <animate attributeName="opacity" values="0.15;0.9;0.15" dur="${2.5 + (i % 4)}s" begin="${i * 0.4}s" repeatCount="indefinite"/>
      </path>`;
    }).join("")}
  </g>`;
}

export function renderMeadow(
  state: GardenState,
  opts: { title?: string; hour?: number } = {},
): string {
  const hour = opts.hour ?? new Date().getUTCHours();
  const phase = phaseOfHour(hour);
  const title = opts.title ?? "Meadow Sync";
  const plants = [...state.plants].sort((a, b) => a.y - b.y || a.x - b.x);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)} — living profile meadow</title>
  <desc id="desc">A premium animated meadow with glowing flowers, fireflies, drifting clouds, and soft weather. Visitors plant blooms from the GitHub profile README.</desc>
  ${defs()}
  ${skyLayers(phase)}
  ${celestial(phase)}
  ${clouds()}
  ${hills()}
  ${tree(72, 318, 1.05, 2.5, 5.5)}
  ${tree(250, 300, 0.72, 1.8, 7)}
  ${tree(880, 330, 0.7, 2.0, 6.5)}
  ${grassBlades()}
  <g id="flowers">
    ${plants.map((p, i) => renderFlower(p, i)).join("\n")}
  </g>
  ${fauna()}
  ${fireflies(phase)}
  ${sparkles()}
  ${weather(state, phase)}
  <!-- vignette only over the ground so the moon stays bright -->
  <rect x="0" y="220" width="${W}" height="260" fill="url(#vignette)" opacity="0.35" pointer-events="none"/>
  ${phase === "night" ? `<g id="moon-front" transform="translate(700,85)">
      <circle cx="0" cy="0" r="30" fill="#ffe8a3" opacity="0.25"/>
      <circle cx="0" cy="0" r="22" fill="#fff8e1" stroke="#ffe082" stroke-width="1.5"/>
    </g>` : ""}
  ${glassHud(state, title, phase)}
</svg>`;
}
