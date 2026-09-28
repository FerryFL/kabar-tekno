interface CompletedReadDate {
  date: string;
  count: number;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function dateKeyToDayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;
}

/**
 * A completed day keeps the streak alive for the following day. A second
 * consecutive missed day resets it, so completed days may be two calendar
 * days apart while they are part of the same streak.
 */
export function calculateStreak(
  completedReadDates: CompletedReadDate[],
  today: string,
) {
  const completedDays = completedReadDates
    .filter(({ count }) => count > 0)
    .map(({ date }) => dateKeyToDayNumber(date))
    .filter((day) => day <= dateKeyToDayNumber(today))
    .sort((a, b) => b - a);

  if (completedDays.length === 0) {
    return 0;
  }

  const latestCompletedDay = completedDays[0];
  if (dateKeyToDayNumber(today) - latestCompletedDay > 2) {
    return 0;
  }

  let streak = 1;
  for (let index = 1; index < completedDays.length; index += 1) {
    const gap = completedDays[index - 1] - completedDays[index];

    if (gap > 2) {
      break;
    }

    streak += 1;
  }

  return streak;
}
