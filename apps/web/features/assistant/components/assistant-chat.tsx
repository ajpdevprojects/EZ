"use client";

import { Button, Card, CardContent, EmptyState, Input } from "@ez/ui";
import { useChat } from "@ai-sdk/react";
import { ArrowUp, FileText, MessageSquare, Sparkles } from "lucide-react";
import * as React from "react";

const SUGGESTIONS = [
  { icon: FileText, label: "Optimize my resume", prompt: "Can you help me optimize my resume for a product design role?" },
  { icon: MessageSquare, label: "Write a cover letter", prompt: "Can you help me write a cover letter tailored for this job?" },
  { icon: Sparkles, label: "Prepare for interview", prompt: "Can you help me prepare for an upcoming interview?" },
];

export function AssistantChat({ aiConfigured }: { aiConfigured: boolean }) {
  const { messages, status, sendMessage } = useChat();
  const [input, setInput] = React.useState("");

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    setInput("");
  }

  if (!aiConfigured) {
    return (
      <EmptyState
        icon={<Sparkles className="size-6" aria-hidden="true" />}
        title="Ask EZ isn't available yet"
        description="Connect an AI provider to unlock Elizabeth's help with resumes, cover letters, and interview prep."
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {messages.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4">
            <Sparkles className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <p className="text-sm text-foreground">Hi, I&apos;m Elizabeth. How can I help you today?</p>
          </div>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Card key={suggestion.label} className="cursor-pointer hover:border-primary/40">
                <CardContent
                  className="flex items-center gap-3 p-4"
                  onClick={() => handleSend(suggestion.prompt)}
                >
                  <suggestion.icon className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">{suggestion.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "self-end rounded-3xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground max-w-[85%]"
                  : "self-start rounded-3xl rounded-bl-md bg-card px-4 py-3 text-sm text-foreground max-w-[85%] border border-border"
              }
            >
              {message.parts.map((part, index) =>
                part.type === "text" ? <span key={index}>{part.text}</span> : null,
              )}
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2"
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask Elizabeth anything…"
          disabled={status !== "ready"}
          aria-label="Message"
        />
        <Button type="submit" size="icon" variant="icon" disabled={status !== "ready"} aria-label="Send">
          <ArrowUp className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
