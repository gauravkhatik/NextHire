"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/components/hooks/useUserRole";
import LoaderUI from "@/components/LoaderUI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircleIcon, XCircleIcon, TrophyIcon, ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

function TestResultPage() {
  const params = useParams();
  const router = useRouter();
  const { isCandidate, isLoading: isRoleLoading } = useUserRole();
  const testId = typeof params?.id === "string" ? params.id : "";

  const test = useQuery(
    api.aptitudeTests.getAptitudeTestById,
    testId ? { id: testId as any } : "skip"
  );

  const attempts = useQuery(api.aptitudeTests.getTestAttemptsByCandidate) ?? [];
  const [currentAttempt, setCurrentAttempt] = useState<any>(null);

  useEffect(() => {
    if (attempts && testId) {
      // Find the most recent attempt for this test
      const testAttempts = attempts.filter(
        (a: any) => a.testId === testId
      );
      if (testAttempts.length > 0) {
        // Get the most recent attempt
        const latest = testAttempts.sort((a: any, b: any) => b.completedAt - a.completedAt)[0];
        setCurrentAttempt(latest);
      }
    }
  }, [attempts, testId]);

  if (isRoleLoading) return <LoaderUI />;

  if (!isCandidate) {
    router.push("/");
    return null;
  }

  if (!test || !currentAttempt) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Result not found</p>
        </div>
      </div>
    );
  }

  const percentage = currentAttempt.percentage;
  const isPass = percentage >= 60;

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Test Results</h1>
        <p className="text-muted-foreground">{test.title}</p>
      </div>

      {/* Score Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="h-6 w-6" />
            Your Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {currentAttempt.score} / {currentAttempt.totalPoints}
              </p>
              <p className="text-muted-foreground">Points</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
              <p className="text-muted-foreground">Percentage</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isPass ? "default" : "destructive"} className="text-lg px-4 py-2">
              {isPass ? "Passed" : "Failed"}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ClockIcon className="h-4 w-4" />
              Time: {Math.floor(currentAttempt.timeSpent / 60)}m {currentAttempt.timeSpent % 60}s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {test.questions.map((question, index) => {
            const answer = currentAttempt.answers.find(
              (a: any) => a.questionIndex === index
            );
            const isCorrect = answer?.isCorrect ?? false;
            const selectedOption = answer?.selectedAnswer ?? -1;

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  isCorrect
                    ? "border-green-500 bg-green-500/10"
                    : "border-red-500 bg-red-500/10"
                }`}
              >
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">
                      Question {index + 1} ({question.points} point
                      {question.points !== 1 ? "s" : ""})
                    </p>
                    <p className="mt-1">{question.question}</p>
                  </div>
                </div>

                <div className="space-y-2 ml-7">
                  {question.options.map((option, optIndex) => {
                    const isSelected = selectedOption === optIndex;
                    const isCorrectAnswer = question.correctAnswer === optIndex;

                    return (
                      <div
                        key={optIndex}
                        className={`p-2 rounded ${
                          isCorrectAnswer
                            ? "bg-green-500/20 border border-green-500"
                            : isSelected && !isCorrectAnswer
                            ? "bg-red-500/20 border border-red-500"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isCorrectAnswer && (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          )}
                          {isSelected && !isCorrectAnswer && (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          )}
                          <span
                            className={
                              isCorrectAnswer
                                ? "font-semibold"
                                : isSelected && !isCorrectAnswer
                                ? "line-through"
                                : ""
                            }
                          >
                            {option}
                          </span>
                          {isCorrectAnswer && (
                            <Badge variant="outline" className="ml-auto">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => router.push("/aptitude-tests")}>
          Back to Tests
        </Button>
      </div>
    </div>
  );
}

export default TestResultPage;

