export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr)} at ${formatTime(dateStr)}`;
}

export function isDeadlinePassed(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export function isEventPast(eventDate: string): boolean {
  return new Date(eventDate) < new Date();
}

export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Past';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return formatDate(dateStr);
}

export function isBITSEmail(email: string): boolean {
  return email.endsWith('@pilani.bits-pilani.ac.in');
}

export const CATEGORIES = [
  { value: 'workshop', label: 'Workshop' },
  { value: 'competition', label: 'Competition' },
  { value: 'talk', label: 'Talk' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'game', label: 'Game' },
  { value: 'other', label: 'Other' },
] as const;

export const SUGGESTED_TAGS = [
  '#coding',
  '#tech',
  '#robotics',
  '#design',
  '#business',
  '#music',
  '#dance',
  '#photography',
  '#gaming',
  '#sports',
  '#free',
  '#prizes',
  '#beginner-friendly',
  '#team-event',
  '#solo',
];
