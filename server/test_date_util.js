const dateUtil = require('./src/utils/date.util');

try {
  console.log("Testing getStartOfDay...");
  const start = dateUtil.getStartOfDay();
  console.log("Start of Day:", start.toISOString());
  console.log("Test Passed!");
} catch (error) {
  console.error("Test Failed:", error.message);
  process.exit(1);
}
