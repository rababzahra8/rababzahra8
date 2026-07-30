import { FLOWER_IDS, SPECIES, defaultGarden } from "./species";
import { renderMeadow } from "./render";
import {
  Env,
  loadGarden,
  plantFlower,
  rearrangeGarden,
  setWeather,
  waterGarden,
} from "./state";

const NO_CACHE = {
  "Content-Type": "image/svg+xml; charset=utf-8",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
  "Access-Control-Allow-Origin": "*",
};

function svgResponse(svg: string, version: number): Response {
  return new Response(svg, {
    headers: {
      ...NO_CACHE,
      ETag: `"meadow-${version}-${Date.now()}"`,
    },
  });
}

function redirect(url: string): Response {
  return Response.redirect(url, 302);
}

function playPage(origin: string): Response {
  const buttons = FLOWER_IDS.map((id) => {
    const s = SPECIES[id];
    return `<a class="btn" href="${origin}/plant?flower=${id}&redirect=${encodeURIComponent(origin + "/play")}">${s.emoji} ${s.label}</a>`;
  }).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Meadow Sync — local play</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0; min-height: 100vh; background: #050814; color: #e2e8f0;
      font-family: ui-rounded, system-ui, sans-serif;
      display: grid; place-items: center; gap: 16px; padding: 24px;
    }
    img { width: min(960px, 100%); border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,.45); }
    .row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 960px; }
    .btn {
      display: inline-block; padding: 10px 14px; border-radius: 999px;
      background: #161b22; color: #e6edf3; text-decoration: none;
      border: 1px solid #30363d; font-size: 14px;
    }
    .btn:hover { border-color: #58a6ff; color: #58a6ff; }
    h1 { margin: 0; font-size: 20px; font-weight: 700; }
    p { margin: 0; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Meadow Sync — plant tester</h1>
  <p>Click a flower to plant it. The meadow reloads with your bloom.</p>
  <img src="${origin}/meadow.svg?t=${Date.now()}" alt="Meadow Sync" width="960" height="480" />
  <div class="row">
    ${buttons}
    <a class="btn" href="${origin}/water?redirect=${encodeURIComponent(origin + "/play")}">💧 Water</a>
    <a class="btn" href="${origin}/weather?kind=rain&redirect=${encodeURIComponent(origin + "/play")}">🌧️ Rain</a>
    <a class="btn" href="${origin}/weather?kind=clear&redirect=${encodeURIComponent(origin + "/play")}">✨ Clear</a>
    <a class="btn" href="${origin}/rearrange?redirect=${encodeURIComponent(origin + "/play")}">🔀 Rearrange</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const origin = url.origin;
    const profile = env.PROFILE_URL || "https://github.com/rababzahra8";
    const title = env.GARDEN_TITLE || "Meadow Sync";
    const defaultBack = `${origin}/play`;

    try {
      if (path === "/play") {
        return playPage(origin);
      }

      if (path === "/" || path === "/meadow.svg" || path === "/meadow") {
        const state = await loadGarden(env);
        const hour = url.searchParams.has("hour")
          ? Number(url.searchParams.get("hour"))
          : 21;
        const svg = renderMeadow(state, { title, hour });
        return svgResponse(svg, state.version);
      }

      if (path === "/plant") {
        const flower = url.searchParams.get("flower") || url.searchParams.get("species") || "random";
        const planter = url.searchParams.get("by") || "local";
        const species = flower === "random" ? FLOWER_IDS[Math.floor(Math.random() * FLOWER_IDS.length)] : flower;
        await plantFlower(env, species, planter);
        return redirect(url.searchParams.get("redirect") || defaultBack);
      }

      if (path === "/water") {
        await waterGarden(env);
        return redirect(url.searchParams.get("redirect") || defaultBack);
      }

      if (path === "/rearrange") {
        await rearrangeGarden(env);
        return redirect(url.searchParams.get("redirect") || defaultBack);
      }

      if (path === "/weather") {
        const kind = (url.searchParams.get("kind") || "rain") as "rain" | "snow" | "clear";
        await setWeather(env, kind);
        return redirect(url.searchParams.get("redirect") || defaultBack);
      }

      if (path === "/api/state") {
        const state = await loadGarden(env);
        return Response.json(state, {
          headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
        });
      }

      if (path === "/preview") {
        const hour = Number(url.searchParams.get("hour") ?? 21);
        const state = defaultGarden();
        state.rainUntil = hour === 21 ? Date.now() + 60_000 : 0;
        return svgResponse(renderMeadow(state, { title, hour }), 0);
      }

      if (path === "/health") {
        return Response.json({ ok: true, species: Object.keys(SPECIES), kv: Boolean(env.GARDEN) });
      }

      return new Response(
        `Meadow Sync\n\nOpen /play to plant flowers in the browser.\n\nGET /play\nGET /meadow.svg\nGET /plant?flower=ble|sunflower|rose|...\n`,
        { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const svg = renderMeadow(defaultGarden(), { title });
      return new Response(svg, {
        status: 200,
        headers: {
          ...NO_CACHE,
          "X-Meadow-Error": message.slice(0, 120),
        },
      });
    }
  },
} satisfies ExportedHandler<Env>;
