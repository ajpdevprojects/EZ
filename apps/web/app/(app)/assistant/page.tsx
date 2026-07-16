import { AssistantChat } from "@/features/assistant/components/assistant-chat";
import { isAiConfigured } from "@ez/lib";

export default function AssistantPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-6 py-8">
      <h1 className="font-display text-2xl font-semibold text-foreground">Ask EZ</h1>
      <AssistantChat aiConfigured={isAiConfigured()} />
    </main>
  );
}
