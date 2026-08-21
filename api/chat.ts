// Proxy server-side hacia la API de Anthropic, para Vercel.
// La API key vive solo en process.env (sin prefijo VITE_), nunca llega al bundle del navegador.
// Equivalente a netlify/functions/chat.mts, mismo comportamiento, para cuando el sitio
// corre en Vercel en vez de (o ademas de) Netlify.
// Este sitio es de acceso publico sin login, asi que en vez de exigir auth
// se limita la tasa de requests por IP para frenar abuso/consumo de cuota.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX;
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
    if (isRateLimited(ip)) {
      return new Response(
        JSON.stringify({ error: { message: "Demasiadas solicitudes, intenta de nuevo en un minuto." } }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: { message: "ANTHROPIC_API_KEY no configurada en el servidor" } }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await req.text();

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body,
    });

    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream" },
    });
  },
};
