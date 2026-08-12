export type PaymentKind =
  | 'downPayment'
  | 'interim'
  | 'balance'
  | 'optionDownPayment'
  | 'optionBalance';

export type PaymentEvent = {
  /** 납부일 (YYYY-MM-DD) */
  date: string;
  label: string;
  /** 해당 회차 납부 총액 */
  amount: number;
  kind: PaymentKind;
  /** 중도금 대출로 실행되는 금액 (내 통장에서 나가지 않는 부분) */
  loanAmount: number;
  /** 실제로 내 돈으로 내야 하는 금액 */
  cashAmount: number;
};

export type PaymentScheduleInput = {
  /**
   * 공고문상 공급금액(분양가)만. 발코니 확장비·유상옵션은 포함하지 않는다.
   * 계약금·중도금·잔금 비율은 모두 이 금액을 기준으로 계산되며,
   * 옵션은 아래 options에서 완전히 다른 일정으로 흐른다.
   */
  contractAmount: number;
  downPayment: {
    /** 공급금액 대비 계약금 총 비율 (예: 0.1) */
    totalRatio: number;
    /**
     * 계약금 분할 회차. amount를 지정하지 않은 회차가 나머지를 흡수한다.
     * 실제 공고문이 "1차 정액 + 2차 나머지" 형태로 쓰이는 것을 그대로 따른 것이다.
     */
    installments: Array<{ label: string; date: string; amount?: number }>;
  };
  interim: {
    /** 회차별 공급금액 대비 비율 (예: 0.1) */
    ratioEach: number;
    /**
     * 공고문에 적힌 그대로의 "중도금 대출 알선 비율" — 공급금액 대비 비율이다.
     * 중도금 총액보다 한도가 작으면 회차마다 균등하게 자납이 발생한다.
     */
    loanRatioOfContract: number;
    /** 회차별 납부일. 배열 길이가 곧 중도금 회차 수다. */
    dates: string[];
  };
  balance: { label: string; date: string };
  /**
   * 발코니 확장 + 유상옵션. 선택하지 않았으면 생략한다.
   * 모집공고 기준 옵션 계약 시 10%, 입주지정일에 90%를 내며 중도금 회차를 타지 않는다.
   */
  options?: {
    /** 발코니 확장비와 유상옵션을 합한 금액 */
    totalAmount: number;
    /** 옵션 계약 시 납부 비율 (예: 0.1) */
    downPaymentRatio: number;
    contractDate: string;
    balanceDate: string;
  };
};

export type PaymentScheduleResult = {
  events: PaymentEvent[];
  totals: {
    /** 분양대금(옵션 제외) */
    contractAmount: number;
    downPayment: number;
    interim: number;
    balance: number;
    /** 발코니 확장 + 유상옵션 합계. 분양대금과 별도로 집계한다. */
    options: number;
    /** 중도금 대출 실행 총액 — 잔금 시점에 상환하거나 주택담보대출로 전환해야 하는 금액 */
    interimLoan: number;
    /** 대출을 제외하고 실제로 마련해야 하는 현금 총액 (옵션 포함) */
    cash: number;
  };
};

/** 계약금 회차별 금액을 확정한다. 금액 미지정 회차는 남은 금액을 나눠 갖는다. */
function resolveDownPaymentAmounts(
  installments: PaymentScheduleInput['downPayment']['installments'],
  total: number,
): number[] {
  const fixedTotal = installments.reduce((acc, i) => acc + (i.amount ?? 0), 0);
  const unfixedCount = installments.filter((i) => i.amount === undefined).length;

  if (unfixedCount === 0) return installments.map((i) => i.amount ?? 0);

  const remainder = total - fixedTotal;
  const perUnfixed = Math.round(remainder / unfixedCount);

  let unfixedSeen = 0;
  return installments.map((i) => {
    if (i.amount !== undefined) return i.amount;
    unfixedSeen += 1;
    // 마지막 미지정 회차가 반올림 잔차를 흡수해 합계를 정확히 맞춘다.
    return unfixedSeen === unfixedCount ? remainder - perUnfixed * (unfixedCount - 1) : perUnfixed;
  });
}

/**
 * 계약금 → 중도금 → 잔금으로 이어지는 납부 일정을 만든다.
 *
 * 잔금은 비율이 아니라 "공급금액 − 기납부액"의 나머지로 계산한다.
 * 그래야 반올림 오차가 쌓여도 회차 합계가 공급금액과 원 단위까지 일치한다.
 */
export function buildPaymentSchedule(input: PaymentScheduleInput): PaymentScheduleResult {
  const { contractAmount } = input;

  const downPaymentTotal = Math.round(contractAmount * input.downPayment.totalRatio);
  const downPaymentAmounts = resolveDownPaymentAmounts(
    input.downPayment.installments,
    downPaymentTotal,
  );

  const downPaymentEvents: PaymentEvent[] = input.downPayment.installments.map((i, idx) => {
    const amount = downPaymentAmounts[idx] ?? 0;
    return { date: i.date, label: i.label, amount, kind: 'downPayment', loanAmount: 0, cashAmount: amount };
  });

  const interimEach = Math.round(contractAmount * input.interim.ratioEach);
  const interimTotal = interimEach * input.interim.dates.length;
  const loanCapacity = Math.round(contractAmount * input.interim.loanRatioOfContract);
  // 한도가 중도금 총액을 넘어도 중도금 이상은 빌릴 수 없다.
  const loanCoverage = interimTotal > 0 ? Math.min(1, loanCapacity / interimTotal) : 0;

  const interimEvents: PaymentEvent[] = input.interim.dates.map((date, idx) => {
    const loanAmount = Math.round(interimEach * loanCoverage);
    return {
      date,
      label: `중도금 ${idx + 1}차`,
      amount: interimEach,
      kind: 'interim',
      loanAmount,
      cashAmount: interimEach - loanAmount,
    };
  });

  const balanceAmount = contractAmount - downPaymentTotal - interimTotal;
  const balanceEvent: PaymentEvent = {
    date: input.balance.date,
    label: input.balance.label,
    amount: balanceAmount,
    kind: 'balance',
    loanAmount: 0,
    cashAmount: balanceAmount,
  };

  const optionEvents = buildOptionEvents(input.options);
  const optionsTotal = input.options && input.options.totalAmount > 0 ? input.options.totalAmount : 0;

  // 날짜가 같으면 분양대금 회차가 먼저 오도록 안정 정렬에 기대어 옵션을 뒤에 붙인다.
  const events = [...downPaymentEvents, ...interimEvents, balanceEvent, ...optionEvents].sort(
    (a, b) => a.date.localeCompare(b.date),
  );

  return {
    events,
    totals: {
      contractAmount,
      downPayment: downPaymentTotal,
      interim: interimTotal,
      balance: balanceAmount,
      options: optionsTotal,
      interimLoan: interimEvents.reduce((acc, e) => acc + e.loanAmount, 0),
      cash: events.reduce((acc, e) => acc + e.cashAmount, 0),
    },
  };
}

/**
 * 유상옵션 납부 이벤트를 만든다.
 * 옵션 잔금은 비율이 아니라 "옵션 총액 − 옵션 계약금"으로 계산해 반올림 잔차를 흡수한다.
 * 옵션은 중도금 대출 대상이 아니므로 항상 전액 자기부담이다.
 */
function buildOptionEvents(options: PaymentScheduleInput['options']): PaymentEvent[] {
  if (!options || options.totalAmount <= 0) return [];

  const downPayment = Math.round(options.totalAmount * options.downPaymentRatio);
  const balance = options.totalAmount - downPayment;

  return [
    {
      date: options.contractDate,
      label: '옵션 계약금',
      amount: downPayment,
      kind: 'optionDownPayment',
      loanAmount: 0,
      cashAmount: downPayment,
    },
    {
      date: options.balanceDate,
      label: '옵션 잔금',
      amount: balance,
      kind: 'optionBalance',
      loanAmount: 0,
      cashAmount: balance,
    },
  ];
}
