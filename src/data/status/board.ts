import type { StatusItem } from './types';

/**
 * 개발계획 상태판 데이터.
 *
 * docs/30-location-outlook/의 상태판 문서와 docs/00-meta/source_registry.md에서
 * 큐레이션했다 (2026-08-11 확인 기준). 원문 장문을 복제하지 않고 요약·출처만 담는다.
 * 값을 갱신할 때는 lastChecked와 history를 함께 갱신할 것.
 */
export const STATUS_BOARD: readonly StatusItem[] = [
  // ── 교통 ──────────────────────────────────────────────
  {
    id: 'incheon-line1-geomdan',
    title: '인천1호선 검단 연장 (검단호수공원역)',
    category: 'transport',
    stage: '확정',
    lifecycle: 7,
    summary: '검단호수공원역 포함 연장선이 2025-06-28 개통해 운영 중입니다.',
    caution: '단지 출입구에서 역까지 실제 보행시간은 홍보 거리가 아닌 현장 측정으로 확인해야 합니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2025-06-28',
        label: '인천시 검단연장선 개통 안내',
        url: 'https://www.incheon.go.kr/IC010205/view?repSeq=DOM_0000000012620245',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2025-06-28', summary: '검단호수공원역 포함 3개 역 영업 개시', stage: '확정' },
    ],
  },
  {
    id: 'seoul-line5-extension',
    title: '서울5호선 김포·검단 연장',
    category: 'transport',
    stage: '추진',
    lifecycle: 1,
    summary: '2026-03-10 예비타당성조사를 통과해 기본계획 등 후속 절차 단계입니다.',
    caution:
      '예타 통과는 개통·역 위치·개통일 확정이 아닙니다. 노선·사업비는 후속 절차에서 변경될 수 있습니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-03-10',
        label: '국토교통부 예비타당성조사 통과 발표',
        url: 'https://www.molit.go.kr/USR/NEWS/m_71/dtl.jsp?id=95091771',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2026-03-10', summary: '예비타당성조사 통과 발표', stage: '추진' },
    ],
  },
  {
    id: 'gtx-d',
    title: 'GTX-D / 서부권 광역급행철도',
    category: 'transport',
    stage: '계획',
    lifecycle: 1,
    summary: '국가·지자체가 광역철도 확충 대상으로 추진·검토 중인 계획 단계입니다.',
    caution:
      '기관·시기별로 노선안과 명칭이 달라 특정 역 정차와 개통시점을 확정 사실로 볼 수 없습니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-03-12',
        label: '인천시 검단 광역철도 사업현황',
        url: 'https://www.incheon.go.kr/IC010205/view?repSeq=DOM_0000000014331123&repDt=2026-03-12',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      {
        date: '2026-03-12',
        summary: '인천시가 서부권 광역급행철도·인천2호선 고양연장을 추진 단계로 설명',
      },
    ],
  },
  {
    id: 'geomdan-road-network',
    title: '검단 도로망 16개 사업',
    category: 'transport',
    stage: '추진',
    summary:
      '40.73km·1조6,137억원 규모 16개 사업이 순차 개통 계획이며, 검단–드림로는 2026-04 개통했습니다.',
    caution: '개별 도로의 실제 개통일이 서로 다르고, 시간 단축 효과는 기관 예측값입니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-04-10',
        label: '인천시 검단 도로망 16개 사업 발표',
        url: 'https://www.incheon.go.kr/IC010205/view?repDt=2026-04-10&repSeq=DOM_0000000014522218',
        confidence: 'confirmed',
        grade: 'B',
      },
      {
        asOf: '2026-04-08',
        label: '검단–드림로 개통 안내',
        url: 'https://www.incheon.go.kr/IC010205/view?repDt=2026-04-02&repSeq=DOM_0000000014462850',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2026-04-10', summary: '16개 사업(40.73km) 연도별 개통 계획 발표' },
      { date: '2026-04-08', summary: '검단–드림로(3.59km·왕복4차로) 개통' },
    ],
  },

  // ── 개발 ──────────────────────────────────────────────
  {
    id: 'worabael-village',
    title: '워라밸빌리지',
    category: 'development',
    stage: '추진',
    lifecycle: 4,
    summary:
      '중앙호수공원 남서측 복합 특화구역. 2025-08 토지매매계약이 완료됐고 전체 사업은 2031년 완료 목표입니다.',
    caution:
      '계약 완료는 시설 준공이 아닙니다. 시설별 착공·준공은 별도 확인이 필요하며, 면적은 공모자료(약 25만㎡)와 계약자료(162,968㎡)가 달라 최신 계약자료를 기준으로 합니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2025-09-01',
        label: 'iH 워라밸빌리지 토지매매계약 체결',
        url: 'https://newsletter.ih.co.kr/main/bbs/bbsMsgDetail.do?bcd=idtc_press&msg_seq=2203&pgno=16',
        confidence: 'confirmed',
        grade: 'B',
      },
      {
        asOf: '2024-11-14',
        label: 'iH 민간사업자 공모 평가 결과',
        url: 'https://www.ih.co.kr/main/bbs/bbsMsgDetail.do?bcd=notice&msg_seq=3864',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      {
        date: '2025-09-01',
        summary: '토지매매계약 체결 (162,968㎡, 총사업비 약 2.4조원, 전체 2031년 목표)',
      },
      { date: '2024-11-14', summary: '민간사업자 공모 평가 완료' },
    ],
  },
  {
    id: 'next-complex',
    title: '넥스트콤플렉스',
    category: 'development',
    stage: '추진',
    summary:
      '부지 50,468.5㎡ 복합개발로 사업기간은 2020~2032년이며, 일부 판매시설 분양이 진행 중입니다.',
    caution: '계획시설(영화관·서점 등)과 실제 확정·입점 시설을 구분해야 합니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-08-11',
        label: 'iH 넥스트콤플렉스 사업현황',
        url: 'https://www.ih.co.kr/main/land/landDetail.do?land_seq=19&pgno=1',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2026-08-11', summary: '일부 판매시설 분양 진행 확인 (사업기간 2020~2032)' },
    ],
  },
  {
    id: 'geomdan-stage5',
    title: '검단신도시 5단계 조성',
    category: 'development',
    stage: '추진',
    lifecycle: 5,
    summary: '택지개발 1~4단계는 준공됐고, 5단계(240만㎡·주택 16개 블록)는 2026년 준공 추진 중입니다.',
    caution: '기관별 자료의 단계 표현 범위가 다릅니다 (전체 7단계 설명 vs 5단계까지 연도 제시).',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-03-24',
        label: '인천시 검단신도시 5단계 사업계획 승인',
        url: 'https://www.incheon.go.kr/IC010205/view?repDt=2026-03-24&repSeq=DOM_0000000014394792',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2026-03-24', summary: '5단계 사업계획 승인 — 1~4단계 완료, 5단계 2026년 준공 추진' },
    ],
  },
  {
    id: 'geomdan2-industrial',
    title: '검단2일반산업단지',
    category: 'development',
    stage: '추진',
    lifecycle: 5,
    summary: '2026-03-20 착공했고 2030년 하반기 준공 목표입니다.',
    caution: '기업 입주와 교통 영향은 준공 이후 실제 운영 단계에서 확인해야 합니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-08-11',
        label: 'iH 검단2일반산업단지 사업현황',
        url: 'https://www.ih.co.kr/main/land/landDetail.do?landDiv=1110&land_seq=9&viewType=gallery',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [{ date: '2026-03-20', summary: '착공 (2030년 하반기 준공 목표)', stage: '추진' }],
  },

  // ── 공원·수변 ─────────────────────────────────────────
  {
    id: 'najinpo-stream',
    title: '나진포천 생태하천·친수공간',
    category: 'park',
    stage: '추진',
    lifecycle: 3,
    summary: '조달 공사자료 기준 1.86km 구간, 착공 후 23개월 공사 계획입니다.',
    caution: '실제 착공일이 확인되지 않았습니다. 착공·공정·산책로 개방 구간을 추적 중입니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-08-11',
        label: '나라장터 나진포천 5단계 조달 공사자료',
        url: 'https://www.g2b.go.kr/pn/pnp/pnpe/UntyAtchFile/downloadFile.do?bidPbancNo=R26BK01443755&bidPbancOrd=000&fileSeq=3&fileType=&prcmBsneSeCd=07',
        confidence: 'confirmed',
        grade: 'A',
      },
    ],
    history: [
      {
        date: '2026-08-11',
        summary: '조달 공사자료 확인 — 1.86km, 착공 후 23개월 계획 (실제 착공일 미확인)',
      },
    ],
  },
  {
    id: 'central-lake-park',
    title: '중앙호수공원',
    category: 'park',
    stage: '계획',
    lifecycle: 1,
    summary: '단지 인근 예정부지로 도시·특화계획에 포함된 계획 단계입니다.',
    caution: '완공 범위·시점·운영시설이 미확정입니다. 공사 발주와 개방 구간을 추적해야 합니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-08-11',
        label: 'iH 검단신도시 토지이용계획',
        url: 'https://land.ih.co.kr/open_content/sub/geomdan/chart.jsp',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [{ date: '2026-08-11', summary: '토지이용계획 포함 확인 (공사 발주 미확인)' }],
  },

  // ── 문화 ──────────────────────────────────────────────
  {
    id: 'museum-library',
    title: '검단 박물관·도서관 복합문화시설',
    category: 'culture',
    stage: '추진',
    lifecycle: 3,
    summary:
      '문화공원3 부지 21,917㎡, 사업기간 2019~2029. 건설사업관리 용역이 2026-11~2029-06으로 예정돼 있습니다.',
    caution: '관리용역 공고는 착공이 아닙니다. 2029년 내 개관 여부가 입주 시점의 관건입니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-05-29',
        label: 'iH 건설사업관리 용역 배치계획',
        url: 'https://www.ih.co.kr/main/bbs/bbsMsgDetail.do?bcd=notice&msg_seq=4301&pgdiv=other&pgno=358',
        confidence: 'confirmed',
        grade: 'B',
      },
      {
        asOf: '2026-08-11',
        label: 'iH 사업목록 (문화공원3)',
        url: 'https://www.ih.co.kr/main/land/landList.do?landDiv=1120&viewType=gallery&work=2',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2026-05-29', summary: '건설사업관리 용역 배치계획 공고 (용역기간 2026-11~2029-06 예정)' },
    ],
  },

  // ── 교육 ──────────────────────────────────────────────
  {
    id: 'geomdan-schools',
    title: '검단구 학교 신설·통학구역',
    category: 'education',
    stage: '계획',
    summary:
      '2026년 검단구 학교 3곳 개교, 2027~2030년 추가 설립 계획. 2027학년도에 중학교 제10학교군·고교 제6학교군이 신설됩니다.',
    caution:
      '초등 통학구역은 입주 전에 지정되며 교육청 학생배치계획에 따라 변경될 수 있습니다. 홍보물의 "단지 앞 학교" 표현으로 배정을 단정할 수 없습니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-08-11',
        label: '인천교육청 검단신도시 학교 설립 현황',
        url: 'https://www.ice.go.kr/ice/cm/cntnts/cntntsView.do?cntntsId=1238&mi=11868',
        confidence: 'confirmed',
        grade: 'B',
      },
      {
        asOf: '2026-08-11',
        label: '2027학년도 검단구 중·고 학교군 신설 안내',
        url: 'https://www.ice.go.kr/ice/na/ntt/selectNttInfo.do?mi=10840&nttSn=3362030',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2026-08-11', summary: '2026년 학교 3곳 개교·2027~2030 추가 설립 계획 확인' },
      { date: '2026-08-11', summary: '2027학년도 중학교 제10학교군·고교 제6학교군 신설 확인' },
    ],
  },

  // ── 행정 ──────────────────────────────────────────────
  {
    id: 'geomdan-gu',
    title: '검단구 출범·신청사',
    category: 'admin',
    stage: '확정',
    summary: '검단구가 2026-07-01 공식 출범해 임시청사에서 행정서비스를 운영 중입니다.',
    caution:
      '신청사는 주민협의 단계로 착공 전입니다. 단지의 최종 도로명주소·행정동은 입주 전 재확인이 필요합니다.',
    lastChecked: '2026-08-11',
    sources: [
      {
        asOf: '2026-07-01',
        label: '검단구 공식 출범 안내',
        url: 'https://www.geomdan.go.kr/main/bbs/bbsMsgDetail.do?bcd=report&msg_seq=4',
        confidence: 'confirmed',
        grade: 'B',
      },
      {
        asOf: '2026-08-06',
        label: '검단구 신청사 주민설명회',
        url: 'https://www.geomdan.go.kr/headman/bbs/bbsMsgDetail.do?bcd=head_photo9th&msg_seq=48',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
    history: [
      { date: '2026-08-06', summary: '신청사 주민설명회 개최 (주민협의 단계)' },
      { date: '2026-07-01', summary: '검단구 공식 출범, 임시청사 행정서비스 시작', stage: '확정' },
    ],
  },
] as const;
