#!/usr/bin/env tsx

/**
 * NLP Test Runner
 * Runs all NLP-related tests and provides comprehensive reporting
 */

import { runComprehensiveNLPTests } from '../src/lib/__tests__/comprehensiveNlpTests';
import { demonstrateEnhancedNLP, performanceComparison } from '../src/lib/__tests__/nlpDemo';

async function runAllNLPTests() {
  console.log('🚀 STARTING COMPREHENSIVE NLP TESTING\n');
  console.log('=' .repeat(80));
  
  try {
    // Run comprehensive test suite
    console.log('\n📋 PHASE 1: COMPREHENSIVE TEST SUITE');
    console.log('-'.repeat(50));
    await runComprehensiveNLPTests();
    
    // Run demo tests
    console.log('\n📋 PHASE 2: DEMONSTRATION TESTS');
    console.log('-'.repeat(50));
    await demonstrateEnhancedNLP();
    
    // Run performance comparison
    console.log('\n📋 PHASE 3: PERFORMANCE COMPARISON');
    console.log('-'.repeat(50));
    await performanceComparison();
    
    console.log('\n🎉 ALL NLP TESTS COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(80));
    console.log('✅ NLP system is fully functional and ready for production use');
    
  } catch (error) {
    console.error('\n❌ NLP TESTING FAILED:', error);
    console.log('=' .repeat(80));
    process.exit(1);
  }
}

// Run the tests
runAllNLPTests();
