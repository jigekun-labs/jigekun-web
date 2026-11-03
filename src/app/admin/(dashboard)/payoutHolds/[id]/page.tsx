import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchHold } from "@/lib/payout-holds";
import { ADMIN_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import HoldDetailView from "@/components/desk/HoldDetailView";
import { resolveHoldAction } from "@/app/admin/hold-actions";

export default async function PayoutHoldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let data;
  try {
    data = await fetchHold(decodeURIComponent(id));
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!data) notFound();

  return (
    <HoldDetailView {...data} links={ADMIN_LINKS} resolveAction={resolveHoldAction} />
  );
}
