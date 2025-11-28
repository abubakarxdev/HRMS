const dateUtil = require('./src/utils/date.util');

// Mock calculateRecordMinutes from attendance.service.js
const calculateRecordMinutes = (record, now) => {
  if (!record || !record.sessions) return 0;

  let totalMinutes = 0;

  record.sessions.forEach(session => {
    if (!session.checkInTime) return;

    // Determine session end time (CheckOut or Now)
    const sessionEndTime = session.checkOutTime ? new Date(session.checkOutTime) : now;
    const sessionStartTime = new Date(session.checkInTime);

    // Calculate gross duration
    const grossDuration = dateUtil.calculateDurationMinutes(sessionStartTime, sessionEndTime);
    console.log(`Session ${session.id}: Start=${sessionStartTime.toISOString()}, End=${sessionEndTime.toISOString()}, Gross=${grossDuration}`);

    // Calculate total break duration
    let totalBreakMinutes = 0;
    if (session.breaks && session.breaks.length > 0) {
      session.breaks.forEach(breakItem => {
        if (!breakItem.startTime) return;
        
        const breakStartTime = new Date(breakItem.startTime);
        // Break end is either stored endTime, or Now (if active), but capped at sessionEndTime
        let breakEndTime = breakItem.endTime ? new Date(breakItem.endTime) : now;
        
        // Safety check: break shouldn't extend beyond session (though for active session/break both are 'now')
        if (breakEndTime > sessionEndTime) breakEndTime = sessionEndTime;

        const breakDuration = dateUtil.calculateDurationMinutes(breakStartTime, breakEndTime);
        totalBreakMinutes += breakDuration;
        console.log(`  Break: Start=${breakStartTime.toISOString()}, End=${breakEndTime.toISOString()}, Duration=${breakDuration}`);
      });
    }

    // Net duration
    const netDuration = Math.max(0, grossDuration - totalBreakMinutes);
    console.log(`  Net Duration: ${netDuration}`);
    totalMinutes += netDuration;
  });

  return Math.floor(totalMinutes);
};

// Test Case 1: Closed Session + Active Session
const now = new Date("2023-10-27T12:00:00Z");
const record = {
  sessions: [
    {
      id: "s1",
      checkInTime: "2023-10-27T09:00:00Z",
      checkOutTime: "2023-10-27T10:00:00Z", // 60 mins
      breaks: []
    },
    {
      id: "s2",
      checkInTime: "2023-10-27T11:00:00Z",
      checkOutTime: null, // Active, should be 60 mins until 12:00
      breaks: []
    }
  ]
};

console.log("Test 1: Closed + Active");
const total = calculateRecordMinutes(record, now);
console.log(`Total Minutes: ${total}`);

if (total === 120) {
  console.log("PASS");
} else {
  console.log("FAIL: Expected 120");
}

// Test Case 2: Active Session with Active Break
console.log("\nTest 2: Active Session with Active Break");
// Session started at 11:00. Break started at 11:30. Now is 12:00.
// Gross: 60 mins. Break: 30 mins. Net: 30 mins.
const record2 = {
  sessions: [
    {
      id: "s3",
      checkInTime: "2023-10-27T11:00:00Z",
      checkOutTime: null,
      breaks: [
        {
          startTime: "2023-10-27T11:30:00Z",
          endTime: null
        }
      ]
    }
  ]
};

const total2 = calculateRecordMinutes(record2, now);
console.log(`Total Minutes: ${total2}`);

if (total2 === 30) {
  console.log("PASS");
} else {
  console.log("FAIL: Expected 30");
}
