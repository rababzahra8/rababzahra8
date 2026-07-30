# Meadow Sync

Premium interactive meadow for the GitHub profile README.

## Quick start

```bash
cd meadow-sync
npm install
npm run generate   # writes ../assets/meadow-sync.svg
npm run dev        # then open http://localhost:8787/meadow.svg
```

## Test planting in the browser

```bash
cd meadow-sync
npm install
npm run dev
```

Then open **http://localhost:8787/play**

Click any flower button → it plants into local KV and reloads the meadow.
You should see the blooms counter go up and a new flower appear (with a glow if it was just planted).

Direct URLs also work:

- http://localhost:8787/plant?flower=sunflower
- http://localhost:8787/plant?flower=ble
- http://localhost:8787/water
- http://localhost:8787/meadow.svg

### Without the Worker (static SVG only)

```bash
node scripts/apply-issue.mjs "garden: plant rose" "you"
open ../assets/meadow-sync.svg
```


- `/preview?hour=6` sunrise
- `/preview?hour=12` day
- `/preview?hour=19` sunset
- `/preview?hour=21` night + fireflies

## Deploy (Cloudflare Workers)

```bash
npx wrangler login
npx wrangler kv namespace create GARDEN
# paste the id into wrangler.jsonc under kv_namespaces
npm run deploy
```
