# Habit Casino sync worker

Tiny Cloudflare Worker that backs the optional cross-device sync feature.
Stores one blob per `sha256(passphrase)` in Cloudflare KV.

## Deploy

```bash
cd worker
wrangler kv:namespace create habit_sync   # outputs an id
# paste the printed `id = "..."` value into wrangler.toml under [[kv_namespaces]]
wrangler deploy
```

Wrangler prints the deployed URL. Hand that URL back to the app
configuration so the frontend knows where to sync to.

## Endpoints

- `GET /sync/:hash` → `{ data, updatedAt }` or 404
- `PUT /sync/:hash` (body: `{ data }`) → `{ updatedAt }`

`:hash` is the hex-encoded SHA-256 of the user's passphrase, computed
client-side. The passphrase never leaves the device.
