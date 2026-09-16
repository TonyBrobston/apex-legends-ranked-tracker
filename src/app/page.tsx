import Link from "next/link";
import { getConfiguredAccounts } from "@/lib/accounts";
import { prisma } from "@/lib/prisma";
import { syncNowAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const configured = getConfiguredAccounts();

  const latestByAccount = await Promise.all(
    configured.map(async (account) => {
      const dbAccount = await prisma.account.findUnique({
        where: { platform_name: { platform: account.platform, name: account.name } },
        include: {
          snapshots: { orderBy: { capturedAt: "desc" }, take: 1 },
        },
      });
      return { account, snapshot: dbAccount?.snapshots[0] ?? null };
    })
  );

  return (
    <main>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Apex Ranked Tracker</h1>
        <form action={syncNowAction}>
          <button
            type="submit"
            className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm hover:bg-neutral-800"
          >
            Sync now
          </button>
        </form>
      </div>

      {configured.length === 0 ? (
        <p className="text-neutral-400">
          No accounts configured. Set the <code className="text-neutral-200">ACCOUNTS</code>{" "}
          environment variable, e.g. <code className="text-neutral-200">origin:MyName,psn:OtherName</code>.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
          {latestByAccount.map(({ account, snapshot }) => (
            <li key={`${account.platform}:${account.name}`}>
              <Link
                href={`/accounts/${account.platform}/${encodeURIComponent(account.name)}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900"
              >
                <div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">
                    {account.platform}
                  </div>
                </div>
                <div className="text-right text-sm text-neutral-400">
                  {snapshot ? (
                    <>
                      <div>
                        {snapshot.rankName}
                        {snapshot.rankDiv ? ` ${snapshot.rankDiv}` : ""}
                      </div>
                      <div className="text-xs">{snapshot.rankScore ?? "—"} RP</div>
                    </>
                  ) : (
                    <span>not synced yet</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
