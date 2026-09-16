import { syncAllAccounts } from "../lib/sync";
import { getConfiguredAccounts } from "../lib/accounts";

const POLL_INTERVAL_MINUTES = Number(process.env.POLL_INTERVAL_MINUTES ?? "15");

async function runOnce() {
  const startedAt = new Date().toISOString();
  const results = await syncAllAccounts();

  for (const result of results) {
    const label = `${result.account.platform}:${result.account.name}`;
    if (result.error) {
      console.error(`[poller] ${startedAt} ${label} failed: ${result.error}`);
    } else {
      console.log(`[poller] ${startedAt} ${label} synced ${result.matchesUpserted} matches`);
    }
  }
}

async function main() {
  const accounts = getConfiguredAccounts();
  console.log(
    `[poller] tracking ${accounts.length} account(s), polling every ${POLL_INTERVAL_MINUTES} minute(s)`
  );

  if (accounts.length === 0) {
    console.warn("[poller] ACCOUNTS is empty, nothing to do");
  }

  // Run immediately on boot, then on the configured interval.
  await runOnce();
  setInterval(runOnce, POLL_INTERVAL_MINUTES * 60 * 1000);
}

main().catch((err) => {
  console.error("[poller] fatal error", err);
  process.exit(1);
});
