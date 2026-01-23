import { NextRequest, NextResponse } from "next/server";

// Piston API Language IDs (free, no API key required)
const PISTON_LANGUAGES: { [key: string]: string } = {
  javascript: "node",
  python: "python3",
  java: "java",
  cpp: "cpp",
};

// Piston API configuration (free tier, no API key needed)
const PISTON_API_URL = process.env.PISTON_API_URL || "https://emkc.org/api/v2/piston";

async function executeWithPiston(code: string, language: string) {
  try {
    const pistonLanguage = PISTON_LANGUAGES[language];
    if (!pistonLanguage) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Execute code using Piston API (free, no API key required)
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: pistonLanguage,
        version: "*", // Use latest version
        files: [
          {
            content: code,
          },
        ],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Piston API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (result.run) {
      const output = result.run.stdout || "";
      const error = result.run.stderr || result.compile?.stderr || null;
      const success = !error && result.run.code === 0;

      return {
        output: output || (error ? "" : "Code executed successfully"),
        error: error,
        success: success,
      };
    } else {
      return {
        output: "",
        error: result.message || "Execution failed",
        success: false,
      };
    }
  } catch (error: any) {
    throw new Error(`Piston execution failed: ${error.message}`);
  }
}

async function executeJavaScript(code: string) {
  try {
    // For JavaScript, we can use Node.js execution via Judge0 or local execution
    // Using local execution for faster response (only for JavaScript)
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args: any[]) => {
      logs.push(args.map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      }).join(" "));
    };
    
    console.error = (...args: any[]) => {
      logs.push("ERROR: " + args.map((arg) => String(arg)).join(" "));
    };

    const func = new Function(code);
    const result = func();
    
    console.log = originalLog;
    console.error = originalError;

    const output = logs.length > 0 
      ? logs.join("\n") 
      : (result !== undefined ? String(result) : "");

    return {
      output,
      error: null,
      success: true,
    };
  } catch (e: any) {
    return {
      output: "",
      error: e.message || String(e),
      success: false,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json();

    if (!code || !language) {
      return NextResponse.json(
        { error: "Code and language are required" },
        { status: 400 }
      );
    }

    // Check if language is supported
    if (!PISTON_LANGUAGES[language] && language !== "javascript") {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    let result;

    if (language === "javascript") {
      // Use local execution for JavaScript (faster)
      result = await executeJavaScript(code);
    } else {
      // Use Piston API for all other languages (Python, Java, C++)
      result = await executeWithPiston(code, language);
    }

    return NextResponse.json({
      output: result.output,
      error: result.error,
      success: result.success,
    });
  } catch (error: any) {
    console.error("Code execution error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to execute code",
        output: "",
        success: false,
      },
      { status: 500 }
    );
  }
}

