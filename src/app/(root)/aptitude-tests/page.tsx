"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUserRole } from "@/components/hooks/useUserRole";
import { useRouter } from "next/navigation";
import LoaderUI from "@/components/LoaderUI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, ClockIcon, FileTextIcon, PencilIcon, BarChartIcon } from "lucide-react";
import AptitudeTestDialog from "@/components/AptitudeTestDialog";
import { useState } from "react";
import toast from "react-hot-toast";
import { Id } from "../../../../convex/_generated/dataModel";

function AptitudeTestsPage() {
  const router = useRouter();
  const { isInterviewer, isCandidate, isLoading } = useUserRole();
  // For interviewers: get all tests they created, for candidates: get active tests
  const interviewerTests = useQuery(
    api.aptitudeTests.getAptitudeTestsByCreator,
    isInterviewer ? {} : "skip"
  );
  const candidateTests = useQuery(
    api.aptitudeTests.getActiveAptitudeTests,
    isCandidate ? {} : "skip"
  );
  const candidateAttempts = useQuery(
    api.aptitudeTests.getTestAttemptsByCandidate,
    isCandidate ? {} : "skip"
  );
  const deleteTest = useMutation(api.aptitudeTests.deleteAptitudeTest);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTestId, setEditingTestId] = useState<Id<"aptitudeTests"> | undefined>();

  if (isLoading || (isInterviewer && interviewerTests === undefined) || (isCandidate && candidateTests === undefined)) {
    return <LoaderUI />;
  }

  if (!isInterviewer && !isCandidate) {
    router.push("/");
    return <LoaderUI />;
  }

  const testsList = isInterviewer ? (interviewerTests || []) : (candidateTests || []);
  const attemptsMap = new Map(
    (candidateAttempts || []).map((attempt) => [attempt.testId, attempt])
  );

  const handleDelete = async (testId: string) => {
    if (!confirm("Are you sure you want to delete this test?")) return;

    try {
      await deleteTest({ id: testId as any });
      toast.success("Test deleted successfully");
    } catch (error) {
      toast.error("Failed to delete test");
    }
  };

  return (
    <div className="container max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Aptitude Tests</h1>
          <p className="text-muted-foreground mt-1">
            {isInterviewer
              ? "Create and manage aptitude tests"
              : "Take available aptitude tests"}
          </p>
        </div>

        {isInterviewer && (
          <>
            <Button onClick={() => {
              setEditingTestId(undefined);
              setShowDialog(true);
            }}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Test
            </Button>
            <AptitudeTestDialog
              open={showDialog}
              onOpenChange={(open) => {
                setShowDialog(open);
                if (!open) setEditingTestId(undefined);
              }}
              testId={editingTestId}
            />
          </>
        )}
      </div>

      {testsList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {isInterviewer
            ? "No tests created yet. Create your first test!"
            : "No tests available at the moment"}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testsList.map((test) => (
            <Card key={test._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{test.title}</CardTitle>
                    {test.description && (
                      <CardDescription className="mt-2">
                        {test.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {test.duration} min
                  </div>
                  <div className="flex items-center gap-1">
                    <FileTextIcon className="h-4 w-4" />
                    {test.questions.length} questions
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {test.totalPoints} points
                  </Badge>
                  {isInterviewer ? (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/aptitude-tests/${test._id}/results`)}
                      >
                        <BarChartIcon className="h-4 w-4 mr-1" />
                        Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTestId(test._id);
                          setShowDialog(true);
                        }}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(test._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : (
                    (() => {
                      const attempt = attemptsMap.get(test._id);
                      return attempt ? (
                        <Button
                          onClick={() => router.push(`/aptitude-tests/${test._id}/result`)}
                          variant="outline"
                        >
                          View Results
                        </Button>
                      ) : (
                        <Button
                          onClick={() => router.push(`/aptitude-tests/${test._id}`)}
                        >
                          Start Test
                        </Button>
                      );
                    })()
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AptitudeTestsPage;

