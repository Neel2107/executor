import { usePageUrl } from "@executor-js/dashboard-start/page";
import {
  OrganizationSettingLabel,
  OrganizationSettingsPending,
  organizationSettingCompactRowClass,
  organizationSettingControlClass,
  organizationSettingRowClass,
  organizationSettingsCardClass,
  organizationSettingsHeadingClass,
  organizationSettingsTitle,
} from "../components/organization-settings-pending.tsx";
import { PageFrame, PageHeader } from "@executor-js/ui/dashboard/page";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import { Cause, Exit } from "effect";
import { useEffect, useState, type ReactNode } from "react";
import { IconPickerMenu } from "../components/icon-picker.tsx";
import {
  selectOrganizationIconAtom,
  OrganizationIconSelectionFailed,
  type SelectedOrganizationIcon,
} from "../../contracts/organization-icon.ts";
import { Button } from "@executor-js/ui/components/button";
import { Input } from "@executor-js/ui/components/input";
import {
  changeOrganizationSlugAtom,
  renameOrganizationAtom,
  changeOrganizationLogoAtom,
} from "../../contracts/organization.ts";
import {
  organizationError,
  useOrganization,
  OrganizationDetailsBoundary,
} from "../components/organization.tsx";
import { OrganizationMembers, type MemberLimit } from "../components/organization-members.tsx";
import { productTitle, useDocumentTitle } from "@executor-js/ui/hooks/document-title";
import { organizationSlugMaxLength } from "@executor-js/hosted-server/organization";

export type { MemberLimit };

/** Hosts may compose extra admin settings, a member limit and a footer below the members list. */
export function OrganizationPage({
  emailInvitations = false,
  memberLimit,
  children,
  footer,
}: {
  readonly emailInvitations?: boolean;
  readonly memberLimit?: MemberLimit | undefined;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
}) {
  return (
    <OrganizationDetailsBoundary
      pending={<OrganizationSettingsPending>{children}</OrganizationSettingsPending>}
    >
      <OrganizationSettings
        emailInvitations={emailInvitations}
        memberLimit={memberLimit}
        footer={footer}
      >
        {children}
      </OrganizationSettings>
    </OrganizationDetailsBoundary>
  );
}
function OrganizationSettings({
  emailInvitations,
  memberLimit,
  children,
  footer,
}: {
  readonly emailInvitations: boolean;
  readonly memberLimit: MemberLimit | undefined;
  readonly children?: ReactNode;
  readonly footer?: ReactNode;
}) {
  const organization = useOrganization();
  useDocumentTitle(productTitle(`${organization.name} settings`));
  return (
    <PageFrame>
      <PageHeader title={organizationSettingsTitle} />
      <div className="organization-settings flex flex-col gap-3">
        <h2 className={organizationSettingsHeadingClass}>General</h2>
        <div className={organizationSettingsCardClass}>
          <OrganizationIcon disabled={organization.checking} />
          <OrganizationName disabled={organization.checking} />
          <OrganizationUrl disabled={organization.checking} />
        </div>
        {children}
      </div>
      <OrganizationMembers emailInvitations={emailInvitations} memberLimit={memberLimit} />
      {footer && <div className="mt-6">{footer}</div>}
    </PageFrame>
  );
}

const adminOnly = "Only organization owners and admins can change organization settings.";

const savedNoticeMs = 2000;

/** A finished save is confirmed briefly, then the row is quiet again. */
function useSavedNotice() {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), savedNoticeMs);
    return () => clearTimeout(timer);
  }, [saved]);
  return [saved, setSaved] as const;
}

/** A row reports its own save beside its name, so nothing on the page moves when it finishes. */
function SettingStatus({ saving, saved }: { readonly saving: boolean; readonly saved: boolean }) {
  if (!saving && !saved) return null;
  return (
    <span
      role="status"
      className={`text-[12px] text-muted-foreground${saving ? "" : " animate-out fade-out-0 fill-mode-forwards delay-1500 duration-500"}`}
    >
      {saving ? "Saving…" : "Saved"}
    </span>
  );
}

/** A failed save is explained in the row that caused it. */
function SettingError({ children }: { readonly children: string }) {
  return (
    <p
      role="alert"
      className="auth-error col-span-full text-right text-[13px] text-destructive max-[740px]:text-left"
    >
      {children}
    </p>
  );
}

/** Choosing or removing an icon saves it; there is nothing else to confirm. */
function OrganizationIcon({ disabled }: { readonly disabled: boolean }) {
  const organization = useOrganization();
  const disabledReason = organization.role === "member" ? adminOnly : undefined;
  const save = useAtomSet(changeOrganizationLogoAtom(organization.organization), {
    mode: "promiseExit",
  });
  const saving = useAtomValue(changeOrganizationLogoAtom(organization.organization));
  const select = useAtomSet(selectOrganizationIconAtom(`settings:${organization.organization}`), {
    mode: "promiseExit",
  });
  const selection = useAtomValue(
    selectOrganizationIconAtom(`settings:${organization.organization}`),
  );
  // The chosen image shows at once and gives way to the stored one when the save settles.
  const [chosen, setChosen] = useState<{ readonly preview: string | null }>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useSavedNotice();
  const busy = selection.waiting || saving.waiting;
  const store = async (logo: SelectedOrganizationIcon["logo"] | null, preview: string | null) => {
    setChosen({ preview });
    const result = await save(logo);
    if (Exit.isFailure(result)) setError(organizationError(result.cause));
    else setSaved(true);
    setChosen(undefined);
  };
  return (
    <div className={organizationSettingCompactRowClass}>
      <OrganizationSettingLabel title="Icon">
        <SettingStatus saving={busy} saved={saved} />
      </OrganizationSettingLabel>
      <IconPickerMenu
        name={organization.name}
        preview={chosen === undefined ? (organization.logo ?? null) : chosen.preview}
        label="Upload organization icon"
        disabledReason={disabledReason}
        disabled={disabled || busy}
        onRemove={async () => {
          setError(undefined);
          setSaved(false);
          await store(null, null);
        }}
        onSelect={async (file) => {
          setError(undefined);
          setSaved(false);
          const result = await select(file);
          if (Exit.isSuccess(result)) await store(result.value.logo, result.value.preview);
          else {
            const failure = Cause.squash(result.cause);
            setError(
              failure instanceof OrganizationIconSelectionFailed
                ? failure.message
                : "This image could not be read. Choose another file.",
            );
          }
        }}
      />
      {error && <SettingError>{error}</SettingError>}
    </div>
  );
}

/** The name saves when the field is left or Enter is pressed. */
function OrganizationName({ disabled }: { readonly disabled: boolean }) {
  const organization = useOrganization();
  const disabledReason = organization.role === "member" ? adminOnly : undefined;
  const rename = useAtomSet(renameOrganizationAtom(organization.organization), {
    mode: "promiseExit",
  });
  const state = useAtomValue(renameOrganizationAtom(organization.organization));
  const [draft, setDraft] = useState<string>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useSavedNotice();
  const commit = async () => {
    if (draft === undefined || state.waiting) return;
    const next = draft.trim();
    // An organization always has a name, so an emptied field goes back to the saved one.
    if (next === "" || next === organization.name) {
      setDraft(undefined);
      return;
    }
    const result = await rename(next);
    if (Exit.isFailure(result)) setError(organizationError(result.cause));
    else {
      // Keep anything typed while the save was in flight.
      setDraft((current) => (current?.trim() === next ? undefined : current));
      setSaved(true);
    }
  };
  return (
    <form
      className={organizationSettingRowClass}
      onSubmit={async (event) => {
        event.preventDefault();
        await commit();
      }}
    >
      <OrganizationSettingLabel title="Name">
        <SettingStatus saving={state.waiting} saved={saved} />
      </OrganizationSettingLabel>
      <div className={organizationSettingControlClass}>
        <Input
          aria-label="Organization name"
          className="organization-name-input min-w-0 flex-1 bg-transparent shadow-none"
          value={draft ?? organization.name}
          onChange={(event) => {
            setDraft(event.target.value);
            setSaved(false);
            setError(undefined);
          }}
          onBlur={commit}
          maxLength={120}
          disabled={disabled}
          disabledReason={disabledReason}
        />
      </div>
      {error && <SettingError>{error}</SettingError>}
    </form>
  );
}

/**
 * The URL is the one setting that asks before it saves: links and agent connections that use the
 * old address stop working, so leaving the field must not be enough to change it.
 */
function OrganizationUrl({ disabled }: { readonly disabled: boolean }) {
  const organization = useOrganization();
  const disabledReason = organization.role === "member" ? adminOnly : undefined;
  const page = usePageUrl();
  const changeSlug = useAtomSet(changeOrganizationSlugAtom(organization.organization), {
    mode: "promiseExit",
  });
  const state = useAtomValue(changeOrganizationSlugAtom(organization.organization));
  const [draft, setDraft] = useState<string>();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useSavedNotice();
  const slug = draft ?? organization.slug;
  const moved = slug !== organization.slug;
  return (
    <form
      className={organizationSettingRowClass}
      onSubmit={async (event) => {
        event.preventDefault();
        if (disabled || disabledReason !== undefined || !moved) return;
        setError(undefined);
        setSaved(false);
        const result = await changeSlug(slug);
        if (Exit.isFailure(result)) setError(organizationError(result.cause));
        else {
          setDraft(undefined);
          setSaved(true);
        }
      }}
    >
      <OrganizationSettingLabel title="URL">
        <SettingStatus saving={state.waiting} saved={saved} />
      </OrganizationSettingLabel>
      <div className={organizationSettingControlClass}>
        <label className="organization-url-input flex min-w-0 flex-1 items-center border border-input rounded-md bg-transparent overflow-hidden focus-within:border-ring focus-within:[outline:2px_solid_var(--ring)] focus-within:outline-offset-[2px] [&_input]:h-8.5 [&_input]:border-0 [&_input]:rounded-none [&_input]:bg-transparent [&_input]:shadow-none [&_input]:[outline:none] [&_input:focus-visible]:[outline:none] [&_input:focus-visible]:shadow-none">
          <span
            className="organization-url-prefix shrink-0 max-w-[60%] py-[7px] px-[10px] border-r border-r-input text-muted-foreground text-[12px] overflow-hidden text-ellipsis whitespace-nowrap"
            aria-hidden
          >
            {page.host}/org/
          </span>
          <Input
            aria-label="Organization URL"
            value={slug}
            onChange={(event) => {
              setDraft(event.target.value);
              setSaved(false);
              setError(undefined);
            }}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            onInvalid={(event) => {
              // The browser only says the format is wrong; say what the format is instead.
              event.preventDefault();
              setSaved(false);
              setError("The URL can only use lowercase letters, numbers and hyphens.");
              event.currentTarget.focus();
            }}
            maxLength={organizationSlugMaxLength}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={disabled}
            disabledReason={disabledReason}
          />
        </label>
        {moved && (
          <Button variant="outline" loading={state.waiting} disabled={disabled}>
            Save
          </Button>
        )}
      </div>
      {error && <SettingError>{error}</SettingError>}
    </form>
  );
}
