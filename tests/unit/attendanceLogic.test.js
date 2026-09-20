/**
 * Unit Test Suite: Attendance Formulas & Bunk Simulator Logic
 */

export const runAttendanceUnitTests = () => {
  console.log('\n--- [TEST SUITE: Attendance Calculation & Simulator Logic] ---');
  let passed = 0;
  let total = 0;

  const assert = (condition, description) => {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${description}`);
    }
  };

  // 1. Basic Attendance Percentage Formula
  // Formula: (attended / total) * 100
  const calcPercentage = (attended, total) => {
    if (total === 0) return 0;
    return Number(((attended / total) * 100).toFixed(1));
  };

  assert(calcPercentage(21, 24) === 87.5, '21/24 classes attended should equal 87.5%');
  assert(calcPercentage(13, 18) === 72.2, '13/18 classes attended should equal 72.2% (Below 75%)');
  assert(calcPercentage(0, 10) === 0, '0/10 classes attended should equal 0.0%');
  assert(calcPercentage(20, 20) === 100.0, '20/20 classes attended should equal 100.0%');
  assert(calcPercentage(0, 0) === 0, '0/0 edge case should safely return 0%');

  // 2. Maximum Safe Misses Formula (while staying >= 75%)
  // (attended) / (total + x) >= 0.75 => x <= (attended / 0.75) - total
  const calcSafeMisses = (attended, total) => {
    return Math.max(0, Math.floor((attended / 0.75) - total));
  };

  assert(calcSafeMisses(21, 24) === 4, 'With 21 attended of 24 total, student can safely miss 4 more classes');
  assert(calcSafeMisses(13, 18) === 0, 'With 13 attended of 18 total (72.2%), student can safely miss 0 classes');

  // 3. Consecutive Classes Needed to Reach 75%
  // (attended + y) / (total + y) >= 0.75 => y >= (0.75*total - attended) / 0.25
  const calcNeededToReach75 = (attended, total) => {
    const pct = calcPercentage(attended, total);
    if (pct >= 75) return 0;
    return Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
  };

  assert(calcNeededToReach75(13, 18) === 2, 'With 13/18 (72.2%), student needs 2 consecutive classes to reach 75%');
  assert(calcNeededToReach75(21, 24) === 0, 'With 21/24 (87.5%), student is already above 75%, needs 0 classes');

  console.log(`Result: ${passed}/${total} assertions passed.`);
  return { passed, total };
};
