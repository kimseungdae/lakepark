import { describe, expect, test } from 'vitest';
import { mergeNotices, statusItemIdsFor, type RawNotice } from '../scripts/lib/matchBids.ts';
import { STATUS_BOARD } from '../src/data/status/board';

const raw = (overrides: Partial<RawNotice>): RawNotice => ({
  bidNtceNo: '20260800001',
  bidNtceNm: '나진포천 생태하천 조성공사',
  kind: '공사',
  dminsttNm: '인천도시공사',
  noticedAt: '2026-08-10',
  matchedKeyword: '나진포천',
  ...overrides,
});

describe('statusItemIdsFor', () => {
  test('공고명에서 상태판 항목을 찾는다', () => {
    expect(statusItemIdsFor('나진포천 생태하천 조성공사')).toEqual(['najinpo-stream']);
    expect(statusItemIdsFor('검단 박물관·도서관 건립공사')).toEqual(['museum-library']);
    expect(statusItemIdsFor('관계없는 공고')).toEqual([]);
  });

  test('매핑 규칙의 상태판 id는 전부 실제 STATUS_BOARD 항목이다', () => {
    const statusIds = new Set(STATUS_BOARD.map((item) => item.id));
    const sampleNames = [
      '나진포천 공사',
      '박물관 건립',
      '5호선 연장 설계',
      '넥스트콤플렉스 조성',
      '워라밸빌리지 조성',
      '호수공원 조성',
      '학교 신축',
      '산업단지 조성',
      '도로 개설',
    ];
    for (const name of sampleNames) {
      for (const id of statusItemIdsFor(name)) {
        expect(statusIds.has(id), `${name} → 미지의 id ${id}`).toBe(true);
      }
    }
  });
});

describe('mergeNotices', () => {
  test('공고번호 중복은 병합되고 키워드가 누적된다', () => {
    const merged = mergeNotices(
      [raw({}), raw({ matchedKeyword: '검단' })],
      [],
      '2026-08-13',
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]?.matchedKeywords).toEqual(['나진포천', '검단']);
  });

  test('firstSeenAt은 기존 스냅샷에서 승계된다', () => {
    const merged = mergeNotices(
      [raw({})],
      [{ bidNtceNo: '20260800001', firstSeenAt: '2026-07-01' }],
      '2026-08-13',
    );
    expect(merged[0]?.firstSeenAt).toBe('2026-07-01');
  });

  test('처음 보는 공고의 firstSeenAt은 오늘이다', () => {
    const merged = mergeNotices([raw({})], [], '2026-08-13');
    expect(merged[0]?.firstSeenAt).toBe('2026-08-13');
  });

  test('보존 기간(90일)을 지난 공고는 버려지고 최신순으로 정렬된다', () => {
    const merged = mergeNotices(
      [
        raw({ bidNtceNo: 'old', noticedAt: '2026-01-01' }),
        raw({ bidNtceNo: 'b', noticedAt: '2026-08-01' }),
        raw({ bidNtceNo: 'a', noticedAt: '2026-08-10' }),
      ],
      [],
      '2026-08-13',
    );
    expect(merged.map((bid) => bid.bidNtceNo)).toEqual(['a', 'b']);
  });
});
