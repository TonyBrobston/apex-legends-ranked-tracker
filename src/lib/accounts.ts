export type Platform = "origin" | "psn" | "xbl";

export interface TrackedAccount {
  platform: Platform;
  name: string;
}

const VALID_PLATFORMS: Platform[] = ["origin", "psn", "xbl"];

/**
 * ACCOUNTS is set in docker-compose as a comma-separated list of
 * "platform:accountName" pairs, e.g.:
 *   ACCOUNTS=origin:IITzTimmyy,psn:SomePlayer,xbl:AnotherPlayer
 * platform is one of: origin (PC - also covers Steam, since Apex PC accounts
 * are EA/Origin accounts regardless of storefront), psn (PlayStation),
 * xbl (Xbox). accountName is the EA/Origin display name, not a Steam
 * username.
 */
export function getConfiguredAccounts(): TrackedAccount[] {
  const raw = process.env.ACCOUNTS ?? "";

  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [platformRaw, ...nameParts] = entry.split(":");
      const platform = platformRaw?.trim().toLowerCase() as Platform;
      const name = nameParts.join(":").trim();

      if (!VALID_PLATFORMS.includes(platform) || !name) {
        throw new Error(
          `Invalid ACCOUNTS entry "${entry}". Expected format "platform:accountName" with platform one of ${VALID_PLATFORMS.join(
            ", "
          )}.`
        );
      }

      return { platform, name };
    });
}

export function accountSlug(account: TrackedAccount): string {
  return `${account.platform}/${encodeURIComponent(account.name)}`;
}
