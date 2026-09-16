import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getConfiguredAccounts, type Platform } from "@/lib/accounts";
import { syncAccount } from "@/lib/sync";

export const dynamic = "force-dynamic";

function formatRp(value: number | null) {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}`;
}

function rpColor(value: number | null) {
  if (value === null) return "text-neutral-400";
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-red-400";
  return "text-neutral-400";
}

export default async function AccountHistoryPage({
  params,
}: {
  params: Promise<{ platform: string; name: string }>;
}) {
  const resolvedParams = await params;
  const name = decodeURIComponent(resolvedParams.name);
  const platform = resolvedParams.platform;

  const isConfigured = getConfiguredAccounts().some(
    (a) => a.platform === platform && a.name === name
  );
  if (!isConfigured) {
    notFound();
  }

  const syncResult = await syncAccount({ platform: platform as Platform, name });

  const account = await prisma.account.findUnique({
    where: { platform_name: { platform, name } },
    include: {
      snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
      matches: { orderBy: { playedAt: "desc" }, take: 100 },
    },
  });

  if (!account) {
    notFound();
  }

  const latest = account.snapshots[0] ?? null;

  return (
    <main>
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← All accounts
      </Link>

      <div className="mt-2 mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{account.name}</h1>
          <div className="text-xs uppercase tracking-wide text-neutral-500">{account.platform}</div>
        </div>
        {latest && (
          <div className="text-right">
            <div className="text-lg font-medium">
              {latest.rankName}
              {latest.rankDiv ? ` ${latest.rankDiv}` : ""}
            </div>
            <div className="text-sm text-neutral-400">{latest.rankScore ?? "—"} RP</div>
          </div>
        )}
      </div>

      {syncResult.error && (
        <div className="mb-4 rounded-md border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
          Live sync failed, showing previously stored data: {syncResult.error}
        </div>
      )}

      {account.matches.length === 0 ? (
        <p className="text-neutral-400">
          No match history yet.
          {syncResult.error
            ? " The live sync above failed — fix the issue and reload this page."
            : " Data was just synced but the API returned no recent matches."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-900 text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Legend</th>
                <th className="px-3 py-2 font-medium">Placement</th>
                <th className="px-3 py-2 font-medium">Kills</th>
                <th className="px-3 py-2 font-medium">Damage</th>
                <th className="px-3 py-2 font-medium">RP</th>
                <th className="px-3 py-2 font-medium">Rank after</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {account.matches.map((match) => (
                <tr key={match.id} className="hover:bg-neutral-900/50">
                  <td className="px-3 py-2 text-neutral-400">
                    {match.playedAt.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{match.legend ?? "Unknown"}</td>
                  <td className="px-3 py-2">{match.placement ?? "—"}</td>
                  <td className="px-3 py-2">{match.kills ?? "—"}</td>
                  <td className="px-3 py-2">{match.damage ?? "—"}</td>
                  <td className={`px-3 py-2 font-medium ${rpColor(match.rpChange)}`}>
                    {formatRp(match.rpChange)}
                  </td>
                  <td className="px-3 py-2 text-neutral-400">
                    {match.rankName ?? "—"}
                    {match.rankDiv ? ` ${match.rankDiv}` : ""}
                    {match.rankScoreAfter !== null ? ` (${match.rankScoreAfter})` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
