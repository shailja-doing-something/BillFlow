import OpenAI from "openai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { messages, context } = await req.json();

  const systemPrompt = `You are a concise AI assistant embedded in Billflow — an internal dashboard that tracks AI infrastructure spend across projects and vendors at Fello Innovations.

Current dashboard snapshot:
${context}

Guidelines:
- Keep answers short and direct (2-4 sentences max unless a list is needed)
- Focus on spend insights, trends, vendor analysis, and invoice status
- Use $ amounts and % figures from the data when relevant
- If asked something outside the dashboard data, politely say you only have visibility into the dashboard metrics
- Tone: professional but conversational`;

  const stream = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 400,
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
