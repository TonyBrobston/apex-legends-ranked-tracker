"use server";

import { revalidatePath } from "next/cache";
import { syncAllAccounts } from "@/lib/sync";

export async function syncNowAction() {
  await syncAllAccounts();
  revalidatePath("/");
  revalidatePath("/accounts", "layout");
}
