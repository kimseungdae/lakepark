import type { UnitTypeCode } from '../presets/geomdan-lakepark';
import type { InfoSource } from '../status/types';

/**
 * 타입별 구조 가이드 — docs/10-complex/type_and_layout_guide.md에서 큐레이션.
 *
 * 평면 이미지를 재배포하지 않는다는 원칙에 따라 방 개수·베이 같은 도면 정보는 싣지 않고,
 * 모집공고의 옵션·유의사항 문구에서 확인된 특징(confirmed)과
 * 그로부터 도출한 생활 관점(interpretation, 의견)을 분리해 담는다.
 * 면적·가격은 여기 저장하지 않는다 — GEOMDAN_LAKEPARK 프리셋에서 렌더 시 조회한다.
 */
export type UnitGuideEntry = {
  code: UnitTypeCode;
  /** 요약 카드에서 보이는 한 줄 */
  highlight: string;
  /** 공고·공식자료 문구에서 확인된 특징 */
  confirmed: string[];
  /** 확인된 문구에서 도출한 생활 관점 — 의견이므로 UI가 반드시 구분 표시 */
  interpretation: string[];
  source: InfoSource;
};

/** 두 공고의 옵션·유의사항 섹션 (AB23 기준 42~51쪽, AB22 동일 구성) */
const NOTICE_SOURCE: InfoSource = {
  asOf: '2026-06-12',
  label: '입주자모집공고 2026000194·2026000195 (옵션·추가선택품목)',
  url: '',
  confidence: 'confirmed',
  grade: 'A',
};

export const UNIT_GUIDE: Record<UnitTypeCode, UnitGuideEntry> = {
  '59A': {
    code: '59A',
    highlight: '안방 드레스룸 확장 여부와 ㄷ자형 프리미엄 키친이 핵심 선택지입니다.',
    confirmed: [
      '발코니 확장 시 안방 파우더·드레스룸 기본형과 드레스룸 확장형 중 무상 선택',
      '유상 올인원 드레스룸 선택 가능',
      '프리미엄 키친 선택 시 ㄷ자형 주방, 상판·후드·수전·인덕션 구성 변경',
      '59A 전용 와이드강마루·디자인월 가격이 별도 책정',
    ],
    interpretation: [
      '드레스룸 확장 여부가 안방 수납량과 화장대 사용성을 크게 바꿉니다.',
      '주방 고급화는 마감 변경이 아니라 조리 동선과 인덕션 구성이 달라지는 선택입니다.',
    ],
    source: NOTICE_SOURCE,
  },
  '59B': {
    code: '59B',
    highlight: '59A와 같은 무상 선택 구조지만 프리미엄 키친 금액과 수납 구성이 다릅니다.',
    confirmed: [
      '59A와 같은 안방 기본형/드레스룸 확장형 무상 선택 구조',
      '올인원 드레스룸, 건식화 다용도실, 프리미엄 키친 선택 가능',
      '59A와 프리미엄 키친 금액·세부 수납 구성이 다름',
    ],
    interpretation: [
      '59A와 59B는 방 개수만으로 비교하면 부족합니다 — 현관에서 거실까지 시선, 주방·다용도실 연결, 침실 문 간섭, 수납 깊이를 따로 비교해야 합니다.',
    ],
    source: NOTICE_SOURCE,
  },
  '84A': {
    code: '84A',
    highlight: '알파룸을 남길지, 대형 주방·다이닝으로 넓힐지가 핵심 교환입니다.',
    confirmed: [
      '프리미엄 키친 선택 시 알파룸까지 주방·다이닝으로 확장',
      '대면형 주방, 다이닝 장식장, 우물천장·간접조명·포인트천장 적용',
      '스타일링바스, 올인원 드레스룸, 안방·자녀방 붙박이장 선택 가능',
    ],
    interpretation: [
      '재택근무실·팬트리·놀이방이 필요한 가구는 프리미엄 키친 선택으로 사라지는 독립공간의 가치를 먼저 계산해야 합니다.',
    ],
    source: NOTICE_SOURCE,
  },
  '84B': {
    code: '84B',
    highlight: '공급면적이 다섯 타입 중 가장 크고, ㄷ자형 주방·전동 플랩 상부장 옵션이 있습니다.',
    confirmed: [
      '프리미엄 키친 선택 시 ㄷ자형 주방과 전동 플랩 상부장, 우물천장·간접조명 적용',
      '스타일링바스, 올인원 드레스룸, 건식화 다용도실 선택 가능',
      '공급면적은 다섯 타입 중 가장 큼',
    ],
    interpretation: [
      '전용·공급면적 차이를 "서비스면적이 넓다"로 단정하면 안 됩니다 — 실제 발코니·벽체·공용면적 구성은 승인도면과 실측이 필요합니다.',
    ],
    source: NOTICE_SOURCE,
  },
  '84C': {
    code: '84C',
    highlight: '수납특화(복도 팬트리·침실2 드레스룸) 선택이 방 활용을 좌우합니다.',
    confirmed: [
      '알파룸 수납특화 옵션으로 복도 팬트리와 침실2 드레스룸 구성',
      '프리미엄 키친에서 대면형 주방과 포인트천장 적용',
      '84C 전용 수납특화와 타입별 디자인월 금액 존재',
    ],
    interpretation: [
      '수납을 늘리는 대신 침실 가구 배치 벽면과 가용폭이 줄지 않는지 도면 치수를 확인해야 합니다.',
    ],
    source: NOTICE_SOURCE,
  },
};

/** 전 타입 공통 구조 체크 — 공고 유의사항 기반 */
export const COMMON_STRUCTURE_CHECKS: readonly string[] = [
  '실외기실 하향식 피난구 주변에는 피난 동선을 막는 물건을 둘 수 없습니다.',
  '승강기 샤프트 인접 침실은 운행 소음·진동 가능성을 확인합니다.',
  '세대 분전반과 통신단자함은 침실 벽체에 설치될 수 있습니다.',
  '음식물 중앙이송설비·청정환기·스마트홈은 유지관리와 앱·통신 조건을 함께 봅니다.',
  '가구·가전은 실제 벽 길이, 콘센트, 문 열림 반경, 걸레받이까지 실측 후 구매합니다.',
] as const;
