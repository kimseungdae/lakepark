import { collectBids } from '../scripts/lib/collectBids.ts';
import { collectMarket } from '../scripts/lib/collectMarket.ts';
import { collectPopulation } from '../scripts/lib/collectPopulation.ts';
import { snapshotsEqual } from '../scripts/lib/writeIfChanged.ts';
import type { BidRadarSnapshot, PopulationSnapshot } from '../src/data/generated/types.ts';

/**
 * 공공데이터 자동 수집 — Vercel 서울 리전(icn1) 크론 함수.
 *
 * 국토부·조달청 API가 해외 IP를 차단해 GitHub Actions(미국 러너)에서는 수집이 불가능하다
 * (2026-08-13 실측). 그래서 서울 리전 서버리스에서 수집하고, 변경분을 GitHub Contents/Git
 * Data API로 단일 커밋한다 → 커밋이 Vercel 재배포를 트리거해 사이트가 갱신된다.
 *
 * 필요 환경변수: DATA_GO_KR_SERVICE_KEY, GH_CONTENTS_TOKEN(fine-grained PAT, Contents RW),
 * CRON_SECRET(설정 시 Vercel Cron이 Authorization 헤더로 자동 전달).
 */

const REPO = 'kimseungdae/lakepark';
const BRANCH = 'main';
const GH_API = 'https://api.github.com';

const FILES = {
  market: 'src/data/generated/market.json',
  bids: 'src/data/generated/bids.json',
  population: 'src/data/generated/population.json',
} as const;

async function gh(token: string, path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'lakepark-data-bot',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${path} — ${await response.text()}`);
  }
  return response.json();
}

async function readRepoJson(token: string, path: string): Promise<Record<string, unknown>> {
  const file = (await gh(token, `/repos/${REPO}/contents/${path}?ref=${BRANCH}`)) as { content: string };
  return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')) as Record<string, unknown>;
}

/** 변경 파일들을 Git Data API로 한 번에 커밋한다 (파일당 커밋 3개 대신 단일 커밋·단일 배포). */
async function commitFiles(
  token: string,
  files: Array<{ path: string; json: Record<string, unknown> }>,
  message: string,
): Promise<string> {
  const ref = (await gh(token, `/repos/${REPO}/git/ref/heads/${BRANCH}`)) as { object: { sha: string } };
  const parentSha = ref.object.sha;
  const parent = (await gh(token, `/repos/${REPO}/git/commits/${parentSha}`)) as { tree: { sha: string } };

  const tree = (await gh(token, `/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: parent.tree.sha,
      tree: files.map((file) => ({
        path: file.path,
        mode: '100644',
        type: 'blob',
        content: `${JSON.stringify(file.json, null, 2)}\n`,
      })),
    }),
  })) as { sha: string };

  const commit = (await gh(token, `/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [parentSha] }),
  })) as { sha: string };

  await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });
  return commit.sha;
}

/** Vercel Node 런타임 클래식 시그니처 (req/res). 웹 Request가 아니다. */
type NodeRequest = { headers: Record<string, string | string[] | undefined> };
type NodeResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body: string): void;
};

function json(res: NodeResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export default async function handler(req: NodeRequest, res: NodeResponse): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    json(res, 401, { error: 'unauthorized' });
    return;
  }

  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  const ghToken = process.env.GH_CONTENTS_TOKEN;
  if (!serviceKey || !ghToken) {
    json(res, 200, { skipped: true, reason: 'DATA_GO_KR_SERVICE_KEY 또는 GH_CONTENTS_TOKEN 미설정' });
    return;
  }

  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const summary: Record<string, string> = {};
  const changedFiles: Array<{ path: string; json: Record<string, unknown> }> = [];

  const [currentMarket, currentBids, currentPopulation] = await Promise.all([
    readRepoJson(ghToken, FILES.market),
    readRepoJson(ghToken, FILES.bids),
    readRepoJson(ghToken, FILES.population),
  ]);

  const results = await Promise.allSettled([
    collectMarket(serviceKey, today),
    collectBids(serviceKey, (currentBids as unknown as BidRadarSnapshot).bids ?? [], today),
    collectPopulation(serviceKey, currentPopulation as unknown as PopulationSnapshot, today),
  ]);

  const [marketResult, bidsResult, populationResult] = results;

  if (marketResult.status === 'fulfilled') {
    const next = marketResult.value as unknown as Record<string, unknown>;
    if (snapshotsEqual(currentMarket, next)) summary.market = 'unchanged';
    else {
      changedFiles.push({ path: FILES.market, json: next });
      summary.market = 'updated';
    }
  } else {
    summary.market = `failed: ${String(marketResult.reason).slice(0, 200)}`;
  }

  if (bidsResult.status === 'fulfilled') {
    const next = bidsResult.value as unknown as Record<string, unknown>;
    if (snapshotsEqual(currentBids, next)) summary.bids = 'unchanged';
    else {
      changedFiles.push({ path: FILES.bids, json: next });
      summary.bids = 'updated';
    }
  } else {
    summary.bids = `failed: ${String(bidsResult.reason).slice(0, 200)}`;
  }

  if (populationResult.status === 'fulfilled') {
    if (populationResult.value === null) summary.population = 'unchanged';
    else {
      changedFiles.push({ path: FILES.population, json: populationResult.value as unknown as Record<string, unknown> });
      summary.population = 'updated';
    }
  } else {
    summary.population = `failed: ${String(populationResult.reason).slice(0, 200)}`;
  }

  let commitSha: string | null = null;
  if (changedFiles.length > 0) {
    commitSha = await commitFiles(ghToken, changedFiles, `data: 공공데이터 자동 갱신 ${today}`);
  }

  json(res, 200, { today, summary, committed: commitSha });
}
