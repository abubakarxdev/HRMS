import dayjs from 'dayjs';

/**
 * Calculate the number of working days between two dates (inclusive),
 * excluding weekends (Saturday and Sunday).
 * @param startDate 
 * @param endDate 
 * @returns number of working days
 */
export const calculateWorkingDays = (startDate: string | Date, endDate: string | Date): number => {
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) return 0;
  if (end.isBefore(start)) return 0;

  let count = 0;
  let current = start;

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    const dayOfWeek = current.day();
    // 0 is Sunday, 6 is Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current = current.add(1, 'day');
  }

  return count;
};
