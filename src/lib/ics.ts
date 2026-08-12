export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  description?: string;
};

const escapeText = (value: string): string => value
  .replaceAll('\\', '\\\\')
  .replaceAll('\n', '\\n')
  .replaceAll(',', '\\,')
  .replaceAll(';', '\\;');

const compactDate = (value: string): string => value.replaceAll('-', '');

export const buildCalendar = (name: string, events: readonly CalendarEvent[]): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lakepark Guide//KO',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(name)}`,
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${escapeText(event.id)}@lakepark.local`,
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `SUMMARY:${escapeText(event.title)}`,
      ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
};

export const downloadCalendar = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
