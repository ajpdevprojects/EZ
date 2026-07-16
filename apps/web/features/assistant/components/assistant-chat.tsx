"use client";

import { Button, Card, CardContent, EmptyState, Input } from "@ez/ui";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Compass,
  FileText,
  type LucideIcon,
  MessageCircle,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import * as React from "react";

export type AssistantSuggestionIcon =
  | "resume"
  | "cover-letter"
  | "interview"
  | "goal"
  | "progress"
  | "review";

const ICON_MAP: Record<AssistantSuggestionIcon, LucideIcon> = {
  resume: FileText,
  "cover-letter": MessageSquare,
  interview: Sparkles,
  goal: Compass,
  progress: TrendingUp,
  review: MessageCircle,
};

export interface AssistantSuggestion {
  icon: AssistantSuggestionIcon;
  label: string;
  prompt: string;
}

const DEFAULT_SUGGESTIONS: AssistantSuggestion[] = [
  { icon: "resume", label: "Optimize my resume", prompt: "Can you help me optimize my resume for a product design role?" },
  { icon: "cover-letter", label: "Write a cover letter", prompt: "Can you help me write a cover letter tailored for this job?" },
  { icon: "interview", label: "Prepare for interview", prompt: "Can you help me prepare for an upcoming interview?" },
];

export interface AssistantChatProps {
  aiConfigured: boolean;
  greeting?: string;
  suggestions?: AssistantSuggestion[];
  unavailableTitle?: string;
  unavailableDescription?: string;
}

export function AssistantChat({
  aiConfigured,
  greeting = "Hi, I'm Elizabeth. How can I help you today?",
  suggestions = DEFAULT_SUGGESTIONS,
  unavailableTitle = "Ask EZ isn't available yet",
  unavailableDescription = "Connect an AI provider to unlock Elizabeth's help with resumes, cover letters, and interview prep.",
}: AssistantChatProps) {
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
        title={unavailableTitle}
        description={unavailableDescription}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {messages.length === 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4">
            <Sparkles className="mt-0.5 size-5 text-primary" aria-hidden="true" />
            <p className="text-sm text-foreground">{greeting}</p>
          </div>
          <div className="flex flex-col gap-2">
            {suggestions.map((suggestion) => {
              const Icon = ICON_MAP[suggestion.icon];
              return (
                <Card key={suggestion.label} className="cursor-pointer hover:border-primary/40">
                  <CardContent
                    className="flex items-center gap-3 p-4"
                    onClick={() => handleSend(suggestion.prompt)}
                  >
                    <Icon className="size-4 text-primary" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{suggestion.label}</span>
                  </CardContent>
                </Card>
              );
            })}
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
