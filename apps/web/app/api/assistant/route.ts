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

  const { messages } = await request.json();

  return createAgentUIStreamResponse({ agent, uiMessages: messages });
}
