require('dotenv').config();
const prisma = require('./src/config/prisma');

async function analyze() {
  try {
    console.log("Analyzing Attendance Records...");
    const records = await prisma.attendanceRecord.findMany({
      include: { sessions: true }
    });

    for (const record of records) {
      console.log(`\nRecord ID: ${record.id}`);
      console.log(`  Record Date (DB): ${record.date.toISOString()}`);
      
      if (record.sessions.length === 0) {
        console.log("  No sessions.");
        continue;
      }

      const sessionDates = record.sessions.map(s => {
        const d = new Date(s.checkInTime);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
      });

      const uniqueDates = [...new Set(sessionDates)];
      console.log(`  Session Dates: ${uniqueDates.join(', ')}`);

      const recordDateStr = record.date.toISOString().split('T')[0];
      
      // Check for mismatch
      // Note: Record Date is UTC 00:00. Session Date is UTC time.
      // If Record Date is 2025-11-27.
      // And Session is 2025-11-28.
      // That's a mismatch.
      
      const mismatch = uniqueDates.some(d => d !== recordDateStr);
      if (mismatch) {
        console.log("  MISMATCH DETECTED!");
        // Check if ALL sessions are on the mismatch date (e.g. all on 28th, record on 27th)
        if (uniqueDates.length === 1 && uniqueDates[0] !== recordDateStr) {
             console.log(`  -> ACTION: Update record date to ${uniqueDates[0]}`);
        } else {
             console.log("  -> ACTION: Mixed dates! Need to split record.");
        }
      } else {
        console.log("  Match (or close enough).");
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

analyze();
