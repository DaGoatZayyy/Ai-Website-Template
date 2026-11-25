import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await fetch("http://127.0.0.1:11434/api/tags", { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "Ollama returned an error. Make sure it is running." }, { status: 502 });
    }
    const data = await response.json();
    return NextResponse.json({ models: data.models ?? [] });
  } catch {
    return NextResponse.json({
      error: "Can't reach Ollama at http://127.0.0.1:11434. Start Ollama and try again.",
    }, { status: 503 });
  }
}