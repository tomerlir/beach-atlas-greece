import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Shield } from 'lucide-react';
import { AdminFlowTester, AdminFlowTestResult } from '@/utils/adminFlowTest';
import { useAuth } from '@/contexts/AuthContext';

export const AdminFlowAudit: React.FC = () => {
  const { profile } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<AdminFlowTestResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  // Check if current user is admin
  if (!profile || profile.role !== 'admin') {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You must be an admin to access the admin flow audit.
        </AlertDescription>
      </Alert>
    );
  }

  const runAudit = async () => {
    setIsRunning(true);
    try {
      const tester = new AdminFlowTester();
      const testResults = await tester.runAllTests();
      setResults(testResults);
      setLastRun(new Date());
    } catch (error) {
      console.error('Audit failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return <Badge variant="default" className="bg-green-500">PASS</Badge>;
      case 'FAIL':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'WARNING':
        return <Badge variant="secondary" className="bg-yellow-500 text-yellow-900">WARNING</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const summary = results.length > 0 ? {
    total: results.length,
    passed: results.filter(r => r.status === 'PASS').length,
    failed: results.filter(r => r.status === 'FAIL').length,
    warnings: results.filter(r => r.status === 'WARNING').length,
  } : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Flow Security Audit
          </CardTitle>
          <CardDescription>
            Comprehensive security audit of the admin authentication and authorization system.
            This tool tests database functions, RLS policies, and authentication flows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={runAudit} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running Audit...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Run Security Audit
                </>
              )}
            </Button>
            
            {lastRun && (
              <span className="text-sm text-muted-foreground">
                Last run: {lastRun.toLocaleString()}
              </span>
            )}
          </div>

          {summary && (
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{summary.total}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
            </div>
          )}

          {summary && summary.failed > 0 && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {summary.failed} test(s) failed. Please review the results below and address any security issues.
              </AlertDescription>
            </Alert>
          )}

          {summary && summary.failed === 0 && summary.warnings === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All tests passed! The admin flow appears to be secure and functioning correctly.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Test Results</CardTitle>
            <CardDescription>
              Individual test results with detailed information about each security check.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{result.testName}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          View Details
                        </summary>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manual Testing Checklist</CardTitle>
          <CardDescription>
            Additional manual tests you should perform to ensure the admin flow is working correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 border rounded flex items-center justify-center text-xs font-bold">1</div>
              <div>
                <p className="font-medium">Sign Out Test</p>
                <p className="text-sm text-muted-foreground">
                  Sign out as admin, then try to access /admin - should redirect to login page
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 border rounded flex items-center justify-center text-xs font-bold">2</div>
              <div>
                <p className="font-medium">Session Persistence Test</p>
                <p className="text-sm text-muted-foreground">
                  Refresh the page while logged in - should maintain admin access
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 border rounded flex items-center justify-center text-xs font-bold">3</div>
              <div>
                <p className="font-medium">Password Change Test</p>
                <p className="text-sm text-muted-foreground">
                  Change your password in settings - should work and require re-login
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 border rounded flex items-center justify-center text-xs font-bold">4</div>
              <div>
                <p className="font-medium">User Management Test</p>
                <p className="text-sm text-muted-foreground">
                  Try to promote/demote users - should work for admins only
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 border rounded flex items-center justify-center text-xs font-bold">5</div>
              <div>
                <p className="font-medium">Direct URL Access Test</p>
                <p className="text-sm text-muted-foreground">
                  Try accessing /admin/settings directly without login - should redirect to login
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
