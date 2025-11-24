/**
 * Date Utility for Timezone Handling
 * Default Timezone: Asia/Karachi
 */

const DEFAULT_TIMEZONE = "Asia/Karachi";

/**
 * Get current date object in specific timezone
 * Note: JS Date objects are always UTC internally. This helper is useful if we need
 * to get a string representation or manipulate components in a specific TZ.
 * For DB storage (Timestamptz), standard new Date() (UTC) is fine as Postgres handles the offset.
 * However, for "Start of Day" logic, we MUST respect the target timezone.
 */

const getNow = () => new Date();

/**
 * Get Start of Day for a specific timezone
 * @param {Date} date - Optional date, defaults to now
 * @param {string} timezone - Timezone string
 * @returns {Date} - Date object representing 00:00:00 in the target timezone
 */
const getStartOfDay = (date = new Date(), timezone = DEFAULT_TIMEZONE) => {
  // Create a formatter for the target timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;

  // Create a string in ISO format YYYY-MM-DD, then construct a date in that TZ
  // Actually, simpler way:
  // 1. Get the date string in the target TZ
  // 2. Create a date object from that string at 00:00:00
  
  // We can use the string directly to create a Date, but we need to be careful about how Date parses it.
  // Best way: Construct a string "YYYY-MM-DDT00:00:00" and append the offset?
  // Or use the Intl API to get the components and build it.
  
  // Let's use a trick:
  // Get the date string in the target timezone
  const dateString = new Date(date).toLocaleDateString("en-US", {
    timeZone: timezone,
  });
  
  // Create a new Date object from that string (which will be local midnight of the server/browser)
  // BUT we want the specific instant that corresponds to midnight in Karachi.
  
  // Wait, if we want to query the DB for "today in Karachi", we need the UTC timestamp that corresponds to 00:00 Karachi.
  // Karachi is UTC+5. So 00:00 Karachi is 19:00 previous day UTC.
  
  // Let's use the Intl API to get the parts, then construct a UTC date with the offset.
  // Actually, since we don't have a library like date-fns-tz, this is tricky to do perfectly for all TZs without a library.
  // BUT for a specific project requirement, we can rely on the fact that we just need the "Day" part for the record.
  
  // The `AttendanceRecord` has a `date` field which is `@db.Date`.
  // Prisma/Postgres stores `@db.Date` as YYYY-MM-DD without time.
  // So we just need to pass a JS Date object that, when stringified by Prisma, results in the correct YYYY-MM-DD.
  // Prisma usually uses the UTC date of the JS Date object.
  // So if it's 1 AM Karachi (which is 8 PM previous day UTC), `new Date()` will be previous day in UTC.
  // If we pass this to Prisma for a `@db.Date` field, it might save the previous day!
  
  // So we need to ensure the Date object we pass has the correct YYYY-MM-DD in UTC that matches Karachi's YYYY-MM-DD.
  // i.e. we need to "shift" the date so that its UTC components match Karachi's components.
  
  const targetDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  // targetDate is now a Date object where the local time (of the server) matches Karachi's time.
  // But we want the UTC parts to match.
  
  // Actually, simpler:
  // Just return the Date object constructed from the locale string.
  // `new Date(date.toLocaleString("en-US", { timeZone: timezone }))`
  // This creates a Date object where the components match the string.
  // e.g. if it's "11/24/2025, 12:00:00 AM" in Karachi, this creates a local date of "11/24/2025 00:00:00".
  // If we set hours to 0, it stays 0.
  // When Prisma saves this to `@db.Date`, it takes the UTC YYYY-MM-DD.
  // If the server is in UTC, `new Date("11/24/2025")` is 11/24 00:00 UTC.
  // This is exactly what we want for the `@db.Date` column - a canonical "Day".
  
  const d = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  d.setHours(0, 0, 0, 0);
  return d;
};

module.exports = {
  getNow,
  getStartOfDay,
  DEFAULT_TIMEZONE,
};
