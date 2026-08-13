import { describe, expect, test } from 'vitest';
import { parseXmlItems, xmlResultCode, xmlTotalCount } from '../scripts/lib/xmlItems.ts';

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header><resultCode>000</resultCode><resultMsg>OK</resultMsg></header>
  <body>
    <items>
      <item>
        <aptNm>검단 A&amp;B</aptNm>
        <dealAmount>  66,270 </dealAmount>
        <dealYear>2026</dealYear><dealMonth>7</dealMonth><dealDay>3</dealDay>
        <umdNm>마전동</umdNm><floor>12</floor><excluUseAr>84.9</excluUseAr>
        <cdealType></cdealType>
      </item>
      <item>
        <aptNm>불로 단지</aptNm>
        <dealAmount>45,000</dealAmount>
        <dealYear>2026</dealYear><dealMonth>6</dealMonth><dealDay>21</dealDay>
        <umdNm>불로동</umdNm><floor>3</floor><excluUseAr>59.9</excluUseAr>
        <cdealType>O</cdealType><cdealDay>26.07.01</cdealDay>
      </item>
    </items>
    <totalCount>2</totalCount>
  </body>
</response>`;

describe('parseXmlItems', () => {
  test('item 블록을 레코드로 변환하고 트림·엔티티를 복원한다', () => {
    const items = parseXmlItems(FIXTURE);
    expect(items).toHaveLength(2);
    expect(items[0]?.aptNm).toBe('검단 A&B');
    expect(items[0]?.dealAmount).toBe('66,270');
    expect(items[1]?.cdealType).toBe('O');
  });

  test('item이 없으면 빈 배열', () => {
    expect(parseXmlItems('<response></response>')).toEqual([]);
  });
});

describe('xmlResultCode / xmlTotalCount', () => {
  test('결과 코드·총 건수를 읽는다', () => {
    expect(xmlResultCode(FIXTURE)).toEqual({ code: '000', message: 'OK' });
    expect(xmlTotalCount(FIXTURE)).toBe(2);
  });
});
