/**
 * Comprehensive Admin Flow Test Suite
 * This utility helps identify issues in the admin authentication and authorization flow
 */

import { supabase } from '@/integrations/supabase/client';

export interface AdminFlowTestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

export class AdminFlowTester {
  private results: AdminFlowTestResult[] = [];

  private addResult(testName: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
    this.results.push({ testName, status, message, details });
  }

  async runAllTests(): Promise<AdminFlowTestResult[]> {
    this.results = [];
    
    console.log('🔍 Starting comprehensive admin flow tests...');
    
    await this.testDatabaseFunctions();
    await this.testRLSPolicies();
    await this.testAuthState();
    await this.testAdminBootstrap();
    
    console.log('✅ Admin flow tests completed');
    return this.results;
  }

  private async testDatabaseFunctions() {
    console.log('Testing database functions...');
    
    try {
      // Test is_admin function
      const { data: isAdminResult, error: isAdminError } = await supabase.rpc('is_admin');
      
      if (isAdminError) {
        this.addResult('is_admin function', 'FAIL', `is_admin function error: ${isAdminError.message}`);
      } else {
        this.addResult('is_admin function', 'PASS', `is_admin function works, result: ${isAdminResult}`);
      }
    } catch (error) {
      this.addResult('is_admin function', 'FAIL', `is_admin function exception: ${error}`);
    }

    try {
      // Test get_all_users function (should fail if not admin)
      const { data: usersResult, error: usersError } = await supabase.rpc('get_all_users');
      
      if (usersError) {
        if (usersError.message.includes('Only admins can view all users')) {
          this.addResult('get_all_users security', 'PASS', 'get_all_users properly restricts access to admins only');
        } else {
          this.addResult('get_all_users function', 'FAIL', `get_all_users function error: ${usersError.message}`);
        }
      } else {
        this.addResult('get_all_users function', 'PASS', `get_all_users function works, returned ${usersResult?.length || 0} users`);
      }
    } catch (error) {
      this.addResult('get_all_users function', 'FAIL', `get_all_users function exception: ${error}`);
    }
  }

  private async testRLSPolicies() {
    console.log('Testing RLS policies...');
    
    try {
      // Test profiles table access
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) {
        this.addResult('profiles RLS', 'PASS', 'profiles table properly protected by RLS');
      } else {
        this.addResult('profiles RLS', 'WARNING', `profiles table returned ${profilesData?.length || 0} rows - check if this is expected`);
      }
    } catch (error) {
      this.addResult('profiles RLS', 'FAIL', `profiles table access error: ${error}`);
    }

    try {
      // Test beaches table access
      const { data: beachesData, error: beachesError } = await supabase
        .from('beaches')
        .select('*');
      
      if (beachesError) {
        this.addResult('beaches RLS', 'FAIL', `beaches table access error: ${beachesError.message}`);
      } else {
        this.addResult('beaches RLS', 'PASS', `beaches table accessible, returned ${beachesData?.length || 0} beaches`);
      }
    } catch (error) {
      this.addResult('beaches RLS', 'FAIL', `beaches table access error: ${error}`);
    }
  }

  private async testAuthState() {
    console.log('Testing authentication state...');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        this.addResult('auth session', 'FAIL', `Session retrieval error: ${error.message}`);
      } else if (session) {
        this.addResult('auth session', 'PASS', `User is authenticated: ${session.user.email}`);
        
        // Test profile fetch
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (profileError) {
          this.addResult('profile fetch', 'FAIL', `Profile fetch error: ${profileError.message}`);
        } else if (profile) {
          this.addResult('profile fetch', 'PASS', `Profile found: ${profile.role} role`);
        } else {
          this.addResult('profile fetch', 'WARNING', 'No profile found for authenticated user');
        }
      } else {
        this.addResult('auth session', 'PASS', 'No active session (user not authenticated)');
      }
    } catch (error) {
      this.addResult('auth session', 'FAIL', `Session test exception: ${error}`);
    }
  }

  private async testAdminBootstrap() {
    console.log('Testing admin bootstrap...');
    
    try {
      // Test bootstrap function (should fail if admins exist)
      const { data: bootstrapResult, error: bootstrapError } = await supabase.rpc('bootstrap_first_admin', {
        admin_email: 'test@example.com'
      });
      
      if (bootstrapError) {
        if (bootstrapError.message.includes('Admin users already exist')) {
          this.addResult('admin bootstrap security', 'PASS', 'Bootstrap function properly prevents creating admins when they exist');
        } else if (bootstrapError.message.includes('User with email')) {
          this.addResult('admin bootstrap validation', 'PASS', 'Bootstrap function properly validates user existence');
        } else {
          this.addResult('admin bootstrap function', 'FAIL', `Bootstrap function error: ${bootstrapError.message}`);
        }
      } else {
        this.addResult('admin bootstrap function', 'WARNING', 'Bootstrap function succeeded - check if this is expected');
      }
    } catch (error) {
      this.addResult('admin bootstrap function', 'FAIL', `Bootstrap function exception: ${error}`);
    }
  }

  getResults(): AdminFlowTestResult[] {
    return this.results;
  }

  getSummary(): { total: number; passed: number; failed: number; warnings: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    
    return { total, passed, failed, warnings };
  }

  printReport(): void {
    console.log('\n📊 Admin Flow Test Report');
    console.log('========================');
    
    const summary = this.getSummary();
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    
    console.log('\n📋 Detailed Results:');
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.testName}: ${result.message}`);
      if (result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });
  }
}

// Export a function to run tests from the browser console
export const runAdminFlowTests = async (): Promise<AdminFlowTestResult[]> => {
  const tester = new AdminFlowTester();
  const results = await tester.runAllTests();
  tester.printReport();
  return results;
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).runAdminFlowTests = runAdminFlowTests;
}
