import type { ImpactAnalysis } from './types';

/**
 * 생활영향 분석 콘텐츠.
 *
 * 편집자가 검수해 커밋하는 정적 콘텐츠다 — 자동 생성·자동 게시 금지.
 * 사실관계는 STATUS_BOARD·KB 문서 기준이며, 사실이 바뀌면 basisDate와 함께 갱신한다.
 * 시세·가격 서술 금지는 tests/analysis.test.ts의 금지어 검사가 강제한다.
 */
export const ANALYSES: readonly ImpactAnalysis[] = [
  {
    id: 'seoul-line5-extension',
    statusItemId: 'seoul-line5-extension',
    title: '서울5호선 연장, 내 출퇴근은 실제로 언제 바뀌나',
    summary:
      '예비타당성조사 통과(2026-03-10)는 중요한 관문이지만, 노선·역 위치·개통일은 전부 후속 절차에서 정해집니다. 입주 시점(2029년 말 예정)에 개통돼 있을 가능성은 낮게 보는 것이 현실적이며, 이 사업의 진짜 관전 포인트는 "기본계획 고시가 언제, 어떤 노선으로 나오느냐"입니다.',
    lifeImpacts: [
      {
        area: 'commute',
        current:
          '서울 방면은 인천1호선 검단 연장선(검단호수공원역, 2025-06 개통·운영 중)을 타고 환승하는 경로가 기본입니다.',
        after:
          '5호선이 검단까지 직결되면 서울 강서·마곡·여의도 방면 환승 횟수가 줄어듭니다. 다만 체감 폭은 우리 단지에서 신설역까지의 실제 거리(도보인지, 버스 연계인지)에 따라 크게 달라집니다.',
        when: '기본계획→설계→착공→개통 절차가 남아 있어 개통 시점은 미확정입니다. 입주 이후에도 수년간 진행될 사업으로 보는 것이 안전합니다.',
        confidence: 'estimated',
      },
      {
        area: 'daily',
        current: '광역 이동은 환승 저항이 있는 만큼, 생활권 내 이동(검단 안)은 버스·자가용 의존이 큽니다.',
        after:
          '신설역이 확정되면 역 중심으로 버스 노선이 개편되는 것이 일반적입니다. 역 위치에 따라 단지 앞 버스 연계가 좋아질 수도, 다른 생활권 중심으로 재편될 수도 있습니다.',
        when: '노선·정거장 위치 확정 발표 이후에 구체화됩니다.',
        confidence: 'estimated',
      },
    ],
    scenarios: {
      smooth: {
        assumption: '기본계획 고시와 설계가 순차 진행되고 사업비 분담 협의가 매듭지어진다.',
        life: '입주 후 몇 년 안에 착공 소식을 보고, 공사 기간을 지나 서울 직결 노선을 이용하게 됩니다. 입주 시점에는 아직 공사 전이거나 초기일 가능성이 높습니다.',
        signals: [
          '국토교통부·대도시권광역교통위원회 기본계획 고시',
          '노선·정거장 위치 확정 발표',
          '설계·감리 용역 발주 (나라장터 — 이 사이트 조달 레이더에 잡힙니다)',
        ],
      },
      delayed: {
        assumption: '김포·인천·서울 간 사업비 분담이나 노선 협의가 길어진다.',
        life: '입주 후에도 상당 기간 지금과 같은 경로(인천1·2호선 + 환승)를 유지하게 됩니다. 예타 통과 사업도 후속 절차에서 수년씩 지연된 전례가 많습니다.',
        signals: ['기본계획 일정 연기 보도', '정부 예산 미반영', '지자체 간 분담 협의 장기화 기사'],
      },
      reduced: {
        assumption: '협의 과정에서 노선이 조정되거나 정거장 계획이 바뀐다.',
        life: '검단 구간의 역 위치가 달라지면 단지에서의 체감 효과가 계획 대비 줄어들 수 있습니다. 이 경우 역까지의 버스 연계가 생활의 관건이 됩니다.',
        signals: ['노선 대안 발표', '정거장 수·위치 변경 보도', '검단 구간 계획 변경 고시'],
      },
    },
    residentActions: [
      {
        title: '기본계획 수립 단계에 주민 의견 제출하기',
        procedure:
          '철도 기본계획은 수립 과정에서 공청회·의견 수렴 절차를 거칩니다. 이 단계가 노선·정거장 위치에 의견이 반영될 수 있는 사실상 유일한 창구입니다. 고시 이후에는 바꾸기 어렵습니다.',
        channel: { label: '국민신문고 (국토교통부·대광위 앞)', url: 'https://www.epeople.go.kr' },
        difficulty: 'easy',
      },
      {
        title: '신설역 연계 버스 노선 신설·조정 건의',
        procedure:
          '시내버스 노선 신설·변경은 여객자동차 운수사업법에 따라 시가 수요를 검토해 결정합니다. 같은 내용의 민원이 여러 세대에서 접수되면 수요 근거가 됩니다.',
        channel: { label: '인천시 버스정책과 (국민신문고 경유)', url: 'https://www.epeople.go.kr' },
        difficulty: 'medium',
      },
      {
        title: '입주 후: 입주자대표회의 명의 공동 건의',
        procedure:
          '입주 후 구성되는 입주자대표회의 명의의 공문은 개별 민원보다 무게가 다릅니다. 2,857세대 규모는 교통 수요 근거로 유의미한 숫자입니다.',
        channel: { label: '검단구청', url: 'https://www.geomdan.go.kr' },
        difficulty: 'hard',
      },
    ],
    basisDate: '2026-08-13',
    sources: [
      {
        asOf: '2026-03-10',
        label: '국토교통부 예비타당성조사 통과 발표',
        url: 'https://www.molit.go.kr/USR/NEWS/m_71/dtl.jsp?id=95091771',
        confidence: 'confirmed',
        grade: 'B',
      },
      {
        asOf: '2025-06-28',
        label: '인천시 인천1호선 검단연장선 개통 안내',
        url: 'https://www.incheon.go.kr/IC010205/view?repSeq=DOM_0000000012620245',
        confidence: 'confirmed',
        grade: 'B',
      },
    ],
  },
  {
    id: 'museum-library',
    statusItemId: 'museum-library',
    title: '박물관·도서관, 입주하자마자 걸어갈 수 있을까',
    summary:
      '부지(문화공원3, 21,917㎡)와 사업기간(2019~2029)이 잡혀 있고 건설사업관리 용역이 2026-11~2029-06으로 예정돼 공사가 가시권입니다. 관건은 하나 — 준공을 넘어 "개관"이 입주(2029년 말 예정)와 맞물리느냐입니다. 준공과 개관 사이에는 장서·인력·운영 준비 기간이 더 필요합니다.',
    lifeImpacts: [
      {
        area: 'leisure',
        current: '개관 전에는 도서관·박물관 이용을 위해 기존 서구권 시설로 차량 이동해야 합니다.',
        after:
          '단지 인근 문화공원3 부지에 복합문화시설이 생기면 주말 도보 나들이(공원+도서관+박물관)가 한 코스로 묶입니다. 신도시에서 도보권 도서관은 생활 만족도를 크게 좌우하는 시설입니다.',
        when: '사업기간상 2029년이 목표이지만 준공이 곧 개관은 아니어서, 입주 직후에는 이용하지 못할 가능성도 열어둬야 합니다.',
        confidence: 'estimated',
      },
      {
        area: 'school',
        current: '아이 학습·방과후 활동 공간은 학교와 집 안으로 한정됩니다.',
        after:
          '어린이 열람실·문화 프로그램이 열리면 방과후·주말의 무료 학습 공간이 생깁니다. 개관 초기 프로그램 구성은 지금 단계의 수요 의견이 반영될 여지가 있습니다.',
        when: '개관 이후. 프로그램 윤곽은 운영 계획 수립 시점(개관 전 1년 안팎)에 드러납니다.',
        confidence: 'estimated',
      },
      {
        area: 'daily',
        current: '문화공원3 일대는 아직 공사 전 부지입니다.',
        after: '시설 개관과 함께 공원 일대의 야간 조명·보행 동선이 정비되면 저녁 산책 범위가 넓어집니다.',
        when: '시설 준공·공원 개방 이후.',
        confidence: 'estimated',
      },
    ],
    scenarios: {
      smooth: {
        assumption: '2026년 말 관리용역 개시에 이어 공사 발주·착공이 이어지고 공정이 유지된다.',
        life: '입주와 비슷한 시기에 개관 준비 소식을 듣고, 입주 초기부터 도보권 도서관을 이용합니다.',
        signals: [
          '공사 입찰공고 (조달 레이더 감시 대상)',
          '착공계·공정률 공개',
          '사서·운영 인력 채용 공고, 운영 조례 제정',
        ],
      },
      delayed: {
        assumption: '발주·공사 일정이 밀리거나 준공 후 개관 준비가 길어진다.',
        life: '입주 후 1~2년은 도서관 없는 생활권이 됩니다. 이 공백기가 검단 신도시 초기 입주민의 흔한 불편 사항이 될 수 있습니다.',
        signals: ['발주 일정 연기', '사업기간 변경 공시', '준공 후 개관 일정 미발표'],
      },
      reduced: {
        assumption: '예산 사정으로 시설 규모나 운영 프로그램이 축소된다.',
        life: '건물은 생겨도 열람석·프로그램·운영시간이 기대에 못 미칠 수 있습니다. 이 부분이야말로 개관 전 주민 의견이 실제로 움직일 수 있는 영역입니다.',
        signals: ['설계 변경 고시', '운영 예산 삭감 보도', '개관 프로그램 축소 발표'],
      },
    },
    residentActions: [
      {
        title: '개관 프로그램·운영시간 수요 의견 내기',
        procedure:
          '공공도서관 운영은 지자체 조례와 운영위원회가 정합니다. 개관 전 운영 계획 수립 시점에 이용 수요(어린이 열람실, 야간·주말 운영, 프로그램)를 제출하면 반영 여지가 가장 큽니다.',
        channel: { label: '국민신문고 (인천시·검단구 앞)', url: 'https://www.epeople.go.kr' },
        difficulty: 'easy',
      },
      {
        title: '어린이·유아 특화 공간 확충 건의',
        procedure:
          '검단은 영유아·학령기 인구 비중이 높은 생활권입니다. 인구 통계를 근거로 어린이 특화 공간을 요구하면 설득력이 있습니다 — 이 사이트의 인구 계기판 수치를 근거 자료로 쓸 수 있습니다.',
        channel: { label: '검단구청', url: 'https://www.geomdan.go.kr' },
        difficulty: 'medium',
      },
      {
        title: '단지—문화공원3 보행 동선 점검 요구',
        procedure:
          '시설이 생겨도 가는 길(횡단보도·조명·경사)이 불편하면 이용률이 떨어집니다. 사전점검·입주 시기에 실제 보행 동선을 확인하고 개선을 요구하는 것이 현실적입니다.',
        channel: { label: '검단구청', url: 'https://www.geomdan.go.kr' },
        difficulty: 'medium',
      },
    ],
    basisDate: '2026-08-13',
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
  },
] as const;
