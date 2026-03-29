export function daysBetween(checkInDate: string, checkOutDate: string) {
  const start = new Date(`${checkInDate}T00:00:00.000Z`);
  const end = new Date(`${checkOutDate}T00:00:00.000Z`);
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.round((end.getTime() - start.getTime()) / millisecondsPerDay);
}

export function normalizeDateParam(value: string | null) {
  if (!value) {
    return null;
  }

  return value;
}
