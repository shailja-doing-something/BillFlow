import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, context } = await req.json();

  const systemPrompt = `You are a concise AI assistant embedded in SpendSync — an internal dashboard that tracks AI infrastructure spend across projects and vendors at Fello Innovations.

Current dashboard snapshot:
${context}

Guidelines:
- Keep answers short and direct (2-4 sentences max unless a list is needed)
- Focus on spend insights, trends, vendor analysis, and invoice status
- Use $ amounts and % figures from the data when relevant
- If asked something outside the dashboard data, politely say you only have visibility into the dashboard metrics
- Tone: professional but conversational`;

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
