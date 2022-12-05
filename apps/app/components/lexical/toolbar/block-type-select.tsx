import { FC, Fragment, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $isParentElementRTL, $isAtNodeEnd, $wrapNodes } from "@lexical/selection";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode } from "@lexical/rich-text";
import {
  $createCodeNode,
  $isCodeNode,
  getDefaultCodeLanguage,
  getCodeLanguages,
} from "@lexical/code";

const BLOCK_DATA = [
  { type: "paragraph", name: "Normal" },
  { type: "h1", name: "Large Heading" },
  { type: "h2", name: "Small Heading" },
  { type: "h3", name: "Heading" },
  { type: "h4", name: "Heading" },
  { type: "h5", name: "Heading" },
  { type: "Quote", name: "quote" },
  { type: "ol", name: "Numbered List" },
  { type: "ul", name: "Bulleted List" },
];

const supportedBlockTypes = new Set(["paragraph", "quote", "code", "h1", "h2", "ul", "ol"]);

const blockTypeToBlockName: any = {
  code: "Code Block",
  h1: "Large Heading",
  h2: "Small Heading",
  h3: "Heading",
  h4: "Heading",
  h5: "Heading",
  ol: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
  ul: "Bulleted List",
};

export interface BlockTypeSelectProps {
  editor: any;
  toolbarRef: any;
  blockType: string;
}

export const BlockTypeSelect: FC<BlockTypeSelectProps> = (props) => {
  const { editor, toolbarRef, blockType } = props;
  // refs
  const dropDownRef = useRef<any>(null);
  // states
  const [showBlockOptionsDropDown, setShowBlockOptionsDropDown] = useState(false);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const dropDown = dropDownRef.current;

    if (toolbar !== null && dropDown !== null) {
      const { top, left } = toolbar.getBoundingClientRect();
      dropDown.style.top = `${top + 40}px`;
      dropDown.style.left = `${left}px`;
    }
  }, [dropDownRef, toolbarRef]);

  useEffect(() => {
    const dropDown = dropDownRef.current;
    const toolbar = toolbarRef.current;

    if (dropDown !== null && toolbar !== null) {
      const handle = (event: any) => {
        const target = event.target;

        if (!dropDown.contains(target) && !toolbar.contains(target)) {
          setShowBlockOptionsDropDown(false);
        }
      };
      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownRef, setShowBlockOptionsDropDown, toolbarRef]);

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createParagraphNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatLargeHeading = () => {
    console.log("blockType ", blockType);
    if (blockType !== "h1") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h1"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatSmallHeading = () => {
    if (blockType !== "h2") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createHeadingNode("h2"));
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatBulletList = () => {
    if (blockType !== "ul") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatNumberedList = () => {
    if (blockType !== "ol") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createQuoteNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          $wrapNodes(selection, () => $createCodeNode());
        }
      });
    }
    setShowBlockOptionsDropDown(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="p-2 mr-2 text-sm flex items-center"
        onClick={() => setShowBlockOptionsDropDown(!showBlockOptionsDropDown)}
        aria-label="Formatting Options"
      >
        <span className="mr-2">{blockTypeToBlockName[blockType]}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-chevron-down"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z"
          ></path>
        </svg>
      </button>
      {showBlockOptionsDropDown && (
        <ul
          className="absolute mt-1 w-full min-w-[160px] overflow-auto rounded-md bg-white z-10 p-1 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
          ref={dropDownRef}
        >
          <li className="p-1 cursor-pointer" onClick={formatParagraph}>
            <span className="icon paragraph" />
            <span className="text">Normal</span>
            {blockType === "paragraph" && <span className="active" />}
          </li>
          <li className="p-1 cursor-pointer" onClick={formatLargeHeading}>
            <span className="icon large-heading" />
            <span className="text">Large Heading</span>
            {blockType === "h1" && <span className="active" />}
          </li>
          <li className="p-1 cursor-pointer" onClick={formatSmallHeading}>
            <span className="icon small-heading" />
            <span className="text">Small Heading</span>
            {blockType === "h2" && <span className="active" />}
          </li>
          <li className="p-1 cursor-pointer" onClick={formatBulletList}>
            <span className="icon bullet-list" />
            <span className="text">Bullet List</span>
            {blockType === "ul" && <span className="active" />}
          </li>
          <li className="p-1 cursor-pointer" onClick={formatNumberedList}>
            <span className="icon numbered-list" />
            <span className="text">Numbered List</span>
            {blockType === "ol" && <span className="active" />}
          </li>

          <li className="p-1 cursor-pointer" onClick={formatQuote}>
            <span className="icon quote" />
            <span className="text">Quote</span>
            {blockType === "quote" && <span className="active" />}
          </li>
          {/* <button className="item" onClick={formatCode}>
                <span className="icon code" />
                <span className="text">Code Block</span>
                {blockType === 'code' && <span className="active" />}
              </button> */}
        </ul>
      )}
    </div>
  );
};

// export const BlockTypeSelect: FC<any> = () => {
//   const [selected, setSelected] = useState(BLOCK_DATA[0]);

//   return (
//     <div className="inline-flex pr-1">
//       <Listbox value={selected} onChange={setSelected}>
//         <div className="relative">
//           <Listbox.Button className="relative w-full min-w-[160px] cursor-default rounded border border-[#e2e2e2] bg-white py-1 pl-3 pr-10 text-left outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 text-xs">
//             <span className="block truncate">{selected.name}</span>
//             <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="16"
//                 height="16"
//                 fill="currentColor"
//                 className="bi bi-chevron-down"
//                 viewBox="0 0 16 16"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M1.646 4.646a.5.5 0 01.708 0L8 10.293l5.646-5.647a.5.5 0 01.708.708l-6 6a.5.5 0 01-.708 0l-6-6a.5.5 0 010-.708z"
//                 ></path>
//               </svg>
//             </span>
//           </Listbox.Button>
//           <Transition
//             as={Fragment}
//             leave="transition ease-in duration-100"
//             leaveFrom="opacity-100"
//             leaveTo="opacity-0"
//           >
//             <Listbox.Options className="absolute mt-1 max-h-60 w-full min-w-[160px] overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
//               {BLOCK_DATA.map((blockType, index) => (
//                 <Listbox.Option
//                   key={index}
//                   className={({ active }) =>
//                     `relative cursor-default select-none py-2 px-2 ${
//                       active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'
//                     }`
//                   }
//                   value={blockType}
//                 >
//                   {({ selected }) => (
//                     <>
//                       <span
//                         className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}
//                       >
//                         {blockType.name}
//                       </span>
//                     </>
//                   )}
//                 </Listbox.Option>
//               ))}
//             </Listbox.Options>
//           </Transition>
//         </div>
//       </Listbox>
//     </div>
//   );
// };
