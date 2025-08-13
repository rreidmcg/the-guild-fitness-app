/**
 * Performance Monitoring Component for Day 3 Optimizations
 * 
 * Provides real-time performance insights and optimization suggestions
 * for the frontend application
 */

import { useState, useEffect, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Activity, 
  Clock, 
  Database, 
  Wifi, 
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp
} from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  bundleSize: number;
  renderTime: number;
  apiLatency: number;
  cacheHitRate: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  className?: string;
  showDetails?: boolean;
}

/**
 * Hook for collecting performance metrics
 */
function usePerformanceMetrics(): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    memoryUsage: 0,
    bundleSize: 0,
    renderTime: 0,
    apiLatency: 0,
    cacheHitRate: 0
  });

  useEffect(() => {
    const collectMetrics = () => {
      // Page load metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation ? navigation.loadEventEnd - navigation.fetchStart : 0;

      // Memory usage (if available)
      const memory = (performance as any).memory;
      const memoryUsage = memory ? 
        Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100) : 0;

      // Estimate bundle size from resource entries
      const resources = performance.getEntriesByType('resource');
      const bundleSize = resources
        .filter(r => r.name.includes('.js') || r.name.includes('.css'))
        .reduce((total, r) => total + (r.transferSize || 0), 0);

      // Calculate average API latency from recent requests
      const apiRequests = resources.filter(r => r.name.includes('/api/'));
      const avgApiLatency = apiRequests.length > 0 
        ? apiRequests.reduce((sum, r) => sum + r.duration, 0) / apiRequests.length
        : 0;

      // Mock cache hit rate (would be real in production)
      const cacheHitRate = Math.random() * 40 + 60; // 60-100%

      setMetrics({
        loadTime: Math.round(loadTime),
        memoryUsage: Math.round(memoryUsage),
        bundleSize: Math.round(bundleSize / 1024), // Convert to KB
        renderTime: Math.round(performance.now()), // Time since page started
        apiLatency: Math.round(avgApiLatency),
        cacheHitRate: Math.round(cacheHitRate)
      });
    };

    collectMetrics();
    const interval = setInterval(collectMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

/**
 * Performance issue detector
 */
function usePerformanceIssues(metrics: PerformanceMetrics) {
  return useMemo(() => {
    const issues: Array<{ type: 'warning' | 'error' | 'info', message: string }> = [];

    if (metrics.loadTime > 3000) {
      issues.push({ type: 'error', message: 'Page load time is very slow (>3s)' });
    } else if (metrics.loadTime > 1500) {
      issues.push({ type: 'warning', message: 'Page load time could be improved (>1.5s)' });
    }

    if (metrics.memoryUsage > 80) {
      issues.push({ type: 'error', message: 'High memory usage detected (>80%)' });
    } else if (metrics.memoryUsage > 60) {
      issues.push({ type: 'warning', message: 'Memory usage is getting high (>60%)' });
    }

    if (metrics.bundleSize > 1000) {
      issues.push({ type: 'warning', message: 'Large bundle size detected (>1MB)' });
    }

    if (metrics.apiLatency > 1000) {
      issues.push({ type: 'error', message: 'API responses are very slow (>1s)' });
    } else if (metrics.apiLatency > 500) {
      issues.push({ type: 'warning', message: 'API latency is elevated (>500ms)' });
    }

    if (metrics.cacheHitRate < 70) {
      issues.push({ type: 'warning', message: 'Low cache hit rate (<70%)' });
    }

    if (issues.length === 0) {
      issues.push({ type: 'info', message: 'Performance looks good!' });
    }

    return issues;
  }, [metrics]);
}

/**
 * Performance Monitor Component
 */
export const PerformanceMonitor = memo(({ 
  enabled = false, 
  className, 
  showDetails = false 
}: PerformanceMonitorProps) => {
  const metrics = usePerformanceMetrics();
  const issues = usePerformanceIssues(metrics);
  const [isExpanded, setIsExpanded] = useState(showDetails);

  if (!enabled) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getOverallScore = () => {
    let score = 100;
    if (metrics.loadTime > 3000) score -= 30;
    else if (metrics.loadTime > 1500) score -= 15;
    
    if (metrics.memoryUsage > 80) score -= 25;
    else if (metrics.memoryUsage > 60) score -= 10;
    
    if (metrics.apiLatency > 1000) score -= 20;
    else if (metrics.apiLatency > 500) score -= 10;
    
    if (metrics.cacheHitRate < 70) score -= 15;
    
    return Math.max(0, score);
  };

  const overallScore = getOverallScore();

  return (
    <Card className={cn('performance-monitor border-accent/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Performance</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={getScoreColor(overallScore)}>
              {overallScore}/100
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Quick Status */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3 text-blue-400" />
            <span>{metrics.loadTime}ms load</span>
          </div>
          <div className="flex items-center space-x-1">
            <Database className="h-3 w-3 text-purple-400" />
            <span>{metrics.memoryUsage}% memory</span>
          </div>
        </div>

        {/* Issues Summary */}
        <div className="space-y-1">
          {issues.slice(0, isExpanded ? undefined : 1).map((issue, i) => (
            <div key={i} className="flex items-start space-x-2 text-xs">
              {issue.type === 'error' && <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 flex-shrink-0" />}
              {issue.type === 'warning' && <AlertTriangle className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />}
              {issue.type === 'info' && <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 flex-shrink-0" />}
              <span className="text-muted-foreground">{issue.message}</span>
            </div>
          ))}
        </div>

        {/* Detailed Metrics */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t border-accent/20">
            <div className="grid grid-cols-1 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Bundle Size</span>
                  <span>{metrics.bundleSize}KB</span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.bundleSize / 1000) * 100)} 
                  className="h-1"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>API Latency</span>
                  <span>{metrics.apiLatency}ms</span>
                </div>
                <Progress 
                  value={Math.min(100, (metrics.apiLatency / 1000) * 100)} 
                  className="h-1"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Cache Hit Rate</span>
                  <span>{metrics.cacheHitRate}%</span>
                </div>
                <Progress 
                  value={metrics.cacheHitRate} 
                  className="h-1"
                />
              </div>
            </div>

            {/* Optimization Tips */}
            <div className="pt-2 border-t border-accent/20">
              <p className="text-xs text-muted-foreground mb-2 flex items-center space-x-1">
                <TrendingUp className="h-3 w-3" />
                <span>Optimization Tips:</span>
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {metrics.bundleSize > 500 && (
                  <li>• Consider code splitting for large bundles</li>
                )}
                {metrics.apiLatency > 300 && (
                  <li>• Implement request caching and batching</li>
                )}
                {metrics.memoryUsage > 50 && (
                  <li>• Review component memoization strategies</li>
                )}
                <li>• Enable compression and optimize images</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';