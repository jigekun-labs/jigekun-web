import { requireCs } from "@/lib/cs-auth";
import { countByStatus } from "@/lib/support-inquiries";
import { countHeld } from "@/lib/payout-holds";
import CsSidebar from "@/components/cs/CsSidebar";
import { csLogoutAction } from "../actions";

/**
 * The gate. Every desk page is a child of this layout, so an unauthorized
 * request never reaches a page that reads Firestore. Pages and actions still
 * check for themselves — layouts render concurrently with their pages.
 */
export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const email = await requireCs();

  // A failed count must not take the whole desk down; the pages report the
  // underlying error themselves.
  const [openInquiries, heldPayouts] = await Promise.all([
    countByStatus().then((c) => c.open, () => null),
    countHeld().catch(() => null),
  ]);

  return (
    <div className="flex min-h-screen">
      <CsSidebar
        email={email}
        badges={{ inquiries: openInquiries, holds: heldPayouts }}
        logout={csLogoutAction}
      />
      <main className="flex-1 min-w-0 bg-gray-50">{children}</main>
    </div>
  );
}
