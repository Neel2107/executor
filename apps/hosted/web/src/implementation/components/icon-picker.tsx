import { DisabledTooltip } from "@executor-js/ui/components/disabled-tooltip";
import { useRef, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Upload01Icon, Cancel01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@executor-js/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@executor-js/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@executor-js/ui/components/tooltip";

/** Shared file-picker view; its caller owns validation, draft state, and persistence. */
export function IconPicker({
  name,
  preview,
  label,
  disabled,
  disabledReason,
  onSelect,
  onRemove,
}: {
  readonly name: string;
  readonly preview: string | null;
  readonly label: string;
  readonly disabled: boolean;
  readonly disabledReason?: string | undefined;
  readonly onSelect: (file: File) => void | Promise<void>;
  readonly onRemove: () => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  return (
    <div className="group/icon-control relative w-fit shrink-0">
      <DisabledTooltip reason={disabledReason}>
        <button
          type="button"
          className="group/icon relative block size-11 cursor-pointer rounded-[10px] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 disabled:cursor-wait"
          aria-label={label}
          title={label}
          disabled={disabled || disabledReason !== undefined}
          onClick={() => picker.current?.click()}
        >
          <Avatar className="size-11 rounded-[10px] transition-opacity duration-120 group-hover/icon:opacity-0 group-focus-visible/icon:opacity-0">
            <AvatarImage src={preview ?? undefined} alt="" />
            <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span
            className="absolute inset-0 grid place-items-center rounded-[inherit] border border-dashed border-border bg-accent opacity-0 transition-opacity duration-120 group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100"
            aria-hidden
          >
            <HugeiconsIcon icon={Upload01Icon} size={20} strokeWidth={2} />
          </span>
        </button>
      </DisabledTooltip>
      <input
        ref={picker}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose image file"
        accept="image/png,image/jpeg,image/webp"
        disabled={disabled || disabledReason !== undefined}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file !== undefined) await onSelect(file);
        }}
      />
      {preview !== null && (
        <DisabledTooltip reason={disabledReason} className="absolute -top-[7px] -right-[7px]">
          <button
            type="button"
            className={`${disabledReason === undefined ? "absolute -top-[7px] -right-[7px] " : ""}pointer-events-none grid size-[22px] cursor-pointer place-items-center rounded-full border bg-background text-muted-foreground opacity-0 transition-opacity duration-120 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 group-hover/icon-control:pointer-events-auto group-hover/icon-control:opacity-100 group-focus-within/icon-control:pointer-events-auto group-focus-within/icon-control:opacity-100 [@media(hover:none)]:pointer-events-auto [@media(hover:none)]:opacity-100`}
            aria-label="Remove icon"
            title="Remove icon"
            disabled={disabled || disabledReason !== undefined}
            onClick={onRemove}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} strokeWidth={2} aria-hidden />
          </button>
        </DisabledTooltip>
      )}
    </div>
  );
}

/**
 * A settings row's icon. Hovering shows that it can be changed; a click offers the change or its
 * removal, or opens the file picker when there is no icon to remove. Its caller owns validation
 * and persistence.
 */
export function IconPickerMenu({
  name,
  preview,
  label,
  disabled,
  disabledReason,
  onSelect,
  onRemove,
}: {
  readonly name: string;
  readonly preview: string | null;
  readonly label: string;
  readonly disabled: boolean;
  readonly disabledReason?: string | undefined;
  readonly onSelect: (file: File) => void | Promise<void>;
  readonly onRemove: () => void | Promise<void>;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const locked = disabled || disabledReason !== undefined;
  const hint = preview === null ? "Upload icon" : "Change icon";
  const trigger = (
    <button
      type="button"
      className="group/icon relative block size-9 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-4 disabled:cursor-default"
      aria-label={label}
      disabled={locked}
      onClick={preview === null ? () => picker.current?.click() : undefined}
    >
      <Avatar className="size-9">
        <AvatarImage src={preview ?? undefined} alt="" />
        <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      {/* The icon stays visible under the pencil, and the open menu replaces the prompt. */}
      <span
        className="absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white opacity-0 transition-opacity duration-120 group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100 group-disabled/icon:opacity-0 group-aria-expanded/icon:opacity-0"
        aria-hidden
      >
        <HugeiconsIcon icon={Edit02Icon} size={16} strokeWidth={2} />
      </span>
    </button>
  );
  const hinted = (control: ReactNode) => (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{control}</TooltipTrigger>
        <TooltipContent side="left" sideOffset={6}>
          {hint}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
  return (
    <div className="relative w-fit shrink-0">
      {disabledReason !== undefined ? (
        <DisabledTooltip reason={disabledReason}>{trigger}</DisabledTooltip>
      ) : preview === null ? (
        hinted(trigger)
      ) : (
        <DropdownMenu>
          {hinted(<DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>)}
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onSelect={() => picker.current?.click()}>
              <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} aria-hidden />
              Change icon
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRemove}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} aria-hidden />
              Remove icon
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <input
        ref={picker}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose image file"
        accept="image/png,image/jpeg,image/webp"
        disabled={locked}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file !== undefined) await onSelect(file);
        }}
      />
    </div>
  );
}
