// Short relative time for a real event, e.g. "just now", "5m ago", "3d ago".
export function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}
