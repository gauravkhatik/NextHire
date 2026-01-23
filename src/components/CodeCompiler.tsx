"use client";

import { useState, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { PlayIcon, Loader2Icon, CheckCircleIcon, XCircleIcon, FileTextIcon } from "lucide-react";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";
import { Doc } from "../../convex/_generated/dataModel";

type Question = Doc<"questions">;

const LANGUAGES = [
  { id: "javascript", name: "JavaScript" },
  { id: "python", name: "Python" },
  { id: "java", name: "Java" },
  { id: "cpp", name: "C++" },
  { id: "sql", name: "SQL" },
];

function CodeCompiler({ questions = [] }: { questions?: Question[] }) {
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    questions.length > 0 ? questions[0] : null
  );
  const [language, setLanguage] = useState<string>("javascript");
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<"success" | "error" | null>(null);

  // Update selected question when questions list changes
  useEffect(() => {
    if (questions.length > 0) {
      // If no question is selected or selected question is not in the list, select the first one
      if (!selectedQuestion || !questions.find((q) => q._id === selectedQuestion._id)) {
        setSelectedQuestion(questions[0]);
      }
    } else {
      setSelectedQuestion(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions]);

  // Update code when question or language changes
  useEffect(() => {
    if (selectedQuestion) {
      const starterCode = selectedQuestion.starterCode;
      const codeForLanguage = 
        language === "javascript" ? starterCode.javascript :
        language === "python" ? starterCode.python :
        language === "java" ? starterCode.java :
        language === "cpp" ? (starterCode.cpp || "") :
        language === "sql" ? (starterCode.sql || "") : "";
      setCode(codeForLanguage || (language === "sql" ? `-- Write your ${language} code here` : `// Write your ${language} code here`));
    } else {
      setCode(language === "sql" ? `-- Write your ${language} code here` : `// Write your ${language} code here`);
    }
  }, [selectedQuestion, language]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setOutput("");
    setExecutionStatus(null);
  };

  const executeCode = async () => {
    if (!code.trim()) {
      toast.error("Please write some code first");
      return;
    }

    setIsExecuting(true);
    setOutput("");
    setExecutionStatus(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, language }),
      });

      const data = await response.json();

      if (data.error) {
        setOutput(data.error);
        setExecutionStatus("error");
        toast.error("Execution failed");
      } else {
        setOutput(data.output || "No output");
        setExecutionStatus(data.success ? "success" : "error");
        if (data.success) {
          toast.success("Code executed successfully");
        } else {
          toast.error("Code execution completed with errors");
        }
      }
    } catch (error: any) {
      setOutput(`Error: ${error.message || "Failed to execute code"}`);
      setExecutionStatus("error");
      toast.error("Failed to execute code");
    } finally {
      setIsExecuting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500";
      case "hard":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-muted";
    }
  };

  // Show message when no questions are available
  if (questions.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <FileTextIcon className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-semibold">No Questions Assigned</p>
          <p className="text-sm text-muted-foreground">
            The interviewer will add questions during the interview
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* QUESTIONS SIDEBAR */}
      {questions.length > 0 && (
        <>
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileTextIcon className="h-5 w-5" />
                  Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {questions.map((question) => (
                      <Card
                        key={question._id}
                        className={`cursor-pointer transition-colors ${
                          selectedQuestion?._id === question._id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => setSelectedQuestion(question)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-sm">{question.title}</h3>
                            <Badge
                              className={getDifficultyColor(question.difficulty)}
                            >
                              {question.difficulty}
                            </Badge>
                          </div>
                          {question.leetcodeUrl && (
                            <a
                              href={question.leetcodeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View on LeetCode →
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* CODE EDITOR AND QUESTION VIEW */}
      <ResizablePanel defaultSize={questions.length > 0 ? 70 : 100}>
        <ResizablePanelGroup direction="vertical" className="h-full">
          {/* QUESTION DESCRIPTION */}
          {selectedQuestion && (
            <>
              <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{selectedQuestion.title}</CardTitle>
                      <Badge className={getDifficultyColor(selectedQuestion.difficulty)}>
                        {selectedQuestion.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                      <div className="space-y-4">
                        {/* Description */}
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: selectedQuestion.description }}
                        />

                        {/* Examples */}
                        {selectedQuestion.examples.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Examples:</h4>
                            {selectedQuestion.examples.map((example, idx) => (
                              <div key={idx} className="mb-4 p-3 bg-muted rounded-lg">
                                <div className="mb-2">
                                  <strong>Input:</strong>
                                  <pre className="mt-1 text-xs bg-background p-2 rounded">
                                    {example.input}
                                  </pre>
                                </div>
                                <div className="mb-2">
                                  <strong>Output:</strong>
                                  <pre className="mt-1 text-xs bg-background p-2 rounded">
                                    {example.output}
                                  </pre>
                                </div>
                                {example.explanation && (
                                  <div>
                                    <strong>Explanation:</strong>
                                    <p className="mt-1 text-sm">{example.explanation}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Constraints */}
                        {selectedQuestion.constraints && selectedQuestion.constraints.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Constraints:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {selectedQuestion.constraints.map((constraint, idx) => (
                                <li key={idx}>{constraint}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* CODE EDITOR SECTION */}
          <ResizablePanel defaultSize={selectedQuestion ? 60 : 100} minSize={30}>
            <div className="h-full flex flex-col">
              {/* TOOLBAR */}
              <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                <div className="flex items-center gap-4">
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue>
                        {LANGUAGES.find((l) => l.id === language)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.id} value={lang.id}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={executeCode}
                  disabled={isExecuting}
                  className="gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4" />
                      Run Code
                    </>
                  )}
                </Button>
              </div>

              {/* MONACO EDITOR */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  defaultLanguage={language}
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    wordWrap: "on",
                    wrappingIndent: "indent",
                  }}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* OUTPUT SECTION */}
          <ResizablePanel defaultSize={40} minSize={20}>
            <Card className="h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Output</CardTitle>
                {executionStatus === "success" && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
                {executionStatus === "error" && (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <pre
                    className={`p-4 rounded-lg font-mono text-sm whitespace-pre-wrap ${
                      executionStatus === "error"
                        ? "bg-red-500/10 text-red-500"
                        : executionStatus === "success"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-muted"
                    }`}
                  >
                    {output || "Output will appear here after running your code..."}
                  </pre>
                  <ScrollBar />
                </ScrollArea>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default CodeCompiler;
