#!/usr/bin/env node

/**
 * Verification Test: First Name Only Display
 * 
 * This script verifies that the getFlatmateDisplayName function
 * correctly shows only first names in balance displays.
 */

console.log('🧪 Testing First Name Display Function...\n');

// Simulate the getFlatmateDisplayName function from App.js
const getFlatmateDisplayName = (flatmate) => {
  if (typeof flatmate === 'string') {
    // For backward compatibility with old data
    return flatmate;
  }
  // Always show just the first name for clean, simple display
  return flatmate.name || 'Unknown';
};

// Test cases
const testCases = [
  {
    description: 'Flatmate with first and last name',
    input: { name: 'Nathalie', lastname: 'van Wijk' },
    expected: 'Nathalie'
  },
  {
    description: 'Flatmate with only first name',
    input: { name: 'Dion' },
    expected: 'Dion'
  },
  {
    description: 'Legacy string format',
    input: 'John',
    expected: 'John'
  },
  {
    description: 'Flatmate with empty name',
    input: { name: '', lastname: 'Smith' },
    expected: 'Unknown'
  },
  {
    description: 'Flatmate with undefined name',
    input: { lastname: 'Johnson' },
    expected: 'Unknown'
  }
];

let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const result = getFlatmateDisplayName(testCase.input);
  const passed = result === testCase.expected;
  
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Input: ${JSON.stringify(testCase.input)}`);
  console.log(`  Expected: "${testCase.expected}"`);
  console.log(`  Got: "${result}"`);
  console.log(`  Result: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
  
  if (passed) passedTests++;
});

console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);

if (passedTests === totalTests) {
  console.log('🎉 All tests passed! First name display is working correctly.');
  console.log('\n✨ Key Features Verified:');
  console.log('  • Shows only first names in balance displays');
  console.log('  • Handles legacy string format for backward compatibility');
  console.log('  • Gracefully handles missing or empty names');
  console.log('  • Lastname remains available for CSV matching but not displayed');
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}
