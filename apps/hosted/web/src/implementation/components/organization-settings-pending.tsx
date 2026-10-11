import { usePageUrl } from "@executor-js/dashboard-start/page";
import { OrganizationMembersPending } from "./organization-members.tsx";
import type { ReactNode } from "react";
import { Skeleton } from "@executor-js/ui/components/skeleton";
import { PageFrame, PageHeader } from "@executor-js/ui/dashboard/page";

/** The page is named for its navigation link; the organization's name is a field on it. */
export const organizationSettingsTitle = "Settings";

/** A section's heading sits above its card, like the Members heading below. */
export const organizationSettingsHeadingClass = "text-[14px] font-medium";

/**
 * One raised card holds a section's settings as rows. Its own padding tops up the rows', so the
 * first and last controls sit as far from the card's top and bottom as from its sides.
 */
export const organizationSettingsCardClass =
  "organization-settings-card flex flex-col rounded-[12px] border border-border bg-muted px-4 py-1.5 [&_[data-slot='avatar-fallback']]:bg-accent";

/** Keep row geometry identical before and after the organization values arrive. */
export const organizationSettingRowClass =
  "organization-setting grid grid-cols-[minmax(0,1fr)_minmax(0,400px)] items-center gap-x-6 gap-y-2.5 py-2.5 [&:not(:first-child)]:border-t max-[740px]:grid-cols-1";

/** A row whose control is small keeps it beside the label at every width. */
export const organizationSettingCompactRowClass =
  "organization-setting grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 py-2.5 [&:not(:first-child)]:border-t";

/** A row's controls share one line. */
export const organizationSettingControlClass = "flex min-w-0 items-center gap-3";

/** A row names its setting; what just happened to it is reported beside the name. */
export function OrganizationSettingLabel({
  title,
  children,
}: {
  readonly title: string;
  readonly children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <h3 className="text-[14px] font-medium leading-[1.4]">{title}</h3>
      {children}
    </div>
  );
}

/** Render known settings copy and controls, with placeholders only for server values. */
export function OrganizationSettingsPending({ children }: { readonly children?: ReactNode }) {
  const page = usePageUrl();
  return (
    <PageFrame>
      <PageHeader title={organizationSettingsTitle} />
      <div
        className="organization-settings flex flex-col gap-3"
        role="status"
        aria-label="Loading organization settings"
      >
        <h2 className={organizationSettingsHeadingClass}>General</h2>
        <div className={organizationSettingsCardClass}>
          <div className={organizationSettingCompactRowClass}>
            <OrganizationSettingLabel title="Icon" />
            <Skeleton
              className="size-9 shrink-0 rounded-full"
              aria-label="Loading organization icon"
            />
          </div>
          <div className={organizationSettingRowClass}>
            <OrganizationSettingLabel title="Name" />
            <div className={organizationSettingControlClass}>
              <div className="flex h-9 min-w-0 flex-1 items-center rounded-md border border-input px-3 max-[740px]:min-h-11">
                <Skeleton className="h-3.5 w-36" aria-label="Loading name" />
              </div>
            </div>
          </div>
          <div className={organizationSettingRowClass}>
            <OrganizationSettingLabel title="URL" />
            <div className={organizationSettingControlClass}>
              <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-md border border-input">
                <span className="max-w-[60%] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap border-r border-input px-[10px] py-[7px] text-xs text-muted-foreground">
                  {page.host}/org/
                </span>
                <div className="flex h-8.5 min-w-0 flex-1 items-center px-3 max-[740px]:min-h-11">
                  <Skeleton
                    className="h-3.5 w-24 max-w-full"
                    aria-label="Loading organization URL"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {children}
        <span className="sr-only">Loading organization settings…</span>
      </div>
      <OrganizationMembersPending />
    </PageFrame>
  );
}
