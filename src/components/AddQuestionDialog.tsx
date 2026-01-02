"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Loader2Icon, PlusIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
}

function AddQuestionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useUser();
  const createQuestion = useMutation(api.questions.createQuestion);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "medium" as "easy" | "medium" | "hard",
    leetcodeUrl: "",
    examples: [{ input: "", output: "", explanation: "" }] as Example[],
    starterCode: {
      javascript: `function solution() {\n  // Write your solution here\n  \n}`,
      python: `def solution():\n    # Write your solution here\n    pass`,
      java: `class Solution {\n    public void solution() {\n        // Write your solution here\n        \n    }\n}`,
    } as StarterCode,
    constraints: [""],
    testCases: [{ input: "", expectedOutput: "", isHidden: false }] as TestCase[],
  });

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
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (formData.examples.some((ex) => !ex.input.trim() || !ex.output.trim())) {
      toast.error("Please fill in all example inputs and outputs");
      return;
    }
    if (formData.testCases.some((tc) => !tc.input.trim() || !tc.expectedOutput.trim())) {
      toast.error("Please fill in all test case inputs and expected outputs");
      return;
    }

    setIsCreating(true);

    try {
      await createQuestion({
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        leetcodeUrl: formData.leetcodeUrl.trim() || undefined,
        examples: formData.examples.map((ex) => ({
          input: ex.input.trim(),
          output: ex.output.trim(),
          explanation: ex.explanation?.trim() || undefined,
        })),
        starterCode: {
          javascript: formData.starterCode.javascript,
          python: formData.starterCode.python,
          java: formData.starterCode.java,
        },
        constraints: formData.constraints.filter((c) => c.trim() !== ""),
        testCases: formData.testCases.map((tc) => ({
          input: tc.input.trim(),
          expectedOutput: tc.expectedOutput.trim(),
          isHidden: tc.isHidden || false,
        })),
      });

      toast.success("Question added successfully!");
      onOpenChange(false);
      
      // Reset form
      setFormData({
        title: "",
        description: "",
        difficulty: "medium",
        leetcodeUrl: "",
        examples: [{ input: "", output: "", explanation: "" }],
        starterCode: {
          javascript: `function solution() {\n  // Write your solution here\n  \n}`,
          python: `def solution():\n    # Write your solution here\n    pass`,
          java: `class Solution {\n    public void solution() {\n        // Write your solution here\n        \n    }\n}`,
        },
        constraints: [""],
        testCases: [{ input: "", expectedOutput: "", isHidden: false }],
      });
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
          <DialogTitle>Add LeetCode Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          {/* Difficulty and LeetCode URL */}
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="leetcodeUrl">LeetCode URL (Optional)</Label>
              <Input
                id="leetcodeUrl"
                placeholder="https://leetcode.com/problems/..."
                value={formData.leetcodeUrl}
                onChange={(e) =>
                  setFormData({ ...formData, leetcodeUrl: e.target.value })
                }
              />
            </div>
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

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isCreating}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddQuestionDialog;

