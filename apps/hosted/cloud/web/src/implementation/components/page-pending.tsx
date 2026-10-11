import { PagePending } from "@executor-js/hosted-web/page-pending";
import { PageSkeleton } from "@executor-js/ui/dashboard/loading";
import { useLocation } from "@tanstack/react-router";

export function BillingPagePending() {
  return <PageSkeleton title="Billing" />;
}

/** Cloud lazy pages add the billing page to the shared loading shapes. */
export function CloudPagePending() {
  const { pathname } = useLocation();
  if (/^\/org\/[^/]+\/billing\/?$/.test(pathname)) return <BillingPagePending />;
  return <PagePending />;
}
