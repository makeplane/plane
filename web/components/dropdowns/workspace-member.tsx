import { Fragment, ReactNode, useState } from "react";
import { observer } from "mobx-react-lite";
import { Combobox } from "@headlessui/react";
import { usePopper } from "react-popper";
import { Placement } from "@popperjs/core";
import { Check, ChevronDown, Search } from "lucide-react";
// hooks
import { useMember } from "hooks/store";
// icons
import { Avatar, AvatarGroup, UserGroupIcon } from "@plane/ui";
// helpers
import { cn } from "helpers/common.helper";
// types
import { TButtonVariants } from "./types";

type Props = {
  button?: ReactNode;
  buttonClassName?: string;
  buttonVariant: TButtonVariants;
  className?: string;
  disabled?: boolean;
  dropdownArrow?: boolean;
  placeholder?: string;
  placement?: Placement;
} & (
  | {
      multiple: false;
      onChange: (val: string | null) => void;
      value: string | null;
    }
  | {
      multiple: true;
      onChange: (val: string[]) => void;
      value: string[];
    }
);

type ButtonProps = {
  className?: string;
  placeholder: string;
  hideText?: boolean;
  userIds: string | string[] | null;
};

const ButtonAvatars = observer(({ userIds }: { userIds: string | string[] | null }) => {
  const { getUserDetails } = useMember();

  if (Array.isArray(userIds)) {
    if (userIds.length > 0)
      return (
        <AvatarGroup size="md">
          {userIds.map((userId) => {
            const userDetails = getUserDetails(userId);

            if (!userDetails) return;
            return <Avatar key={userId} src={userDetails.avatar} name={userDetails.display_name} />;
          })}
        </AvatarGroup>
      );
  } else {
    if (userIds) {
      const userDetails = getUserDetails(userIds);
      return <Avatar src={userDetails?.avatar} name={userDetails?.display_name} size="md" />;
    }
  }

  return <UserGroupIcon className="h-3 w-3 flex-shrink-0" />;
});

const BorderButton = observer((props: ButtonProps) => {
  const { className, hideText = false, placeholder, userIds } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isMultiple = Array.isArray(userIds);

  return (
    <div
      className={cn(
        "h-full flex items-center gap-1 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded text-xs px-2 py-0.5",
        className
      )}
    >
      <ButtonAvatars userIds={userIds} />
      {!hideText && (
        <span className="flex-grow truncate">
          {userIds ? (isMultiple ? userIds?.length ?? "Cycle" : getUserDetails(userIds)?.display_name) : placeholder}
        </span>
      )}
    </div>
  );
});

const BackgroundButton = observer((props: ButtonProps) => {
  const { className, hideText = false, placeholder, userIds } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isMultiple = Array.isArray(userIds);

  return (
    <div
      className={cn("h-full flex items-center gap-1 rounded text-xs px-2 py-0.5 bg-custom-background-80", className)}
    >
      <ButtonAvatars userIds={userIds} />
      {!hideText && (
        <span className="flex-grow truncate">
          {userIds ? (isMultiple ? userIds?.length ?? "Cycle" : getUserDetails(userIds)?.display_name) : placeholder}
        </span>
      )}
    </div>
  );
});

const TransparentButton = observer((props: ButtonProps) => {
  const { className, hideText = false, placeholder, userIds } = props;
  // store hooks
  const { getUserDetails } = useMember();

  const isMultiple = Array.isArray(userIds);

  return (
    <div
      className={cn(
        "h-full flex items-center gap-1 rounded text-xs px-2 py-0.5 hover:bg-custom-background-80",
        className
      )}
    >
      <ButtonAvatars userIds={userIds} />
      {!hideText && (
        <span className="flex-grow truncate">
          {userIds ? (isMultiple ? userIds?.length ?? "Cycle" : getUserDetails(userIds)?.display_name) : placeholder}
        </span>
      )}
    </div>
  );
});

export const WorkspaceMemberDropdown: React.FC<Props> = observer((props) => {
  const {
    button,
    buttonClassName,
    buttonVariant,
    className = "",
    disabled = false,
    dropdownArrow = false,
    multiple,
    onChange,
    placeholder = "Members",
    placement,
    value,
  } = props;
  // states
  const [query, setQuery] = useState("");
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });
  // store hooks
  const {
    getUserDetails,
    workspace: { workspaceMemberIds },
  } = useMember();

  const options = workspaceMemberIds?.map((userId) => {
    const userDetails = getUserDetails(userId);

    return {
      value: userId,
      query: `${userDetails?.display_name} ${userDetails?.first_name} ${userDetails?.last_name}`,
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={userDetails?.display_name} src={userDetails?.avatar} />
          <span className="flex-grow truncate">{userDetails?.display_name}</span>
        </div>
      ),
    };
  });

  const filteredOptions =
    query === "" ? options : options?.filter((o) => o.query.toLowerCase().includes(query.toLowerCase()));

  const comboboxProps: any = {
    value,
    onChange,
    disabled,
  };
  if (multiple) comboboxProps.multiple = true;

  return (
    <Combobox
      as="div"
      className={cn("h-full flex-shrink-0", {
        className,
      })}
      {...comboboxProps}
    >
      <Combobox.Button as={Fragment}>
        {button ? (
          <button ref={setReferenceElement} type="button" className="block h-full w-full outline-none">
            {button}
          </button>
        ) : (
          <button
            ref={setReferenceElement}
            type="button"
            className={cn("block h-full max-w-full outline-none", {
              "cursor-not-allowed text-custom-text-200": disabled,
              "cursor-pointer": !disabled,
            })}
          >
            {buttonVariant === "border-with-text" ? (
              <BorderButton userIds={value} className={buttonClassName} placeholder={placeholder} />
            ) : buttonVariant === "border-without-text" ? (
              <BorderButton userIds={value} className={buttonClassName} placeholder={placeholder} hideText />
            ) : buttonVariant === "background-with-text" ? (
              <BackgroundButton userIds={value} className={buttonClassName} placeholder={placeholder} />
            ) : buttonVariant === "background-without-text" ? (
              <BackgroundButton userIds={value} className={buttonClassName} placeholder={placeholder} hideText />
            ) : buttonVariant === "transparent-with-text" ? (
              <TransparentButton userIds={value} className={buttonClassName} placeholder={placeholder} />
            ) : buttonVariant === "transparent-without-text" ? (
              <TransparentButton userIds={value} className={buttonClassName} placeholder={placeholder} hideText />
            ) : null}
            {dropdownArrow && !disabled && <ChevronDown className="h-2.5 w-2.5" aria-hidden="true" />}
          </button>
        )}
      </Combobox.Button>
      <Combobox.Options className="fixed z-10">
        <div
          className="my-1 w-48 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none"
          ref={setPopperElement}
          style={styles.popper}
          {...attributes.popper}
        >
          <div className="flex items-center gap-1.5 rounded border border-custom-border-100 bg-custom-background-90 px-2">
            <Search className="h-3.5 w-3.5 text-custom-text-400" strokeWidth={1.5} />
            <Combobox.Input
              className="w-full bg-transparent py-1 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              displayValue={(assigned: any) => assigned?.name}
            />
          </div>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-scroll">
            {filteredOptions ? (
              filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    value={option.value}
                    className={({ active, selected }) =>
                      `w-full truncate flex items-center justify-between gap-2 rounded px-1 py-1.5 cursor-pointer select-none ${
                        active ? "bg-custom-background-80" : ""
                      } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className="flex-grow truncate">{option.content}</span>
                        {selected && <Check className="h-3.5 w-3.5 flex-shrink-0" />}
                      </>
                    )}
                  </Combobox.Option>
                ))
              ) : (
                <p className="text-custom-text-400 italic py-1 px-1.5">No matching results</p>
              )
            ) : (
              <p className="text-custom-text-400 italic py-1 px-1.5">Loading...</p>
            )}
          </div>
        </div>
      </Combobox.Options>
    </Combobox>
  );
});
