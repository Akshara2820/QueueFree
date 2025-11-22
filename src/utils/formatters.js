export function formatWait(minutes) {
  if (minutes <= 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return `${hrs}h${rem ? ` ${rem}m` : ''}`;
}
