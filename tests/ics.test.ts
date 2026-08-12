import { describe, expect, test } from 'vitest';
import { buildCalendar } from '../src/lib/ics';

describe('buildCalendar', () => {
  test('여러 납부일을 올바른 종일 일정으로 만든다', () => {
    const calendar = buildCalendar('검단레이크파크 납부 일정', [
      { id: 'interim-1', date: '2026-12-15', title: '중도금 1차', description: '계약서 계좌 재확인' },
      { id: 'balance', date: '2029-12-01', title: '잔금', description: '입주안내문 우선' },
    ]);

    expect(calendar).toContain('BEGIN:VCALENDAR');
    expect(calendar).toContain('DTSTART;VALUE=DATE:20261215');
    expect(calendar).toContain('SUMMARY:중도금 1차');
    expect(calendar).toContain('END:VCALENDAR');
    expect(calendar).toContain('\r\n');
  });

  test('쉼표와 줄바꿈을 이스케이프한다', () => {
    const calendar = buildCalendar('일정', [
      { id: 'one', date: '2026-12-15', title: '계약금, 확인', description: '첫 줄\n둘째 줄' },
    ]);

    expect(calendar).toContain('SUMMARY:계약금\\, 확인');
    expect(calendar).toContain('DESCRIPTION:첫 줄\\n둘째 줄');
  });
});
