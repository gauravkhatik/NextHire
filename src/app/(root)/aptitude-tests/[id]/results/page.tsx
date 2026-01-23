"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { useUserRole } from "@/components/hooks/useUserRole";
import LoaderUI from "@/components/LoaderUI";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, UserIcon, TrophyIcon, ClockIcon } from "lucide-react";

function TestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { isInterviewer, isLoading: isRoleLoading } = useUserRole();
  const testId = typeof params?.id === "string" ? params.id : "";

  const test = useQuery(
    api.aptitudeTests.getAptitudeTestById,
    testId ? { id: testId as any } : "skip"
  );

  const attempts = useQuery(
    api.aptitudeTests.getTestAttemptsByTest,
    testId ? { testId: testId as any } : "skip"
  );

  const allUsers = useQuery(api.users.getUsers) ?? [];

  if (isRoleLoading || test === undefined || attempts === undefined) {
    return <LoaderUI />;
  }

  if (!isInterviewer) {
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

  const getUserName = (candidateId: string) => {
    const user = allUsers.find((u) => u.clerkId === candidateId);
    return user?.name || "Unknown Candidate";
  };

  return (
    <div className="container max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/aptitude-tests")}
          className="mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>
        <h1 className="text-3xl font-bold mb-2">Test Results</h1>
        <p className="text-muted-foreground">{test.title}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {attempts.length} attempt{attempts.length !== 1 ? "s" : ""} submitted
        </p>
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No attempts submitted yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const percentage = attempt.percentage;
            const isPass = percentage >= 60;
            const candidateName = getUserName(attempt.candidateId);

            return (
              <Card key={attempt._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{candidateName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Completed: {new Date(attempt.completedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {attempt.score} / {attempt.totalPoints}
                        </p>
                        <p className="text-sm text-muted-foreground">Points</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">Percentage</p>
                      </div>
                      <Badge
                        variant={isPass ? "default" : "destructive"}
                        className="text-lg px-4 py-2"
                      >
                        {isPass ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      Time: {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                    </div>
                    <div>
                      Correct: {attempt.answers.filter((a: any) => a.isCorrect).length} /{" "}
                      {attempt.answers.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TestResultsPage;

