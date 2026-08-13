/**
 * 실거래가 API의 평면 XML 응답 파서 (순수 함수 — vitest 대상).
 * 응답 구조가 <item><태그>값</태그>…</item> 반복의 단순 평면이라
 * XML 라이브러리 없이 정규식으로 안전하게 다룰 수 있다.
 */

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
};

function decodeEntities(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITY_MAP[entity] ?? entity);
}

/** <item> 블록들을 { 태그: 값 } 레코드 배열로 변환한다. 값은 트림·엔티티 복원. */
export function parseXmlItems(xml: string): Array<Record<string, string>> {
  const items: Array<Record<string, string>> = [];

  for (const [, body] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const record: Record<string, string> = {};
    for (const [, tag, raw] of body!.matchAll(/<(\w+)>([\s\S]*?)<\/\1>/g)) {
      record[tag!] = decodeEntities(raw!.trim());
    }
    items.push(record);
  }
  return items;
}

/** 공공데이터포털 표준 응답 코드. '00' 또는 '000'이 정상이다. */
export function xmlResultCode(xml: string): { code: string; message: string } {
  const code = xml.match(/<resultCode>\s*([^<]*?)\s*<\/resultCode>/)?.[1] ?? '';
  const message = xml.match(/<resultMsg>\s*([^<]*?)\s*<\/resultMsg>/)?.[1] ?? '';
  return { code, message };
}

export function xmlTotalCount(xml: string): number {
  return Number(xml.match(/<totalCount>\s*(\d+)\s*<\/totalCount>/)?.[1] ?? 0);
}
