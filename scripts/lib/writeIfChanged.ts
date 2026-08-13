import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * 산출 JSON을 "내용이 실제로 달라졌을 때만" 쓴다.
 * fetchedAt처럼 매 실행 바뀌는 키는 비교에서 제외해, 무의미한 일일 커밋(→불필요한 배포)을 막는다.
 */

/** 객체 키를 정렬해 결정적 문자열을 만든다 (배열 순서는 호출자가 책임진다). */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => [key, sortKeys(val)]),
    );
  }
  return value;
}

function withoutKeys(value: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const clone = { ...value };
  for (const key of keys) delete clone[key];
  return clone;
}

/** 변경이 있어 실제로 썼으면 true. */
export function writeIfChanged(
  path: string,
  next: Record<string, unknown>,
  ignoreKeys: readonly string[] = ['fetchedAt'],
): boolean {
  if (existsSync(path)) {
    try {
      const current = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
      if (stableStringify(withoutKeys(current, ignoreKeys)) === stableStringify(withoutKeys(next, ignoreKeys))) {
        return false;
      }
    } catch {
      // 기존 파일이 깨져 있으면 새로 쓴다.
    }
  }
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return true;
}
