import { describe, expect, test } from 'vitest';
import { buildMoveInTasks, parseMoveInWorkspace } from '../src/lib/moveIn';

describe('buildMoveInTasks', () => {
  test('사용자가 정한 입주일에서 준비 날짜를 계산한다', () => {
    const tasks = buildMoveInTasks({ selectedMoveInDate: '2029-12-20' });
    expect(tasks.find((task) => task.id === 'moving-quotes')?.dueDate).toBe('2029-11-20');
    expect(tasks.find((task) => task.id === 'final-payment')?.dueDate).toBe('2029-12-20');
  });

  test('날짜가 없어도 지금 할 일을 제공한다', () => {
    const tasks = buildMoveInTasks({});
    expect(tasks.some((task) => task.phase === 'now')).toBe(true);
    expect(tasks.find((task) => task.id === 'school-recheck')?.recheckAt).toBe('2029-09-01');
  });
});

describe('parseMoveInWorkspace', () => {
  test('손상 JSON은 null로 처리한다', () => {
    expect(parseMoveInWorkspace('{broken')).toBeNull();
  });

  test('알 수 없는 필드는 버리고 유효한 기록을 복원한다', () => {
    const workspace = parseMoveInWorkspace(JSON.stringify({
      v: 1,
      dates: { selectedMoveInDate: '2029-12-20', bad: 'x' },
      completedTaskIds: ['contract-copy'],
      quotes: [{ id: 'q1', category: '이사', company: '가나다', amount: 1500000, note: '' }],
      measurements: [],
      defects: [],
    }));

    expect(workspace?.dates).toEqual({ selectedMoveInDate: '2029-12-20' });
    expect(workspace?.quotes[0]?.amount).toBe(1_500_000);
  });
});
