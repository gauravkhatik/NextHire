import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || !url.includes("leetcode.com")) {
      return NextResponse.json(
        { error: "Invalid LeetCode URL" },
        { status: 400 }
      );
    }

    // Extract problem slug from URL
    // Example: https://leetcode.com/problems/two-sum/ -> two-sum
    const match = url.match(/leetcode\.com\/problems\/([^\/]+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Could not extract problem slug from URL" },
        { status: 400 }
      );
    }

    const problemSlug = match[1];

    // Use LeetCode's GraphQL API to fetch problem details
    // Note: This is a simplified version. In production, you might need to use
    // a scraping service or LeetCode's official API if available
    try {
      const graphqlResponse = await fetch("https://leetcode.com/graphql/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query questionContent($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                title
                content
                difficulty
                codeSnippets {
                  lang
                  langSlug
                  code
                }
                exampleTestcases
                sampleTestCase
                metaData
              }
            }
          `,
          variables: {
            titleSlug: problemSlug,
          },
        }),
      });

      if (!graphqlResponse.ok) {
        throw new Error("Failed to fetch from LeetCode API");
      }

      const data = await graphqlResponse.json();

      if (data.errors || !data.data?.question) {
        return NextResponse.json(
          { error: "Question not found or could not be fetched" },
          { status: 404 }
        );
      }

      const question = data.data.question;

      // Parse code snippets
      const starterCode: any = {
        javascript: "",
        python: "",
        java: "",
      };

      question.codeSnippets?.forEach((snippet: any) => {
        if (snippet.langSlug === "javascript") {
          starterCode.javascript = snippet.code;
        } else if (snippet.langSlug === "python") {
          starterCode.python = snippet.code;
        } else if (snippet.langSlug === "java") {
          starterCode.java = snippet.code;
        }
      });

      // Parse examples from content
      const examples: Array<{ input: string; output: string; explanation?: string }> = [];
      
      // Try to extract examples from the content HTML
      const contentMatch = question.content?.match(/<strong>Example \d+:<\/strong>/g);
      if (contentMatch) {
        // Simple extraction - in production, use a proper HTML parser
        const exampleText = question.content;
        // This is a simplified parser - you may need to improve it
        examples.push({
          input: question.sampleTestCase || "",
          output: "",
          explanation: "",
        });
      }

      // Parse metadata for constraints
      let constraints: string[] = [];
      try {
        const metadata = JSON.parse(question.metaData || "{}");
        if (metadata.constraints) {
          constraints = metadata.constraints;
        }
      } catch {
        // Ignore metadata parsing errors
      }

      return NextResponse.json({
        title: question.title,
        description: question.content || "",
        difficulty: question.difficulty?.toLowerCase() || "medium",
        leetcodeUrl: url,
        examples: examples.length > 0 ? examples : [
          {
            input: question.sampleTestCase || "",
            output: "",
            explanation: "",
          },
        ],
        starterCode,
        constraints: constraints.length > 0 ? constraints : [],
        testCases: question.exampleTestcases
          ? question.exampleTestcases.split("\n").map((tc: string) => ({
              input: tc,
              expectedOutput: "",
              isHidden: false,
            }))
          : [],
      });
    } catch (error: any) {
      console.error("LeetCode API error:", error);
      return NextResponse.json(
        {
          error: "Failed to fetch question from LeetCode",
          message: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process LeetCode URL" },
      { status: 500 }
    );
  }
}

