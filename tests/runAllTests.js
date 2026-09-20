/**
 * UniAssist AI Master Test Runner
 * Executes unit tests, business logic verifications, and prompt engine checks.
 */
import { runAttendanceUnitTests } from './unit/attendanceLogic.test.js';
import { runPromptEngineUnitTests } from './unit/promptEngine.test.js';

console.log('===========================================================');
console.log('🚀 UNIASSIST AI — AUTOMATED QUALITY ASSURANCE TEST RUNNER');
console.log('===========================================================');

const t1 = runAttendanceUnitTests();
const t2 = runPromptEngineUnitTests();

const grandTotal = t1.total + t2.total;
const grandPassed = t1.passed + t2.passed;
const grandFailed = grandTotal - grandPassed;

console.log('\n===========================================================');
console.log('📊 MASTER TEST RESULTS SUMMARY');
console.log('===========================================================');
console.log(`Total Test Assertions: ${grandTotal}`);
console.log(`Assertions Passed:     ${grandPassed} ✅`);
console.log(`Assertions Failed:     ${grandFailed} ${grandFailed === 0 ? '' : '❌'}`);
console.log('===========================================================');

if (grandFailed === 0) {
  console.log('🎉 ALL AUTOMATED TEST SUITES PASSED WITH 100% SUCCESS RATE!\n');
  process.exit(0);
} else {
  console.error(`💥 ${grandFailed} tests failed. Review log above for details.\n`);
  process.exit(1);
}
