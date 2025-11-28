require('dotenv').config();
const prisma = require('./src/config/prisma');
const dateUtil = require('./src/utils/date.util');

async function fixRecords() {
  try {
    console.log("Fixing Attendance Records...");
    const records = await prisma.attendanceRecord.findMany({
      include: { sessions: true, employee: { include: { user: true } } }
    });

    for (const record of records) {
      if (record.sessions.length === 0) continue;

      // Determine the "Majority Date" of the sessions
      // We use the employee's timezone to determine the "Day" of each session
      const timezone = record.employee?.user?.timezone || dateUtil.DEFAULT_TIMEZONE;
      
      const sessionDays = record.sessions.map(s => {
        // Get Start of Day for this session in the target timezone
        const d = dateUtil.getStartOfDay(new Date(s.checkInTime), timezone);
        return d.getTime(); // Use timestamp for comparison
      });

      // Check if all sessions belong to the same day
      const uniqueDays = [...new Set(sessionDays)];
      
      if (uniqueDays.length === 1) {
        const correctDateTimestamp = uniqueDays[0];
        const correctDate = new Date(correctDateTimestamp);
        
        const recordDateTimestamp = record.date.getTime();
        
        // If record date does not match the session date
        // Note: record.date might be 00:00 UTC, while correctDate is 00:00 PKT (19:00 UTC prev day)
        // We should compare them.
        // Actually, we want the record.date to BE the correctDate (00:00 PKT).
        
        if (Math.abs(recordDateTimestamp - correctDateTimestamp) > 1000) { // Allow 1s diff
           console.log(`Fixing Record ${record.id}:`);
           console.log(`  Current Date: ${record.date.toISOString()}`);
           console.log(`  Correct Date: ${correctDate.toISOString()}`);
           
           await prisma.attendanceRecord.update({
             where: { id: record.id },
             data: { date: correctDate }
           });
           console.log("  -> UPDATED.");
        }
      } else {
        console.log(`Skipping Record ${record.id}: Mixed session dates.`);
      }
    }
    console.log("Done.");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

fixRecords();
