import { buildInterviewPrepQuestions } from "@ez/lib";
import { Card, CardContent, CardHeader, CardTitle } from "@ez/ui";

export function InterviewPrep({ skills }: { skills: string[] }) {
  const questionSets = buildInterviewPrepQuestions(skills);

  return (
    <div className="flex flex-col gap-4">
      {questionSets.map((set) => (
        <Card key={set.category}>
          <CardHeader>
            <CardTitle className="text-base">{set.category}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-foreground">
              {set.questions.map((question) => (
                <li key={question} className="flex gap-2">
                  <span className="text-muted-foreground" aria-hidden="true">
                    •
                  </span>
                  {question}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
