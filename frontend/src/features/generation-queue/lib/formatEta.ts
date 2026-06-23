export function formatEta(seconds: number) {
  if (seconds <= 0) return "готово";
  if (seconds < 60) return `${seconds} с`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest > 0 ? `${minutes} мин ${rest} с` : `${minutes} мин`;
}

export function formatCredits(credits: number) {
  return `${credits} cr`;
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} с`;
  return `${Math.round(seconds / 60)} мин`;
}
