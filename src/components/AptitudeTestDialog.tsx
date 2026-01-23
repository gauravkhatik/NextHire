"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

function AptitudeTestDialog({
  open,
  onOpenChange,
  testId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId?: Id<"aptitudeTests">;
}) {
  const createTest = useMutation(api.aptitudeTests.createAptitudeTest);
  const updateTest = useMutation(api.aptitudeTests.updateAptitudeTest);
  const test = useQuery(
    api.aptitudeTests.getAptitudeTestById,
    testId ? { id: testId } : "skip"
  );
  const candidates = useQuery(api.users.getCandidates) || [];
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 30,
    isQuestionSet: false,
    assignedCandidates: [] as string[],
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 1,
      },
    ] as Question[],
  });

  // Load test data when editing
  useEffect(() => {
    if (test && testId) {
      setFormData({
        title: test.title,
        description: test.description || "",
        duration: test.duration,
        isQuestionSet: test.isQuestionSet || false,
        assignedCandidates: test.assignedCandidates || [],
        questions: test.questions,
      });
    } else if (!testId) {
      // Reset form for new test
      setFormData({
        title: "",
        description: "",
        duration: 30,
        isQuestionSet: false,
        assignedCandidates: [],
        questions: [
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0,
            points: 1,
          },
        ],
      });
    }
  }, [test, testId, open]);

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: 0,
          points: 1,
        },
      ],
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const updateQuestion = (
    index: number,
    field: keyof Question,
    value: string | number | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, j) => (j === optionIndex ? value : opt)),
            }
          : q
      ),
    }));
  };

  const toggleCandidate = (candidateId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedCandidates: prev.assignedCandidates.includes(candidateId)
        ? prev.assignedCandidates.filter((id) => id !== candidateId)
        : [...prev.assignedCandidates, candidateId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error("Please enter a test title");
      return;
    }
    if (formData.questions.some((q) => !q.question.trim())) {
      toast.error("Please fill in all questions");
      return;
    }
    if (
      formData.questions.some((q) =>
        q.options.some((opt) => !opt.trim())
      )
    ) {
      toast.error("Please fill in all options for each question");
      return;
    }

    setIsCreating(true);

    try {
      if (testId) {
        // Update existing test
        await updateTest({
          id: testId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          duration: formData.duration,
          isQuestionSet: formData.isQuestionSet,
          assignedCandidates: formData.assignedCandidates,
          questions: formData.questions.map((q) => ({
            question: q.question.trim(),
            options: q.options.map((opt) => opt.trim()),
            correctAnswer: q.correctAnswer,
            points: q.points,
          })),
        });
        toast.success("Aptitude test updated successfully!");
      } else {
        // Create new test
        await createTest({
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          duration: formData.duration,
          isQuestionSet: formData.isQuestionSet,
          assignedCandidates: formData.assignedCandidates,
          questions: formData.questions.map((q) => ({
            question: q.question.trim(),
            options: q.options.map((opt) => opt.trim()),
            correctAnswer: q.correctAnswer,
            points: q.points,
          })),
        });
        toast.success("Aptitude test created successfully!");
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving test:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save test"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{testId ? "Edit Aptitude Test" : "Create Aptitude Test"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Test Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Technical Aptitude Test"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Test description..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes) *</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 30,
                })
              }
            />
          </div>

          {/* Question Set Option */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="isQuestionSet"
              checked={formData.isQuestionSet}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  isQuestionSet: checked === true,
                })
              }
            />
            <Label htmlFor="isQuestionSet" className="cursor-pointer">
              Enable as Question Set (can be assigned during interviews)
            </Label>
          </div>

          {/* Candidate Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assign to Candidates (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              {candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">No candidates available</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {candidates.map((candidate) => (
                    <div key={candidate.clerkId} className="flex items-center gap-2">
                      <Checkbox
                        id={`candidate-${candidate.clerkId}`}
                        checked={formData.assignedCandidates.includes(candidate.clerkId)}
                        onCheckedChange={() => toggleCandidate(candidate.clerkId)}
                      />
                      <Label
                        htmlFor={`candidate-${candidate.clerkId}`}
                        className="cursor-pointer"
                      >
                        {candidate.name} ({candidate.email})
                      </Label>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                If no candidates are selected, the test will be available to all candidates.
              </p>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Questions</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.questions.map((question, qIndex) => (
                <div key={qIndex} className="space-y-4 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Question {qIndex + 1}</Label>
                    {formData.questions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(qIndex)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      placeholder="Enter your question..."
                      rows={2}
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(qIndex, "question", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Options *</Label>
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIndex}`}
                          checked={question.correctAnswer === oIndex}
                          onChange={() =>
                            updateQuestion(qIndex, "correctAnswer", oIndex)
                          }
                          className="rounded"
                        />
                        <Input
                          placeholder={`Option ${oIndex + 1}`}
                          value={option}
                          onChange={(e) =>
                            updateOption(qIndex, oIndex, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) =>
                        updateQuestion(
                          qIndex,
                          "points",
                          parseInt(e.target.value) || 1
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  {testId ? "Updating..." : "Creating..."}
                </>
              ) : (
                testId ? "Update Test" : "Create Test"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AptitudeTestDialog;
