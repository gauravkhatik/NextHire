"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/components/hooks/useUserRole";
import LoaderUI from "@/components/LoaderUI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ClockIcon, CheckCircleIcon } from "lucide-react";

function TakeAptitudeTestPage() {
  const params = useParams();
  const router = useRouter();
  const { isCandidate, isLoading: isRoleLoading } = useUserRole();
  const testId = typeof params?.id === "string" ? params.id : "";
  const test = useQuery(
    api.aptitudeTests.getAptitudeTestById,
    testId ? { id: testId as any } : "skip"
  );
  const submitTest = useMutation(api.aptitudeTests.submitTestAttempt);

  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (test && !startedAt) {
      setStartedAt(Date.now());
      setTimeRemaining(test.duration * 60); // Convert to seconds
    }
  }, [test, startedAt]);

  useEffect(() => {
    if (timeRemaining > 0 && !isCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, isCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (isCompleted) return;

    if (!autoSubmit && Object.keys(answers).length < test!.questions.length) {
      if (
        !confirm(
          "You haven't answered all questions. Are you sure you want to submit?"
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    setIsCompleted(true);

    try {
      const answerArray = test!.questions.map((_, index) => ({
        questionIndex: index,
        selectedAnswer: answers[index] ?? -1,
      }));

      await submitTest({
        testId: testId as any,
        answers: answerArray,
        startedAt: startedAt!,
        completedAt: Date.now(),
      });

      toast.success("Test submitted successfully!");
      router.push(`/aptitude-tests/${testId}/result`);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast.error("Failed to submit test");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRoleLoading) return <LoaderUI />;

  if (!isCandidate) {
    router.push("/");
    return null;
  }

  if (!test) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Test not found</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
              Test Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your test has been submitted successfully. Redirecting to results...
            </p>
            <Button onClick={() => router.push(`/aptitude-tests/${testId}/result`)}>
              View Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{test.title}</h1>
          {test.description && (
            <p className="text-muted-foreground mt-1">{test.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <ClockIcon className="h-5 w-5" />
          {formatTime(timeRemaining)}
        </div>
      </div>

      <div className="space-y-6">
        {test.questions.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">
                Question {index + 1} ({question.points} point
                {question.points !== 1 ? "s" : ""})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base">{question.question}</p>
              <RadioGroup
                value={answers[index]?.toString()}
                onValueChange={(value) =>
                  setAnswers({ ...answers, [index]: parseInt(value) })
                }
              >
                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={optIndex.toString()}
                      id={`q${index}-opt${optIndex}`}
                    />
                    <Label
                      htmlFor={`q${index}-opt${optIndex}`}
                      className="cursor-pointer flex-1"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? "Submitting..." : "Submit Test"}
        </Button>
      </div>
    </div>
  );
}

export default TakeAptitudeTestPage;

