import React, {
  ChangeEvent,
  HTMLProps,
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createMarkPositioner, LinkExtension, ShortcutHandlerProps } from "remirror/extensions";
// buttons
import {
  ToggleBoldButton,
  ToggleItalicButton,
  ToggleUnderlineButton,
  ToggleStrikeButton,
  ToggleOrderedListButton,
  ToggleBulletListButton,
  ToggleCodeButton,
  ToggleHeadingButton,
  useActive,
  CommandButton,
  useAttrs,
  useChainedCommands,
  useCurrentSelection,
  useExtensionEvent,
  useUpdateReason,
} from "@remirror/react";
import { EditorState } from "remirror";

type Props = {
  gptOption?: boolean;
  editorState: Readonly<EditorState>;
  setDisableToolbar: React.Dispatch<React.SetStateAction<boolean>>;
};

const useLinkShortcut = () => {
  const [linkShortcut, setLinkShortcut] = useState<ShortcutHandlerProps | undefined>();
  const [isEditing, setIsEditing] = useState(false);

  useExtensionEvent(
    LinkExtension,
    "onShortcut",
    useCallback(
      (props) => {
        if (!isEditing) {
          setIsEditing(true);
        }

        return setLinkShortcut(props);
      },
      [isEditing]
    )
  );

  return { linkShortcut, isEditing, setIsEditing };
};

const useFloatingLinkState = () => {
  const chain = useChainedCommands();
  const { isEditing, linkShortcut, setIsEditing } = useLinkShortcut();
  const { to, empty } = useCurrentSelection();

  const url = (useAttrs().link()?.href as string) ?? "";
  const [href, setHref] = useState<string>(url);

  // A positioner which only shows for links.
  const linkPositioner = useMemo(() => createMarkPositioner({ type: "link" }), []);

  const onRemove = useCallback(() => chain.removeLink().focus().run(), [chain]);

  const updateReason = useUpdateReason();

  useLayoutEffect(() => {
    if (!isEditing) {
      return;
    }

    if (updateReason.doc || updateReason.selection) {
      setIsEditing(false);
    }
  }, [isEditing, setIsEditing, updateReason.doc, updateReason.selection]);

  useEffect(() => {
    setHref(url);
  }, [url]);

  const submitHref = useCallback(() => {
    setIsEditing(false);
    const range = linkShortcut ?? undefined;

    if (href === "") {
      chain.removeLink();
    } else {
      chain.updateLink({ href, auto: false }, range);
    }

    chain.focus(range?.to ?? to).run();
  }, [setIsEditing, linkShortcut, chain, href, to]);

  const cancelHref = useCallback(() => {
    setIsEditing(false);
  }, [setIsEditing]);

  const clickEdit = useCallback(() => {
    if (empty) {
      chain.selectLink();
    }

    setIsEditing(true);
  }, [chain, empty, setIsEditing]);

  return useMemo(
    () => ({
      href,
      setHref,
      linkShortcut,
      linkPositioner,
      isEditing,
      setIsEditing,
      clickEdit,
      onRemove,
      submitHref,
      cancelHref,
    }),
    [
      href,
      linkShortcut,
      linkPositioner,
      isEditing,
      clickEdit,
      onRemove,
      submitHref,
      cancelHref,
      setIsEditing,
    ]
  );
};

const DelayAutoFocusInput = ({
  autoFocus,
  setDisableToolbar,
  ...rest
}: HTMLProps<HTMLInputElement> & {
  setDisableToolbar: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) {
      return;
    }

    setDisableToolbar(false);

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [autoFocus, setDisableToolbar]);

  useEffect(() => {
    setDisableToolbar(false);
  }, [setDisableToolbar]);

  return (
    <>
      <label htmlFor="link-input" className="text-sm">
        Add Link
      </label>
      <input
        ref={inputRef}
        {...rest}
        onKeyDown={(e) => {
          if (rest.onKeyDown) rest.onKeyDown(e);
          setDisableToolbar(false);
        }}
        className={`${rest.className} mt-1`}
        onFocus={() => {
          setDisableToolbar(false);
        }}
        onBlur={() => {
          setDisableToolbar(true);
        }}
      />
    </>
  );
};

export const CustomFloatingToolbar: React.FC<Props> = ({
  gptOption,
  editorState,
  setDisableToolbar,
}) => {
  const { isEditing, setIsEditing, clickEdit, onRemove, submitHref, href, setHref, cancelHref } =
    useFloatingLinkState();

  const active = useActive();
  const activeLink = active.link();

  const handleClickEdit = useCallback(() => {
    clickEdit();
  }, [clickEdit]);

  return (
    <div className="z-[99999] flex flex-col items-center gap-y-2 divide-x divide-y divide-custom-border-200 rounded border border-custom-border-200 bg-custom-background-80 p-1 px-0.5 shadow-md">
      <div className="flex items-center gap-y-2 divide-x divide-custom-border-200">
        <div className="flex items-center gap-x-1 px-2">
          <ToggleHeadingButton
            attrs={{
              level: 1,
            }}
          />
          <ToggleHeadingButton
            attrs={{
              level: 2,
            }}
          />
          <ToggleHeadingButton
            attrs={{
              level: 3,
            }}
          />
        </div>
        <div className="flex items-center gap-x-1 px-2">
          <ToggleBoldButton />
          <ToggleItalicButton />
          <ToggleUnderlineButton />
          <ToggleStrikeButton />
        </div>
        <div className="flex items-center gap-x-1 px-2">
          <ToggleOrderedListButton />
          <ToggleBulletListButton />
        </div>
        {gptOption && (
          <div className="flex items-center gap-x-1 px-2">
            <button
              type="button"
              className="rounded py-1 px-1.5 text-xs hover:bg-custom-background-90"
              onClick={() => console.log(editorState.selection.$anchor.nodeBefore)}
            >
              AI
            </button>
          </div>
        )}
        <div className="flex items-center gap-x-1 px-2">
          <ToggleCodeButton />
        </div>
        {activeLink ? (
          <div className="flex items-center gap-x-1 px-2">
            <CommandButton
              commandName="openLink"
              onSelect={() => {
                window.open(href, "_blank");
              }}
              icon="externalLinkFill"
              enabled
            />
            <CommandButton
              commandName="updateLink"
              onSelect={handleClickEdit}
              icon="pencilLine"
              enabled
            />
            <CommandButton commandName="removeLink" onSelect={onRemove} icon="linkUnlink" enabled />
          </div>
        ) : (
          <CommandButton
            commandName="updateLink"
            onSelect={() => {
              if (isEditing) {
                setIsEditing(false);
              } else {
                handleClickEdit();
              }
            }}
            icon="link"
            enabled
            active={isEditing}
          />
        )}
      </div>

      {isEditing && (
        <div className="p-2 w-full">
          <DelayAutoFocusInput
            autoFocus
            placeholder="Paste your link here..."
            id="link-input"
            setDisableToolbar={setDisableToolbar}
            className="w-full px-2 py-0.5"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setHref(e.target.value)}
            value={href}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              const { code } = e;

              if (code === "Enter") {
                submitHref();
              }

              if (code === "Escape") {
                cancelHref();
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
