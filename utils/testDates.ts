export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLatestMonday(date = new Date()): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return formatLocalDate(monday);
}

export function getNextCountMonday(date = new Date()): string {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // If today is already Monday, use today's date instead of skipping to next week's Monday.
  const daysUntilMonday = (8 - monday.getDay()) % 7;
  monday.setDate(monday.getDate() + daysUntilMonday);
  return formatLocalDate(monday);
}

export function getNextMonthlyCountDate(date = new Date()): string {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const daysBackToMonday = (lastDay.getDay() + 6) % 7;
  const lastMonday = new Date(lastDay);
  lastMonday.setDate(lastDay.getDate() - daysBackToMonday);

  if (date.getTime() <= lastMonday.getTime()) {
    return formatLocalDate(lastMonday);
  }

  const nextMonthLastDay = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  const nextLastMonday = new Date(nextMonthLastDay);
  nextLastMonday.setDate(nextMonthLastDay.getDate() - ((nextMonthLastDay.getDay() + 6) % 7));
  return formatLocalDate(nextLastMonday);
}

export function getCurrentLocalDate(): string {
  return formatLocalDate(new Date());
}
