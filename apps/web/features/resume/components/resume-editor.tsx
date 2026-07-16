"use client";

import { getResumeFeedbackAction, updateResumeAction } from "@/features/resume/actions";
import { resumeContentSchema } from "@ez/lib";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Chip,
  Input,
  Label,
  Textarea,
  toast,
} from "@ez/ui";
import type { Resume, ResumeContent } from "@ez/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import * as React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { z } from "zod";

const formSchema = resumeContentSchema;
type FormValues = z.infer<typeof formSchema>;

function newId() {
  return crypto.randomUUID();
}

export function ResumeEditor({ resume }: { resume: Resume }) {
  const [title, setTitle] = React.useState(resume.title);
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [isFetchingFeedback, setIsFetchingFeedback] = React.useState(false);
  const [skillDraft, setSkillDraft] = React.useState("");

  const {
    register,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: resume.content,
  });

  const experience = useFieldArray({ control, name: "experience" });
  const education = useFieldArray({ control, name: "education" });
  const skills = watch("skills");

  async function handleSave() {
    setIsSaving(true);
    const result = await updateResumeAction(resume.id, { title, content: getValues() });
    setIsSaving(false);
    if (result.error) {
      toast({ title: "Couldn't save resume", description: result.error, variant: "error" });
    } else {
      toast({ title: "Resume saved", variant: "success" });
    }
  }

  async function handleGetFeedback() {
    setIsFetchingFeedback(true);
    setFeedback(null);
    const result = await getResumeFeedbackAction(title, getValues() as ResumeContent);
    setIsFetchingFeedback(false);
    if (result.error) {
      toast({ title: "Feedback unavailable", description: result.error, variant: "warning" });
    } else if (result.feedback) {
      setFeedback(result.feedback);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="resume-title">Resume title</Label>
        <Input id="resume-title" value={title} onChange={(event) => setTitle(event.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" error={errors.contact?.fullName?.message}>
            <Input {...register("contact.fullName")} />
          </Field>
          <Field label="Email" error={errors.contact?.email?.message}>
            <Input type="email" {...register("contact.email")} />
          </Field>
          <Field label="Phone">
            <Input {...register("contact.phone")} />
          </Field>
          <Field label="Location">
            <Input {...register("contact.location")} />
          </Field>
          <Field label="LinkedIn">
            <Input {...register("contact.linkedinUrl")} />
          </Field>
          <Field label="Portfolio">
            <Input {...register("contact.portfolioUrl")} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} {...register("summary")} placeholder="A 2-3 sentence professional summary…" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Experience</CardTitle>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              experience.append({
                id: newId(),
                title: "",
                company: "",
                location: "",
                startDate: "",
                endDate: null,
                highlights: [],
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add role
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {experience.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No experience added yet.</p>
          )}
          {experience.fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <Input {...register(`experience.${index}.title`)} />
                </Field>
                <Field label="Company">
                  <Input {...register(`experience.${index}.company`)} />
                </Field>
                <Field label="Location">
                  <Input {...register(`experience.${index}.location`)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start">
                    <Input placeholder="2022-01" {...register(`experience.${index}.startDate`)} />
                  </Field>
                  <Field label="End (blank = present)">
                    <Input placeholder="2024-01" {...register(`experience.${index}.endDate`)} />
                  </Field>
                </div>
              </div>
              <Field label="Highlights (one per line)">
                <Textarea
                  rows={3}
                  defaultValue={field.highlights.join("\n")}
                  onBlur={(event) =>
                    experience.update(index, {
                      ...getValues(`experience.${index}`),
                      highlights: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                    })
                  }
                />
              </Field>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                className="self-start"
                onClick={() => experience.remove(index)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Education</CardTitle>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              education.append({ id: newId(), school: "", degree: "", field: "", startDate: "", endDate: null })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Add education
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {education.fields.length === 0 && (
            <p className="text-sm text-muted-foreground">No education added yet.</p>
          )}
          {education.fields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="School">
                  <Input {...register(`education.${index}.school`)} />
                </Field>
                <Field label="Degree">
                  <Input {...register(`education.${index}.degree`)} />
                </Field>
                <Field label="Field of study">
                  <Input {...register(`education.${index}.field`)} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start">
                    <Input placeholder="2015-09" {...register(`education.${index}.startDate`)} />
                  </Field>
                  <Field label="End">
                    <Input placeholder="2019-05" {...register(`education.${index}.endDate`)} />
                  </Field>
                </div>
              </div>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                className="self-start"
                onClick={() => education.remove(index)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Chip
                key={skill}
                selected
                onRemove={() => {
                  const next = [...skills];
                  next.splice(index, 1);
                  setValue("skills", next, { shouldDirty: true });
                }}
              >
                {skill}
              </Chip>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={skillDraft}
              placeholder="Add a skill and press Enter"
              onChange={(event) => setSkillDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && skillDraft.trim()) {
                  event.preventDefault();
                  setValue("skills", [...skills, skillDraft.trim()], { shouldDirty: true });
                  setSkillDraft("");
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {feedback && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Elizabeth&apos;s feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm text-foreground">{feedback}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={isSaving} onClick={handleSave}>
          {isSaving ? "Saving…" : "Save resume"}
        </Button>
        <Button size="lg" variant="secondary" disabled={isFetchingFeedback} onClick={handleGetFeedback}>
          <Sparkles className="size-4" aria-hidden="true" />
          {isFetchingFeedback ? "Thinking…" : "Get feedback from Elizabeth"}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactElement<{ id?: string }>;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {React.cloneElement(children, { id })}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
