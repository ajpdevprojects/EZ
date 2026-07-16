import { buildElizabethAgent } from "@ez/lib";
import { createAgentUIStreamResponse } from "ai";

export async function POST(request: Request) {
  const agent = buildElizabethAgent();

  if (!agent) {
    return Response.json(
      { error: "Ask EZ isn't available yet — no AI provider has been configured." },
      { status: 503 },
    );
  }

  let messages: unknown[];
  try {
    ({ messages } = await request.json());
    if (!Array.isArray(messages)) throw new Error("messages must be an array");
  } catch {
    return Response.json({ error: "Malformed request body." }, { status: 400 });
  }

  return createAgentUIStreamResponse({ agent, uiMessages: messages });
}
