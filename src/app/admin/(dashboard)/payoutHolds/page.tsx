import { requireAdmin } from "@/lib/admin-auth";
import { listHolds } from "@/lib/payout-holds";
import { ADMIN_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import HoldListView from "@/components/desk/HoldListView";

/**
 * 보류 정산 — held worker wages to settle by hand. Takes over the generic
 * `/admin/payoutHolds` table (a static segment beats `[collection]`).
 */
export default async function PayoutHoldsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  // Gate the page itself — the layout renders concurrently.
  await requireAdmin();
  const { all } = await searchParams;
  const open = all !== "1";

  let holds;
  try {
    holds = await listHolds(open);
  } catch (e) {
    return <LoadError error={e} />;
  }

  return <HoldListView holds={holds} open={open} links={ADMIN_LINKS} />;
}
