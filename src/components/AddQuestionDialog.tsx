"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2Icon, PlusIcon, XIcon, LinkIcon, FileTextIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface StarterCode {
  javascript: string;
  python: string;
  java: string;
  cpp?: string;
}

function AddQuestionDialog({ open, onOpenChange, interviewId }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  interviewId?: string;
}) {
  const { user } = useUser();
  const createQuestion = useMutation(api.questions.createQuestion);
  const assignQuestionToInterview = useMutation(api.interviews.assignQuestionToInterview);
  const [isCreating, setIsCreating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<"leetcode" | "custom">("leetcode");

  // LeetCode form state
  const [leetcodeUrl, setLeetcodeUrl] = useState("");

  // Debug: Log when dialog opens/closes
  useEffect(() => {
    console.log("AddQuestionDialog - open:", open, "interviewId:", interviewId);
  }, [open, interviewId]);

  // Reset form when dialog closes or opens
  useEffect(() => {
    if (!open) {
      // Reset all form data when dialog closes
      setLeetcodeUrl("");
      setActiveTab("leetcode");
      setFormData({
        title: "",
        description: "",
        difficulty: "medium",
        examples: [{ input: "", output: "", explanation: "" }],
        starterCode: {
          javascript: `function solution() {\n  // Write your solution here\n  \n}`,
          python: `def solution():\n    # Write your solution here\n    pass`,
          java: `class Solution {\n    public void solution() {\n        // Write your solution here\n        \n    }\n}`,
          cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
        },
        constraints: [""],
        testCases: [{ input: "", expectedOutput: "", isHidden: false }],
      });
      setIsCreating(false);
      setIsFetching(false);
    }
  }, [open]);

  // Custom form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    examples: [{ input: "", output: "", explanation: "" }] as Example[],
    starterCode: {
      javascript: `function solution() {\n  // Write your solution here\n  \n}`,
      python: `def solution():\n    # Write your solution here\n    pass`,
      java: `class Solution {\n    public void solution() {\n        // Write your solution here\n        \n    }\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    } as StarterCode,
    constraints: [""],
    testCases: [{ input: "", expectedOutput: "", isHidden: false }] as TestCase[],
  });

  const fetchLeetCodeQuestion = async () => {
    if (!leetcodeUrl.trim() || !leetcodeUrl.includes("leetcode.com")) {
      toast.error("Please enter a valid LeetCode URL");
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch("/api/leetcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: leetcodeUrl }),
      });

      const data = await response.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Populate form with fetched data
      setFormData({
        title: data.title || "",
        description: data.description || "",
        difficulty: data.difficulty || "medium",
        examples: data.examples || [{ input: "", output: "", explanation: "" }],
        starterCode: {
          javascript: data.starterCode?.javascript || formData.starterCode.javascript,
          python: data.starterCode?.python || formData.starterCode.python,
          java: data.starterCode?.java || formData.starterCode.java,
          cpp: data.starterCode?.cpp || formData.starterCode.cpp,
        },
        constraints: data.constraints || [""],
        testCases: data.testCases || [{ input: "", expectedOutput: "", isHidden: false }],
      });

      toast.success("Question fetched successfully!");
    } catch (error) {
      console.error("Error fetching LeetCode question:", error);
      toast.error("Failed to fetch question from LeetCode");
    } finally {
      setIsFetching(false);
    }
  };

  const addExample = () => {
    setFormData((prev) => ({
      ...prev,
      examples: [...prev.examples, { input: "", output: "", explanation: "" }],
    }));
  };

  const removeExample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  const updateExample = (index: number, field: keyof Example, value: string) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.map((ex, i) =>
        i === index ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const addTestCase = () => {
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", isHidden: false }],
    }));
  };

  const removeTestCase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      ),
    }));
  };

  const addConstraint = () => {
    setFormData((prev) => ({
      ...prev,
      constraints: [...prev.constraints, ""],
    }));
  };

  const removeConstraint = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== index),
    }));
  };

  const updateConstraint = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      constraints: prev.constraints.map((c, i) => (i === index ? value : c)),
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    
    // Check if interviewId is available
    if (!interviewId) {
      toast.error("Interview not found. Please wait for the interview to load.");
      return;
    }
    
    // For LeetCode tab, examples and test cases might be empty initially
    // For Custom tab, we need at least one test case
    if (activeTab === "custom") {
      const validTestCases = formData.testCases.filter((tc) => tc.input.trim() && tc.expectedOutput.trim());
      if (validTestCases.length === 0) {
        toast.error("Please add at least one test case with input and expected output");
        return;
      }
    } else {
      // For LeetCode, at least one test case should exist (even if empty, we'll filter it)
      const validTestCases = formData.testCases.filter((tc) => tc.input.trim() && tc.expectedOutput.trim());
      if (validTestCases.length === 0) {
        toast.error("Please ensure at least one test case is available");
        return;
      }
    }

    setIsCreating(true);

    try {
      const questionId = await createQuestion({
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        leetcodeUrl: activeTab === "leetcode" ? leetcodeUrl.trim() : undefined,
        source: activeTab === "leetcode" ? "leetcode" : "custom",
        examples: formData.examples
          .filter((ex) => ex.input.trim() && ex.output.trim())
          .map((ex) => ({
            input: ex.input.trim(),
            output: ex.output.trim(),
            explanation: ex.explanation?.trim() || undefined,
          })),
        starterCode: {
          javascript: formData.starterCode.javascript,
          python: formData.starterCode.python,
          java: formData.starterCode.java,
          cpp: formData.starterCode.cpp,
        },
        constraints: formData.constraints.filter((c) => c.trim() !== ""),
        testCases: formData.testCases
          .filter((tc) => tc.input.trim() && tc.expectedOutput.trim())
          .map((tc) => ({
            input: tc.input.trim(),
            expectedOutput: tc.expectedOutput.trim(),
            isHidden: tc.isHidden || false,
          })),
      });

      // If interviewId is provided, assign question to interview
      if (interviewId) {
        try {
          await assignQuestionToInterview({
            interviewId: interviewId as any,
            questionId,
          });
        } catch (assignError) {
          console.error("Error assigning question to interview:", assignError);
          // Don't fail the whole operation if assignment fails
          toast.error("Question created but failed to assign to interview. Please try assigning manually.");
        }
      }

      toast.success("Question added successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to add question"
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "leetcode" | "custom")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leetcode">
              <LinkIcon className="h-4 w-4 mr-2" />
              LeetCode Link
            </TabsTrigger>
            <TabsTrigger value="custom">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Custom Question
            </TabsTrigger>
          </TabsList>

          {/* LeetCode Tab */}
          <TabsContent value="leetcode" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fetch from LeetCode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leetcodeUrl">LeetCode Problem URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="leetcodeUrl"
                      placeholder="https://leetcode.com/problems/two-sum/"
                      value={leetcodeUrl}
                      onChange={(e) => setLeetcodeUrl(e.target.value)}
                    />
                    <Button
                      onClick={fetchLeetCodeQuestion}
                      disabled={isFetching || !leetcodeUrl.trim()}
                    >
                      {isFetching ? (
                        <>
                          <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        "Fetch"
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter a LeetCode problem URL to automatically fetch the question details, test cases, and starter code.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Show form after fetching */}
            {formData.title && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                    ✓ Question fetched successfully! Review the details below and click "Add Question" to save.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={formData.title} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={formData.description} rows={6} disabled className="resize-none" />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Input value={formData.difficulty} disabled />
                </div>
                {formData.examples.length > 0 && formData.examples.some(ex => ex.input || ex.output) && (
                  <div className="space-y-2">
                    <Label>Examples</Label>
                    <div className="space-y-2">
                      {formData.examples.filter(ex => ex.input || ex.output).map((ex, idx) => (
                        <div key={idx} className="p-2 bg-muted rounded text-sm">
                          <div><strong>Input:</strong> {ex.input || "N/A"}</div>
                          <div><strong>Output:</strong> {ex.output || "N/A"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {formData.testCases.length > 0 && (
                  <div className="space-y-2">
                    <Label>Test Cases ({formData.testCases.length})</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.testCases.length} test case(s) fetched from LeetCode
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Custom Question Tab */}
          <TabsContent value="custom" className="space-y-6 mt-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Two Sum"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Problem description..."
                rows={6}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: "easy" | "medium" | "hard") =>
                  setFormData({ ...formData, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Examples */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Examples</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addExample}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Example
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.examples.map((example, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Example {index + 1}</Label>
                      {formData.examples.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExample(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label>Input</Label>
                        <Input
                          placeholder="nums = [2,7,11,15], target = 9"
                          value={example.input}
                          onChange={(e) =>
                            updateExample(index, "input", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Output</Label>
                        <Input
                          placeholder="[0,1]"
                          value={example.output}
                          onChange={(e) =>
                            updateExample(index, "output", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                          placeholder="Because nums[0] + nums[1] == 9..."
                          rows={2}
                          value={example.explanation || ""}
                          onChange={(e) =>
                            updateExample(index, "explanation", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Starter Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Starter Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>JavaScript</Label>
                  <Textarea
                    rows={6}
                    value={formData.starterCode.javascript}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        starterCode: {
                          ...formData.starterCode,
                          javascript: e.target.value,
                        },
                      })
                    }
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Python</Label>
                  <Textarea
                    rows={6}
                    value={formData.starterCode.python}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        starterCode: {
                          ...formData.starterCode,
                          python: e.target.value,
                        },
                      })
                    }
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Java</Label>
                  <Textarea
                    rows={6}
                    value={formData.starterCode.java}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        starterCode: {
                          ...formData.starterCode,
                          java: e.target.value,
                        },
                      })
                    }
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>C++</Label>
                  <Textarea
                    rows={6}
                    value={formData.starterCode.cpp || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        starterCode: {
                          ...formData.starterCode,
                          cpp: e.target.value,
                        },
                      })
                    }
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Constraints */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Constraints (Optional)</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addConstraint}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Constraint
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {formData.constraints.map((constraint, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="2 ≤ nums.length ≤ 104"
                      value={constraint}
                      onChange={(e) => updateConstraint(index, e.target.value)}
                    />
                    {formData.constraints.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConstraint(index)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Test Cases */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Test Cases *</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTestCase}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Test Case
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.testCases.map((testCase, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Test Case {index + 1}</Label>
                      {formData.testCases.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestCase(index)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <Label>Input</Label>
                        <Input
                          placeholder='{"nums": [2,7,11,15], "target": 9}'
                          value={testCase.input}
                          onChange={(e) =>
                            updateTestCase(index, "input", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Expected Output</Label>
                        <Input
                          placeholder='[0,1]'
                          value={testCase.expectedOutput}
                          onChange={(e) =>
                            updateTestCase(index, "expectedOutput", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`hidden-${index}`}
                          checked={testCase.isHidden || false}
                          onChange={(e) =>
                            updateTestCase(index, "isHidden", e.target.checked)
                          }
                          className="rounded"
                        />
                        <Label htmlFor={`hidden-${index}`} className="cursor-pointer">
                          Hidden test case
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating || !formData.title.trim()}>
            {isCreating ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Question"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddQuestionDialog;
