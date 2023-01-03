import { useCommands, useActive } from "@remirror/react";

export const LinkButton = () => {
  const { focus } = useCommands();

  const active = useActive();

  return (
    <button
      type="button"
      onClick={() => {
        // toggleLink();
        focus();
      }}
      className={`${active.link() ? "bg-gray-200" : "hover:bg-gray-100"} rounded p-1`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="18"
        width="18"
        fill="black"
        viewBox="0 0 48 48"
      >
        <path d="M22.5 34H14q-4.15 0-7.075-2.925T4 24q0-4.15 2.925-7.075T14 14h8.5v3H14q-2.9 0-4.95 2.05Q7 21.1 7 24q0 2.9 2.05 4.95Q11.1 31 14 31h8.5Zm-6.25-8.5v-3h15.5v3ZM25.5 34v-3H34q2.9 0 4.95-2.05Q41 26.9 41 24q0-2.9-2.05-4.95Q36.9 17 34 17h-8.5v-3H34q4.15 0 7.075 2.925T44 24q0 4.15-2.925 7.075T34 34Z" />
      </svg>
    </button>
  );
};

// import type { ChangeEvent, HTMLProps, KeyboardEvent } from 'react';
// import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
// import { createMarkPositioner, LinkExtension, ShortcutHandlerProps } from 'remirror/extensions';
// import {
//   CommandButton,
//   EditorComponent,
//   FloatingToolbar,
//   FloatingWrapper,
//   Remirror,
//   ThemeProvider,
//   useActive,
//   useAttrs,
//   useChainedCommands,
//   useCurrentSelection,
//   useExtensionEvent,
//   useRemirror,
//   useUpdateReason,
// } from '@remirror/react';

// function useLinkShortcut() {
//   const [linkShortcut, setLinkShortcut] = useState<ShortcutHandlerProps | undefined>();
//   const [isEditing, setIsEditing] = useState(false);

//   useExtensionEvent(
//     LinkExtension,
//     'onShortcut',
//     useCallback(
//       (props) => {
//         if (!isEditing) {
//           setIsEditing(true);
//         }

//         return setLinkShortcut(props);
//       },
//       [isEditing],
//     ),
//   );

//   return { linkShortcut, isEditing, setIsEditing };
// }

// function useFloatingLinkState() {
//   const chain = useChainedCommands();
//   const { isEditing, linkShortcut, setIsEditing } = useLinkShortcut();
//   const { to, empty } = useCurrentSelection();

//   const url = (useAttrs().link()?.href as string) ?? '';
//   const [href, setHref] = useState<string>(url);

//   // A positioner which only shows for links.
//   const linkPositioner = useMemo(() => createMarkPositioner({ type: 'link' }), []);

//   const onRemove = useCallback(() => {
//     return chain.removeLink().focus().run();
//   }, [chain]);

//   const updateReason = useUpdateReason();

//   useLayoutEffect(() => {
//     if (!isEditing) {
//       return;
//     }

//     if (updateReason.doc || updateReason.selection) {
//       setIsEditing(false);
//     }
//   }, [isEditing, setIsEditing, updateReason.doc, updateReason.selection]);

//   useEffect(() => {
//     setHref(url);
//   }, [url]);

//   const submitHref = useCallback(() => {
//     setIsEditing(false);
//     const range = linkShortcut ?? undefined;

//     if (href === '') {
//       chain.removeLink();
//     } else {
//       chain.updateLink({ href, auto: false }, range);
//     }

//     chain.focus(range?.to ?? to).run();
//   }, [setIsEditing, linkShortcut, chain, href, to]);

//   const cancelHref = useCallback(() => {
//     setIsEditing(false);
//   }, [setIsEditing]);

//   const clickEdit = useCallback(() => {
//     if (empty) {
//       chain.selectLink();
//     }

//     setIsEditing(true);
//   }, [chain, empty, setIsEditing]);

//   return useMemo(
//     () => ({
//       href,
//       setHref,
//       linkShortcut,
//       linkPositioner,
//       isEditing,
//       clickEdit,
//       onRemove,
//       submitHref,
//       cancelHref,
//     }),
//     [href, linkShortcut, linkPositioner, isEditing, clickEdit, onRemove, submitHref, cancelHref],
//   );
// }

// const DelayAutoFocusInput = ({ autoFocus, ...rest }: HTMLProps<HTMLInputElement>) => {
//   const inputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (!autoFocus) {
//       return;
//     }

//     const frame = window.requestAnimationFrame(() => {
//       inputRef.current?.focus();
//     });

//     return () => {
//       window.cancelAnimationFrame(frame);
//     };
//   }, [autoFocus]);

//   return <input ref={inputRef} {...rest} />;
// };

// const FloatingLinkToolbar = () => {
//   const { isEditing, linkPositioner, clickEdit, onRemove, submitHref, href, setHref, cancelHref } =
//     useFloatingLinkState();
//   const active = useActive();
//   const activeLink = active.link();
//   const { empty } = useCurrentSelection();

//   const handleClickEdit = useCallback(() => {
//     clickEdit();
//   }, [clickEdit]);

//   const linkEditButtons = activeLink ? (
//     <>
//       <CommandButton
//         commandName='updateLink'
//         onSelect={handleClickEdit}
//         icon='pencilLine'
//         enabled
//       />
//       <CommandButton commandName='removeLink' onSelect={onRemove} icon='linkUnlink' enabled />
//     </>
//   ) : (
//     <CommandButton commandName='updateLink' onSelect={handleClickEdit} icon='link' enabled />
//   );

//   return (
//     <>
//       {!isEditing && <FloatingToolbar>{linkEditButtons}</FloatingToolbar>}
//       {!isEditing && empty && (
//         <FloatingToolbar positioner={linkPositioner}>{linkEditButtons}</FloatingToolbar>
//       )}

//       <FloatingWrapper
//         positioner='always'
//         placement='bottom'
//         enabled={isEditing}
//         renderOutsideEditor
//       >
//         <DelayAutoFocusInput
//           style={{ zIndex: 20 }}
//           autoFocus
//           placeholder='Enter link...'
//           onChange={(event: ChangeEvent<HTMLInputElement>) => setHref(event.target.value)}
//           value={href}
//           onKeyPress={(event: KeyboardEvent<HTMLInputElement>) => {
//             const { code } = event;

//             if (code === 'Enter') {
//               submitHref();
//             }

//             if (code === 'Escape') {
//               cancelHref();
//             }
//           }}
//         />
//       </FloatingWrapper>
//     </>
//   );
// };

// const EditDialog = (): JSX.Element => {
//   const { manager, state } = useRemirror({
//     extensions: () => [new LinkExtension({ autoLink: true })],
//     content: `Click this <a href="https://remirror.io" target="_blank">link</a> to edit it`,
//     stringHandler: 'html',
//   });

//   return (
//     <ThemeProvider>
//       <Remirror manager={manager} initialContent={state}>
//         <EditorComponent />
//         <FloatingLinkToolbar />
//       </Remirror>
//     </ThemeProvider>
//   );
// };

// export default EditDialog;
