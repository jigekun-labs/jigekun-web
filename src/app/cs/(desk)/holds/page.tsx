import { requireCs } from "@/lib/cs-auth";
import { listHolds } from "@/lib/payout-holds";
import { CS_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import HoldListView from "@/components/desk/HoldListView";

/** 보류 정산 — the same queue as /admin/payoutHolds, under the CS session. */
export default async function CsHoldsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string }>;
}) {
  // Gate the page itself — the layout renders concurrently.
  await requireCs();
  const { all } = await searchParams;
  const open = all !== "1";

  let holds;
  try {
    holds = await listHolds(open);
  } catch (e) {
    return <LoadError error={e} />;
  }

  return <HoldListView holds={holds} open={open} links={CS_LINKS} />;
}
