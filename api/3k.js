const UPSTREAM =
  "https://backend-ddv.3k-darts.com/2k-backend-ddv/api/v1/frontend/event/";

const ALLOWED_ORIGINS = new Set([
  "https://fclachendorf.github.io",
]);

function allowCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isAllowedPath(path) {
  return (
    /^\d+\/phase\/0\/round\/0\/table$/.test(path) ||
    /^\d+\/participant$/.test(path) ||
    /^\d+\/performance\?teamId=\d+$/.test(path)
  );
}

module.exports = async function handler(req, res) {
  allowCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const raw = Array.isArray(req.query.path) ? req.query.path[0] : req.query.path;
  const path = String(raw || "").replace(/^\/+/, "");

  if (!isAllowedPath(path)) {
    return res.status(400).json({ error: "Invalid 3K path" });
  }

  try {
    const response = await fetch(UPSTREAM + path, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FC-Lachendorf-Darts-Tools/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    const body = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        error: "3K upstream request failed",
        status: response.status,
      });
    }

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(body);
  } catch (error) {
    return res.status(502).json({
      error: "3K upstream unavailable",
      detail: error && error.name === "TimeoutError" ? "timeout" : "network",
    });
  }
};
