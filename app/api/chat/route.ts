import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { model, messages } = await request.json();
    if (typeof model !== "string" || !model || !Array.isArray(messages)) {
      return Response.json({ error: "A model and message history are required." }, { status: 400 });
    }

    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
      signal: request.signal,
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => "");
      return Response.json({ error: detail || "Ollama couldn't generate a response." }, { status: response.status || 502 });
    }

    return new Response(response.body, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return Response.json({ error: "Couldn't connect to Ollama. Make sure it is running locally." }, { status: 500 });
  }
}