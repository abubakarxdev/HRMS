import dayjs, { Dayjs } from 'dayjs';

/**
 * Formats a date/time string or Dayjs object to 12-hour format (e.g., "1:00 PM").
 * @param time Date string, Dayjs object, or Date object
 * @returns Formatted time string
 */
export const formatTime = (time: string | Dayjs | Date): string => {
  return dayjs(time).format('h:mm A');
};

/**
 * Returns the default break times based on the day of the week.
 * @returns Object containing start time, end time, and a label
 */
export const getDefaultBreakTimes = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { start: '', end: '', label: 'Weekend - No default break' };
  } else if (dayOfWeek === 5) {
    return { start: '13:00', end: '14:30', label: 'Friday: 1:00 PM - 2:30 PM' };
  } else {
    return { start: '13:00', end: '14:00', label: 'Mon-Thu: 1:00 PM - 2:00 PM' };
  }
};
