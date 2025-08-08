import OpenAI from "openai";
import fs from "fs/promises";
import path from "path";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CodeReview {
  file: string;
  issues: {
    severity: "critical" | "high" | "medium" | "low";
    type: "bug" | "performance" | "security" | "maintainability" | "style";
    line?: number;
    description: string;
    suggestion: string;
    confidence: number;
  }[];
  overallScore: number;
  recommendations: string[];
}

export interface TestSuggestion {
  file: string;
  testType: "unit" | "integration" | "e2e";
  testCases: {
    description: string;
    priority: "high" | "medium" | "low";
    code: string;
    rationale: string;
  }[];
}

export interface OptimizationSuggestion {
  file: string;
  optimizations: {
    type: "performance" | "memory" | "bundle_size" | "database" | "network";
    description: string;
    implementation: string;
    impact: "high" | "medium" | "low";
    effort: "low" | "medium" | "high";
  }[];
}

class DevAssistant {
  /**
   * Perform comprehensive code review using GPT-5
   */
  async reviewCode(filePath: string, codeContent?: string): Promise<CodeReview> {
    try {
      const code = codeContent || await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath);
      
      const prompt = `You are an expert software engineer performing a comprehensive code review. Analyze this ${fileExtension} file for bugs, security issues, performance problems, and maintainability concerns.

FILE: ${filePath}
CODE:
\`\`\`${fileExtension.slice(1)}
${code}
\`\`\`

Please analyze for:
1. Potential bugs and logic errors
2. Security vulnerabilities 
3. Performance bottlenecks
4. Code maintainability issues
5. TypeScript/JavaScript best practices
6. React/Node.js specific issues
7. Database query optimization
8. Memory leaks or resource management

Respond in JSON format with detailed findings:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert code reviewer. Analyze code thoroughly and provide actionable feedback. Rate issues by severity and confidence. Provide specific line numbers when possible. Response must be valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        file: filePath,
        issues: result.issues || [],
        overallScore: result.overallScore || 85,
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error("Code review error:", error);
      throw new Error(`Failed to review code: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate intelligent test suggestions
   */
  async suggestTests(filePath: string, codeContent?: string): Promise<TestSuggestion> {
    try {
      const code = codeContent || await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath);

      const prompt = `You are an expert test engineer. Analyze this ${fileExtension} file and suggest comprehensive test cases.

FILE: ${filePath}
CODE:
\`\`\`${fileExtension.slice(1)}
${code}
\`\`\`

Generate test suggestions covering:
1. Unit tests for individual functions/methods
2. Integration tests for component interactions  
3. Edge cases and error handling
4. Security test cases
5. Performance test scenarios
6. User interaction tests (for React components)
7. Database operation tests
8. API endpoint tests

Provide actual test code using Jest/React Testing Library format. Response must be valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert test engineer. Generate comprehensive, practical test cases with actual working code. Focus on edge cases and critical paths."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        file: filePath,
        testType: result.testType || "unit",
        testCases: result.testCases || []
      };

    } catch (error) {
      console.error("Test suggestion error:", error);
      throw new Error(`Failed to generate test suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Suggest performance and architectural optimizations
   */
  async suggestOptimizations(filePath: string, codeContent?: string): Promise<OptimizationSuggestion> {
    try {
      const code = codeContent || await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath);

      const prompt = `You are a senior architect and performance expert. Analyze this ${fileExtension} file for optimization opportunities.

FILE: ${filePath}
CODE:
\`\`\`${fileExtension.slice(1)}
${code}
\`\`\`

Identify optimizations for:
1. Runtime performance (algorithms, loops, calculations)
2. Memory usage (object creation, garbage collection)
3. Bundle size (imports, dependencies, code splitting)
4. Database queries (N+1 problems, indexing, caching)
5. Network requests (batching, caching, compression)
6. React performance (memo, useMemo, useCallback, virtual scrolling)
7. Server-side optimizations (caching strategies, database connections)
8. Code architecture improvements

Provide concrete implementation examples. Response must be valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a performance optimization expert. Provide specific, actionable optimizations with implementation details and impact assessment."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        file: filePath,
        optimizations: result.optimizations || []
      };

    } catch (error) {
      console.error("Optimization suggestion error:", error);
      throw new Error(`Failed to generate optimization suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze and fix specific bugs/errors
   */
  async debugError(errorMessage: string, stackTrace: string, context?: string): Promise<{
    analysis: string;
    rootCause: string;
    fixes: {
      description: string;
      code: string;
      priority: number;
    }[];
    preventionTips: string[];
  }> {
    try {
      const prompt = `You are a debugging expert. Analyze this error and provide solutions.

ERROR MESSAGE:
${errorMessage}

STACK TRACE:
${stackTrace}

${context ? `ADDITIONAL CONTEXT:\n${context}` : ''}

Please provide:
1. Detailed analysis of what went wrong
2. Root cause identification
3. Multiple potential fixes with code examples
4. Prevention strategies for similar issues

Response must be valid JSON with specific, actionable solutions.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a debugging expert specializing in JavaScript/TypeScript, React, and Node.js. Provide clear explanations and working code fixes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        analysis: result.analysis || "Unable to analyze error",
        rootCause: result.rootCause || "Root cause unclear",
        fixes: result.fixes || [],
        preventionTips: result.preventionTips || []
      };

    } catch (error) {
      console.error("Debug error analysis failed:", error);
      throw new Error(`Failed to analyze error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Review entire codebase architecture
   */
  async reviewArchitecture(projectPath: string = "."): Promise<{
    overallHealth: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: {
      priority: "critical" | "high" | "medium" | "low";
      category: "architecture" | "security" | "performance" | "maintainability";
      description: string;
      implementation: string;
    }[];
  }> {
    try {
      // Analyze key files
      const keyFiles = [
        "package.json",
        "client/src/App.tsx", 
        "server/index.ts",
        "shared/schema.ts",
        "server/routes.ts"
      ];

      let codebaseSnapshot = "";
      for (const file of keyFiles) {
        try {
          const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
          codebaseSnapshot += `\n\n=== ${file} ===\n${content}`;
        } catch (e) {
          // File doesn't exist, continue
        }
      }

      const prompt = `You are a senior software architect reviewing this fitness application codebase. Analyze the overall architecture, patterns, and structure.

CODEBASE SNAPSHOT:
${codebaseSnapshot}

Evaluate:
1. Overall architecture quality and patterns
2. Code organization and structure  
3. Security implementation
4. Scalability considerations
5. Technology choices and integration
6. Data flow and state management
7. Error handling strategies
8. Performance considerations
9. Testing strategy
10. Development workflow efficiency

Provide an overall health score (0-100) and actionable recommendations. Response must be valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior software architect with expertise in full-stack applications, fitness/gaming apps, and modern web technologies. Provide strategic, actionable recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        overallHealth: result.overallHealth || 75,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        recommendations: result.recommendations || []
      };

    } catch (error) {
      console.error("Architecture review error:", error);
      throw new Error(`Failed to review architecture: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate automated refactoring suggestions
   */
  async suggestRefactoring(filePath: string, codeContent?: string): Promise<{
    refactorings: {
      type: "extract_function" | "eliminate_duplication" | "simplify_conditionals" | "improve_naming" | "optimize_imports";
      description: string;
      before: string;
      after: string;
      benefits: string[];
      risk: "low" | "medium" | "high";
    }[];
  }> {
    try {
      const code = codeContent || await fs.readFile(filePath, 'utf-8');
      const fileExtension = path.extname(filePath);

      const prompt = `You are a refactoring expert. Analyze this ${fileExtension} file and suggest refactoring opportunities.

FILE: ${filePath}
CODE:
\`\`\`${fileExtension.slice(1)}
${code}
\`\`\`

Identify refactoring opportunities:
1. Functions/methods that are too long or complex
2. Code duplication that can be eliminated
3. Complex conditional logic that can be simplified
4. Poor variable/function naming
5. Inefficient imports or dependencies
6. Opportunities to use better patterns/abstractions
7. Code that violates SOLID principles

Provide before/after code examples. Response must be valid JSON.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a refactoring expert. Suggest safe, incremental improvements with clear before/after examples and risk assessment."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return {
        refactorings: result.refactorings || []
      };

    } catch (error) {
      console.error("Refactoring suggestion error:", error);
      throw new Error(`Failed to suggest refactoring: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const devAssistant = new DevAssistant();