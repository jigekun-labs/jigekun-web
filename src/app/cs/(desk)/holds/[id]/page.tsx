import { notFound } from "next/navigation";
import { requireCs } from "@/lib/cs-auth";
import { fetchHold } from "@/lib/payout-holds";
import { CS_LINKS } from "@/lib/desk-links";
import LoadError from "@/components/admin/LoadError";
import HoldDetailView from "@/components/desk/HoldDetailView";
import { csResolveHoldAction } from "@/app/cs/hold-actions";

export default async function CsHoldPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCs();
  const { id } = await params;

  let data;
  try {
    data = await fetchHold(decodeURIComponent(id));
  } catch (e) {
    return <LoadError error={e} />;
  }
  if (!data) notFound();

  return (
    <HoldDetailView {...data} links={CS_LINKS} resolveAction={csResolveHoldAction} />
  );
}
