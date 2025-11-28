const fs = require('fs');
const path = require('path');

try {
  const logPath = path.join(__dirname, 'debug_stats.log');
  if (fs.existsSync(logPath)) {
    const content = fs.readFileSync(logPath, 'utf8');
    console.log("--- LOG START ---");
    console.log(content.slice(-2000)); // Print last 2000 chars
    console.log("--- LOG END ---");
  } else {
    console.log("Log file not found.");
  }
} catch (e) {
  console.error("Error reading log:", e);
}
