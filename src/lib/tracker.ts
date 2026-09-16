import type { Platform, TrackedAccount } from "./accounts";

const API_BASE = "https://public-api.tracker.gg/v2/apex/standard";

export interface NormalizedRank {
  rankName: string;
  rankDiv: number | null;
  rankScore: number | null;
  ladderPos: number | null;
}

export interface NormalizedMatch {
  matchId: string;
  playedAt: Date;
  legend: string | null;
  placement: number | null;
  kills: number | null;
  damage: number | null;
  rpChange: number | null;
  rankScoreAfter: number | null;
  rankName: string | null;
  rankDiv: number | null;
  raw: unknown;
}

class TrackerApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "TrackerApiError";
  }
}

function apiKey(): string {
  const key = process.env.TRACKER_API_KEY;
  if (!key) {
    throw new TrackerApiError("TRACKER_API_KEY is not set");
  }
  return key;
}

async function trackerFetch(path: string): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "TRN-Api-Key": apiKey() },
    // Always hit the live API; callers decide their own polling cadence.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TrackerApiError(
      `Tracker.gg request failed (${res.status}) for ${path}: ${body.slice(0, 300)}`,
      res.status
    );
  }

  return res.json();
}

/**
 * Pulls the first defined value out of an object for a list of candidate
 * dotted-path keys. Tracker.gg's public API has shifted field names across
 * versions, so field mapping here is defensive by design: verify against a
 * live response for your API key and extend the candidate lists below if a
 * value comes back null that you can see present in `raw`.
 */
function pick(obj: any, paths: string[]): any {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => acc?.[key], obj);
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function findSegment(segments: any[] | undefined, type: string): any {
  if (!Array.isArray(segments)) return undefined;
  return segments.find((s) => s?.type === type);
}

export async function fetchCurrentRank(account: TrackedAccount): Promise<NormalizedRank> {
  const json = await trackerFetch(
    `/profile/${account.platform}/${encodeURIComponent(account.name)}`
  );

  const overview = findSegment(json?.data?.segments, "overview") ?? json?.data?.segments?.[0];
  const stats = overview?.stats ?? {};

  return {
    rankName: pick(stats, ["rankScore.metadata.rankName", "rank.metadata.rankName"]) ?? "Unranked",
    rankDiv: pick(stats, ["rankScore.metadata.rankDivision", "rank.metadata.rankDivision"]) ?? null,
    rankScore: pick(stats, ["rankScore.value", "rank.value"]) ?? null,
    ladderPos: pick(stats, ["rankScore.percentile", "rank.percentile"]) ?? null,
  };
}

export async function fetchRecentMatches(account: TrackedAccount): Promise<NormalizedMatch[]> {
  const json = await trackerFetch(
    `/matches/${account.platform}/${encodeURIComponent(account.name)}`
  );

  const matches: any[] = json?.data ?? [];

  return matches.map((match): NormalizedMatch => {
    const overview = findSegment(match?.segments, "overview") ?? match?.segments?.[0];
    const stats = overview?.stats ?? {};
    const metadata = match?.metadata ?? {};

    const matchId =
      pick(match, ["attributes.id", "id"]) ?? `${account.platform}-${account.name}-${metadata.timestamp}`;

    const playedAtRaw = pick(metadata, ["timestamp", "dateCollected"]);

    return {
      matchId: String(matchId),
      playedAt: playedAtRaw ? new Date(playedAtRaw) : new Date(),
      legend: pick(metadata, ["legendName", "legend"]) ?? pick(overview, ["metadata.legendName"]) ?? null,
      placement: pick(stats, ["placement.value", "teamPlacement.value"]) ?? null,
      kills: pick(stats, ["kills.value"]) ?? null,
      damage: pick(stats, ["damage.value", "damageDealt.value"]) ?? null,
      rpChange: pick(stats, ["rankScore.metadata.rpChange", "rankScoreChange.value"]) ?? null,
      rankScoreAfter: pick(stats, ["rankScore.value"]) ?? null,
      rankName: pick(stats, ["rankScore.metadata.rankName"]) ?? null,
      rankDiv: pick(stats, ["rankScore.metadata.rankDivision"]) ?? null,
      raw: match,
    };
  });
}

export { TrackerApiError };
export type { Platform };
