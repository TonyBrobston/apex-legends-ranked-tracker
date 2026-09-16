import { prisma } from "./prisma";
import { getConfiguredAccounts, type TrackedAccount } from "./accounts";
import { fetchCurrentRank, fetchRecentMatches } from "./tracker";

async function getOrCreateAccount(account: TrackedAccount) {
  return prisma.account.upsert({
    where: { platform_name: { platform: account.platform, name: account.name } },
    update: {},
    create: { platform: account.platform, name: account.name },
  });
}

export async function syncAccount(account: TrackedAccount): Promise<{
  account: TrackedAccount;
  matchesUpserted: number;
  error?: string;
}> {
  try {
    const dbAccount = await getOrCreateAccount(account);

    const rank = await fetchCurrentRank(account);
    await prisma.rankSnapshot.create({
      data: {
        accountId: dbAccount.id,
        rankName: rank.rankName,
        rankDiv: rank.rankDiv,
        rankScore: rank.rankScore,
        ladderPos: rank.ladderPos,
      },
    });

    const matches = await fetchRecentMatches(account);
    let matchesUpserted = 0;
    for (const match of matches) {
      await prisma.match.upsert({
        where: { accountId_matchId: { accountId: dbAccount.id, matchId: match.matchId } },
        update: {
          legend: match.legend,
          placement: match.placement,
          kills: match.kills,
          damage: match.damage,
          rpChange: match.rpChange,
          rankScoreAfter: match.rankScoreAfter,
          rankName: match.rankName,
          rankDiv: match.rankDiv,
          raw: match.raw as any,
        },
        create: {
          accountId: dbAccount.id,
          matchId: match.matchId,
          playedAt: match.playedAt,
          legend: match.legend,
          placement: match.placement,
          kills: match.kills,
          damage: match.damage,
          rpChange: match.rpChange,
          rankScoreAfter: match.rankScoreAfter,
          rankName: match.rankName,
          rankDiv: match.rankDiv,
          raw: match.raw as any,
        },
      });
      matchesUpserted += 1;
    }

    return { account, matchesUpserted };
  } catch (err) {
    return {
      account,
      matchesUpserted: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function syncAllAccounts() {
  const accounts = getConfiguredAccounts();
  const results = [];
  for (const account of accounts) {
    // Sequential on purpose to stay well under the API's rate limits.
    results.push(await syncAccount(account));
  }
  return results;
}
