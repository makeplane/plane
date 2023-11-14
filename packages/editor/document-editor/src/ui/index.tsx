"use client"
import React, { useEffect, useRef, useState } from 'react';
import { Editor } from "@tiptap/core";
import { EditorContainer, EditorContentWrapper, cn, getEditorClassNames, useEditor } from '@plane/editor-core';
import { DocumentEditorExtensions } from './extensions';
import { FixedMenu } from './menu/fixed-menu';
import { AlertCircle, ArchiveIcon, ClipboardIcon, Copy, Cross, FileLineChart, Link, Lock, MenuSquare, MoreVertical, XCircle } from 'lucide-react';
import { usePopper } from 'react-popper';
import { ContentBrowser } from './components/content-browser';
import { IVerticalDropdownItemProps, VerticalDropdownMenu } from './components/vertical-dropdown-menu';
import { CopyPageLink, copyMarkdownToClipboard } from './utils/menu-actions';
import { useRouter } from 'next/router';

export type UploadImage = (file: File) => Promise<string>;
export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

interface DocumentDetails {
  title: string;
}

interface IDocumentEditor {
  documentDetails: DocumentDetails,
  value: string;
  uploadFile: UploadImage;
  deleteFile: DeleteImage;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  forwardedRef?: any;
  debouncedUpdatesEnabled?: boolean;
  duplicationConfig?: {
    action: () => Promise<void>
  },
  pageLockConfig? : {
    action: () => Promise<void>
  },
  pageArchiveConfig? : {
    action: () => Promise<void>
  }
}
interface DocumentEditorProps extends IDocumentEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

export interface IMarking {
  type: "heading",
  level: number,
  text: string,
  sequence: number
}

const DocumentEditor = ({
  documentDetails,
  onChange,
  debouncedUpdatesEnabled,
  setIsSubmitting,
  setShouldShowAlert,
  editorContentCustomClassNames,
  value,
  uploadFile,
  deleteFile,
  customClassName,
  forwardedRef,
  duplicationConfig,
  pageLockConfig,
  pageArchiveConfig
}: IDocumentEditor) => {

  const [markings, setMarkings] = useState<IMarking[]>([])

  const [alert, setAlert] = useState<string>("")

  const router = useRouter()

  const summaryMenuRef = useRef(null);
  const summaryButtonRef = useRef(null);
  const [summaryPopoverVisible, setSummaryPopoverVisible] = useState(false);

  const [menuItemVisible, setMenuItemVisible] = useState(false)
  const vericalIconRef = useRef(null);
  const verticalPopoverRef = useRef(null)


  // Options that would always be in the kanban menu
  const KanbanMenuOptions: IVerticalDropdownItemProps[] = [
    {
      type: "copy_markdown",
      Icon: ClipboardIcon,
      action: () => copyMarkdownToClipboard(editor),
      label: "Copy Markdown"
    },
    {
      type: "close_page",
      Icon: XCircle,
      action: () => router.back(),
      label: "Close the page"
    },
    {
      type: "copy_page_link",
      Icon: Link,
      action: () => CopyPageLink(),
      label: "Copy Page Link"
    },
  ]

  // If duplicateConfig is given, page duplication will be allowed
  if (duplicationConfig){
    KanbanMenuOptions.push({
      type: "duplicate_page",
      Icon: Copy,
      action: duplicationConfig.action,
      label: "Make a copy"
    })
  }

  // If Lock Configuration is given then, lock page option will be available in the kanban menu
  if (pageLockConfig){
    KanbanMenuOptions.push({
      type: "lock_page",
      Icon: Lock,
      label: "Lock Page",
      action: pageLockConfig.action
    })
  }

  // Archiving will be visible in the menu bar config once the pageArchiveConfig is given.
  if (pageArchiveConfig){
    KanbanMenuOptions.push({
      type: "archive_page",
      Icon: ArchiveIcon,
      label: "Archive Page",
      action: pageArchiveConfig.action,
    })
  }

  const { styles: summaryPopoverStyles, attributes: summaryPopoverAttributes } = usePopper(summaryButtonRef.current, summaryMenuRef.current, {
    placement: "bottom-start"
  })

  const { styles: verticalPopoverStyles, attributes: verticalPopoverAttributes } = usePopper(vericalIconRef.current, verticalPopoverRef.current, {
    placement: "bottom-end",
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, -40],
        },
      },
    ],
  })

  const onEditorChange = (json: any) => {
    const nodes = json.content as any[]
    const tempMarkings: IMarking[] = []
    let h1Sequence: number = 0
    let h2Sequence: number = 0
    if (nodes) {
      nodes.forEach((node) => {
        if (node.type === "heading" && (node.attrs.level === 1 || node.attrs.level === 2) && node.content) {
          tempMarkings.push({
            type: "heading",
            level: node.attrs.level,
            text: node.content[0].text,
            sequence: node.attrs.level === 1 ? ++h1Sequence : ++h2Sequence
          })
        }
      })
    }
    setMarkings(tempMarkings)
  }

  const editor = useEditor({
    onChange(json, html) {
      onEditorChange(json)
      onChange(json, html)
    },
    onStart(json) {
      onEditorChange(json)
    },
    debouncedUpdatesEnabled,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    deleteFile,
    forwardedRef,
    extensions: DocumentEditorExtensions(uploadFile, setIsSubmitting),
  });

  function findNthH1(editor: Editor, n: number, level: number): number {
    let count = 0;
    let pos = 0;
    editor.state.doc.descendants((node, position) => {
      if (node.type.name === 'heading' && node.attrs.level === level) {
        count++;
        if (count === n) {
          pos = position;
          return false;
        }
      }
    });
    return pos;
  }

  function scrollToNode(editor: Editor, pos: number): void {
    const headingNode = editor.state.doc.nodeAt(pos);
    if (headingNode) {
      const headingDOM = editor.view.nodeDOM(pos);
      if (headingDOM instanceof HTMLElement) {
        headingDOM.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  function scrollSummary(marking: IMarking) {
    if (editor) {
      console.log(marking)
      const pos = findNthH1(editor, marking.sequence, marking.level)
      scrollToNode(editor, pos)
    }
  }

  const editorClassNames = getEditorClassNames({ noBorder: true, borderOnFocus: false, customClassName });

  const [sidePeakVisible, setSidePeakVisible] = useState(false)

  if (!editor) return null;

  return (
    <main className="flex flex-col h-full">
      <header className="border-custom-border self-stretch flex flex-col border-b border-solid max-md:max-w-full">
        <nav
          className="self-center flex ml-0 w-full items-start justify-between gap-5 max-md:max-w-full max-md:flex-wrap max-md:justify-center">
          <div
            onMouseEnter={() => setSummaryPopoverVisible(true)}
            onMouseLeave={() => setSummaryPopoverVisible(false)}
          >
            <button
              ref={summaryButtonRef}
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
              onClick={() => {
                setSidePeakVisible(!sidePeakVisible)
                setSummaryPopoverVisible(false)
              }}
            >
              <MenuSquare
                size={20}
              />
            </button>
            {summaryPopoverVisible &&
              <div style={summaryPopoverStyles.popper} {...summaryPopoverAttributes.popper} className="z-10 h-[300px] w-[300px] ml-[40px] mt-[50px] shadow-xl rounded border-custom-border border-solid border-2 bg-custom-background-100 border-b pl-3 pr-3 pb-3 overflow-scroll">
                <ContentBrowser markings={markings} scrollSummary={scrollSummary} />
              </div>
            }
          </div>

          <FixedMenu editor={editor} uploadFile={uploadFile} setIsSubmitting={setIsSubmitting} />
          <div className="self-center flex items-start gap-3 my-auto max-md:justify-center"
          >
            <button
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
            >
              <FileLineChart
                size={20}
              />
            </button>
            <button
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
            >
              <AlertCircle
                size={20}
              />
            </button>
            <div>
              <button
                ref={vericalIconRef}
                className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
                onClick={() => setMenuItemVisible(!menuItemVisible)}
              >
                <MoreVertical
                  size={20}
                />
              </button>
              {menuItemVisible &&
                <div ref={verticalPopoverRef} style={verticalPopoverStyles.popper} {...verticalPopoverAttributes.popper} className="z-10 w-[250px] shadow-xl rounded border-custom-border border-solid border-2 bg-custom-background-100 border-b p-2 overflow-scroll">
                  <VerticalDropdownMenu items={KanbanMenuOptions} />
                </div>
              }
            </div>
          </div>
        </nav>
      </header>
      {/* <section className="items-start self-center flex w-[892px] max-w-full flex-col mt-7 mb-[478px]"> */}
      <section className="self-center items-stretch w-full max-md:max-w-full h-full">
        <div className={cn("gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0 h-full", { "justify-center": !sidePeakVisible })}>
          <aside className={`flex flex-col items-stretch w-[21%] max-md:w-full max-md:ml-0 border-custom-border border-r border-solid transition-all duration-200 ease-in-out transform ${sidePeakVisible ? 'translate-x-0' : '-translate-x-full'}`}>
            <ContentBrowser markings={markings} scrollSummary={scrollSummary} />
          </aside>
          {/* Page Element */}
          <div className={`flex h-full flex-col w-[90%] max-md:w-full max-md:ml-0  transition-all duration-200 ease-in-out ${sidePeakVisible ? 'ml-[12%] w-[79%]' : 'ml-0 w-[90%]'}`}>
            <div className="items-start h-full flex flex-col w-[892px] mt-8 max-md:max-w-full overflow-auto">
              <div className="flex flex-col py-2 max-md:max-w-full">
                <h1
                  className="border-none outline-none bg-transparent text-4xl font-bold leading-8 tracking-tight self-center w-[700px] max-w-full"
                >{documentDetails.title}</h1>
              </div>
              <div className="border-custom-border border-b border-solid self-stretch w-full h-0.5 mt-3" />
              <div className="h-full items-start flex flex-col max-md:max-w-full">
                <EditorContainer editor={editor} editorClassNames={editorClassNames}>
                  <div className="flex flex-col h-full">
                    <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
                  </div>
                </EditorContainer >
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


const DocumentEditorWithRef = React.forwardRef<EditorHandle, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef }
