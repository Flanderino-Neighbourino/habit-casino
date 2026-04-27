// Habit Casino sync worker.
//
// Endpoints:
//   GET  /sync/:hash  → returns { data, updatedAt } or 404
//   PUT  /sync/:hash  → body { data }, stores it, returns { updatedAt }
//
// :hash is sha256(passphrase) hex-encoded, computed client-side.
// The passphrase itself never leaves the device.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body, init = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { ...CORS, "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/sync\/([a-f0-9]{64})$/);
    if (!match) {
      return json({ error: "not_found" }, { status: 404 });
    }
    const key = match[1];

    if (request.method === "GET") {
      const stored = await env.HABIT_KV.get(key, "json");
      if (!stored) return json({ error: "not_found" }, { status: 404 });
      return json(stored);
    }

    if (request.method === "PUT") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid_json" }, { status: 400 });
      }
      if (!body || typeof body.data !== "string") {
        return json({ error: "missing_data" }, { status: 400 });
      }
      // Cap at ~1MB to be safe with KV limits
      if (body.data.length > 1_000_000) {
        return json({ error: "too_large" }, { status: 413 });
      }
      const updatedAt = new Date().toISOString();
      const record = { data: body.data, updatedAt };
      await env.HABIT_KV.put(key, JSON.stringify(record));
      return json({ updatedAt });
    }

    return json({ error: "method_not_allowed" }, { status: 405 });
  },
};
