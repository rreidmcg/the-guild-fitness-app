import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Code, 
  TestTube, 
  Zap, 
  Bug, 
  Building, 
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from "lucide-react";
import { ParallaxBackground } from "@/components/ui/parallax-background";
import { CurrencyHeader } from "@/components/ui/currency-header";

interface CodeReviewResult {
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

interface TestSuggestion {
  file: string;
  testType: "unit" | "integration" | "e2e";
  testCases: {
    description: string;
    priority: "high" | "medium" | "low";
    code: string;
    rationale: string;
  }[];
}

interface OptimizationSuggestion {
  file: string;
  optimizations: {
    type: "performance" | "memory" | "bundle_size" | "database" | "network";
    description: string;
    implementation: string;
    impact: "high" | "medium" | "low";
    effort: "low" | "medium" | "high";
  }[];
}

interface DebugAnalysis {
  analysis: string;
  rootCause: string;
  fixes: {
    description: string;
    code: string;
    priority: number;
  }[];
  preventionTips: string[];
}

interface ArchitectureReview {
  overallHealth: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: {
    priority: "critical" | "high" | "medium" | "low";
    category: "architecture" | "security" | "performance" | "maintainability";
    description: string;
    implementation: string;
  }[];
}

export default function DevToolsPage() {
  const { toast } = useToast();
  const [filePath, setFilePath] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [context, setContext] = useState("");

  // Results state
  const [codeReviewResult, setCodeReviewResult] = useState<CodeReviewResult | null>(null);
  const [testSuggestions, setTestSuggestions] = useState<TestSuggestion | null>(null);
  const [optimizations, setOptimizations] = useState<OptimizationSuggestion | null>(null);
  const [debugAnalysis, setDebugAnalysis] = useState<DebugAnalysis | null>(null);
  const [architectureReview, setArchitectureReview] = useState<ArchitectureReview | null>(null);

  const codeReviewMutation = useMutation({
    mutationFn: async ({ filePath, code }: { filePath: string; code?: string }) => 
      apiRequest("/api/dev/review-code", { method: "POST", body: { filePath, code } }),
    onSuccess: (data) => {
      setCodeReviewResult(data);
      toast({ title: "Code Review Complete", description: "AI analysis completed successfully." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Code Review Failed", 
        description: error.message || "Failed to analyze code",
        variant: "destructive" 
      });
    }
  });

  const testSuggestionMutation = useMutation({
    mutationFn: async ({ filePath, code }: { filePath: string; code?: string }) => 
      apiRequest("/api/dev/suggest-tests", { method: "POST", body: { filePath, code } }),
    onSuccess: (data) => {
      setTestSuggestions(data);
      toast({ title: "Test Suggestions Generated", description: "AI test recommendations ready." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Test Generation Failed", 
        description: error.message || "Failed to generate tests",
        variant: "destructive" 
      });
    }
  });

  const optimizationMutation = useMutation({
    mutationFn: async ({ filePath, code }: { filePath: string; code?: string }) => 
      apiRequest("/api/dev/suggest-optimizations", { method: "POST", body: { filePath, code } }),
    onSuccess: (data) => {
      setOptimizations(data);
      toast({ title: "Optimizations Found", description: "Performance improvements suggested." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Optimization Analysis Failed", 
        description: error.message || "Failed to analyze optimizations",
        variant: "destructive" 
      });
    }
  });

  const debugMutation = useMutation({
    mutationFn: async ({ errorMessage, stackTrace, context }: { errorMessage: string; stackTrace?: string; context?: string }) => 
      apiRequest("/api/dev/debug-error", { method: "POST", body: { errorMessage, stackTrace, context } }),
    onSuccess: (data) => {
      setDebugAnalysis(data);
      toast({ title: "Debug Analysis Complete", description: "Error analysis and fixes provided." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Debug Analysis Failed", 
        description: error.message || "Failed to analyze error",
        variant: "destructive" 
      });
    }
  });

  const architectureMutation = useMutation({
    mutationFn: async () => apiRequest("/api/dev/review-architecture", { method: "POST", body: {} }),
    onSuccess: (data) => {
      setArchitectureReview(data);
      toast({ title: "Architecture Review Complete", description: "Codebase analysis finished." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Architecture Review Failed", 
        description: error.message || "Failed to review architecture",
        variant: "destructive" 
      });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <ParallaxBackground>
      <CurrencyHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              🤖 AI Development Assistant
            </h1>
            <p className="text-muted-foreground">
              Powered by GPT-5 for intelligent code analysis, optimization, and debugging
            </p>
          </div>

          <Tabs defaultValue="code-review" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="code-review" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Review
              </TabsTrigger>
              <TabsTrigger value="tests" className="flex items-center gap-2">
                <TestTube className="w-4 h-4" />
                Tests
              </TabsTrigger>
              <TabsTrigger value="optimize" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Optimize
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Debug
              </TabsTrigger>
              <TabsTrigger value="architecture" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Architecture
              </TabsTrigger>
              <TabsTrigger value="refactor" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                Refactor
              </TabsTrigger>
            </TabsList>

            {/* Code Review Tab */}
            <TabsContent value="code-review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Code Review & Bug Detection
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis for bugs, security issues, and code quality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="filePath">File Path</Label>
                    <Input
                      id="filePath"
                      placeholder="e.g., client/src/pages/workout.tsx"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Code (optional - leave empty to analyze file)</Label>
                    <Textarea
                      id="code"
                      placeholder="Paste code here for direct analysis..."
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      rows={10}
                    />
                  </div>
                  <Button 
                    onClick={() => codeReviewMutation.mutate({ filePath, code: code || undefined })}
                    disabled={!filePath || codeReviewMutation.isPending}
                    className="w-full"
                  >
                    {codeReviewMutation.isPending ? "Analyzing..." : "Review Code"}
                  </Button>
                </CardContent>
              </Card>

              {codeReviewResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Review Results</span>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        Score: {codeReviewResult.overallScore}/100
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {codeReviewResult.issues.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Issues Found</h3>
                        <div className="space-y-3">
                          {codeReviewResult.issues.map((issue, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={`${getSeverityColor(issue.severity)} text-white`}>
                                  {issue.severity}
                                </Badge>
                                <Badge variant="outline">{issue.type}</Badge>
                                {issue.line && <Badge variant="secondary">Line {issue.line}</Badge>}
                                <Badge variant="outline">{Math.round(issue.confidence * 100)}% confidence</Badge>
                              </div>
                              <p className="font-medium mb-2">{issue.description}</p>
                              <p className="text-sm text-muted-foreground">{issue.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {codeReviewResult.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                        <ul className="space-y-2">
                          {codeReviewResult.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Debug Tab */}
            <TabsContent value="debug" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5" />
                    Error Analysis & Debugging
                  </CardTitle>
                  <CardDescription>
                    Get AI-powered analysis and fixes for runtime errors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="errorMessage">Error Message</Label>
                    <Input
                      id="errorMessage"
                      placeholder="e.g., TypeError: Cannot read property 'length' of undefined"
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stackTrace">Stack Trace (optional)</Label>
                    <Textarea
                      id="stackTrace"
                      placeholder="Paste stack trace here..."
                      value={stackTrace}
                      onChange={(e) => setStackTrace(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="context">Additional Context (optional)</Label>
                    <Textarea
                      id="context"
                      placeholder="Describe what you were doing when the error occurred..."
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button 
                    onClick={() => debugMutation.mutate({ errorMessage, stackTrace, context })}
                    disabled={!errorMessage || debugMutation.isPending}
                    className="w-full"
                  >
                    {debugMutation.isPending ? "Analyzing..." : "Debug Error"}
                  </Button>
                </CardContent>
              </Card>

              {debugAnalysis && (
                <Card>
                  <CardHeader>
                    <CardTitle>Debug Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Analysis</h3>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {debugAnalysis.analysis}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Root Cause</h3>
                      <p className="text-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded">
                        {debugAnalysis.rootCause}
                      </p>
                    </div>

                    {debugAnalysis.fixes.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Suggested Fixes</h3>
                        <div className="space-y-4">
                          {debugAnalysis.fixes
                            .sort((a, b) => b.priority - a.priority)
                            .map((fix, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-green-500 text-white">
                                  Priority {fix.priority}
                                </Badge>
                              </div>
                              <p className="font-medium mb-3">{fix.description}</p>
                              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                <code>{fix.code}</code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {debugAnalysis.preventionTips.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Prevention Tips</h3>
                        <ul className="space-y-2">
                          {debugAnalysis.preventionTips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Architecture Review Tab */}
            <TabsContent value="architecture" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Architecture Review
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis of your codebase architecture and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => architectureMutation.mutate()}
                    disabled={architectureMutation.isPending}
                    className="w-full"
                  >
                    {architectureMutation.isPending ? "Analyzing..." : "Review Architecture"}
                  </Button>
                </CardContent>
              </Card>

              {architectureReview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Architecture Analysis</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          Health: {architectureReview.overallHealth}/100
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-green-600">Strengths</h3>
                        <ul className="space-y-2">
                          {architectureReview.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-red-600">Areas for Improvement</h3>
                        <ul className="space-y-2">
                          {architectureReview.weaknesses.map((weakness, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {architectureReview.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                        <div className="space-y-4">
                          {architectureReview.recommendations
                            .sort((a, b) => {
                              const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                              return priorityOrder[b.priority] - priorityOrder[a.priority];
                            })
                            .map((rec, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge className={`${getPriorityColor(rec.priority)} text-white`}>
                                  {rec.priority}
                                </Badge>
                                <Badge variant="outline">{rec.category}</Badge>
                              </div>
                              <p className="font-medium mb-2">{rec.description}</p>
                              <p className="text-sm text-muted-foreground">{rec.implementation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Other tabs can be added here with similar structure */}
            <TabsContent value="tests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-muted-foreground">
                    🚧 Test Generation Coming Soon
                  </CardTitle>
                  <CardDescription className="text-center">
                    AI-powered test case generation and coverage analysis
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="optimize" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-muted-foreground">
                    🚧 Performance Optimization Coming Soon
                  </CardTitle>
                  <CardDescription className="text-center">
                    AI suggestions for performance improvements and optimizations
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="refactor" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-muted-foreground">
                    🚧 Refactoring Suggestions Coming Soon
                  </CardTitle>
                  <CardDescription className="text-center">
                    AI-powered code refactoring and architecture improvements
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ParallaxBackground>
  );
}