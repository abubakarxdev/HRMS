/**
 * Date Utility for Timezone Handling
 * Default Timezone: Asia/Karachi
 */

const DEFAULT_TIMEZONE = "Asia/Karachi";

/**
 * Get current date object
 */
const getNow = () => new Date();

/**
 * Get Start of Day for a specific timezone
 * @param {Date} date - Optional date, defaults to now
 * @param {string} timezone - Timezone string (default: Asia/Karachi)
 * @returns {Date} - Date object representing 00:00:00 in the target timezone
 */
const getStartOfDay = (date = new Date(), timezone = DEFAULT_TIMEZONE) => {
  // 1. Get the "face value" parts of the date in target timezone
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = format.formatToParts(date);
  const getPart = (type) => parseInt(parts.find(p => p.type === type).value);
  
  const year = getPart('year');
  const month = getPart('month');
  const day = getPart('day');

  // 2. Construct a UTC date with these parts (00:00:00 UTC)
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  
  // 3. Calculate the offset to shift UTC to Target Timezone
  // We compare the "face value" time in UTC vs the "face value" time in Target Timezone
  const strInTz = utcDate.toLocaleString("en-US", { timeZone: timezone });
  const dateInTz = new Date(strInTz);
  
  // If the environment parses new Date(strInTz) as Local, and Local != UTC, this might be off.
  // But assuming the server is UTC or the previous logic was intended to work this way:
  const offset = dateInTz - utcDate;
  
  // 4. Apply offset
  return new Date(utcDate.getTime() - offset);
};

/**
 * Get Start of Week (Monday) for a specific timezone
 * @param {Date} date - Optional date, defaults to now
 * @param {string} timezone - Timezone string
 * @returns {Date} - Date object representing Monday 00:00:00 in the target timezone
 */
const getStartOfWeek = (date = new Date(), timezone = DEFAULT_TIMEZONE) => {
  const startOfDay = getStartOfDay(date, timezone);
  const day = startOfDay.getDay();
  const diff = startOfDay.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  startOfDay.setDate(diff);
  return startOfDay;
};

/**
 * Get Start of Month for a specific timezone
 * @param {Date} date - Optional date, defaults to now
 * @param {string} timezone - Timezone string
 * @returns {Date} - Date object representing 1st day 00:00:00 in the target timezone
 */
const getStartOfMonth = (date = new Date(), timezone = DEFAULT_TIMEZONE) => {
  const startOfDay = getStartOfDay(date, timezone);
  startOfDay.setDate(1);
  return startOfDay;
};

/**
 * Format duration in minutes to hours and minutes
 * @param {number} minutes - Duration in minutes
 * @returns {string} - Formatted string (e.g., "8h 30m")
 */
const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return "0h 0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Calculate duration in minutes between two dates
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {number} - Duration in minutes
 */
const calculateDurationMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  const diff = new Date(endTime) - new Date(startTime);
  return Math.floor(diff / (1000 * 60));
};

module.exports = {
  getNow,
  getStartOfDay,
  getStartOfWeek,
  getStartOfMonth,
  formatDuration,
  calculateDurationMinutes,
  DEFAULT_TIMEZONE,
};
