import { h } from "jsx-dom-cjs";
import { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model";
import { Decoration, NodeView } from "@tiptap/pm/view";
import tippy, { Instance, Props } from "tippy.js";

import { Editor } from "@tiptap/core";
import { CellSelection, TableMap, updateColumnsOnResize } from "@tiptap/pm/tables";

import { icons } from "src/core/extensions/table/table/icons";

type ToolboxItem = {
  label: string;
  icon: string;
  action: (args: any) => void;
};

export function updateColumns(
  node: ProseMirrorNode,
  colgroup: HTMLElement,
  table: HTMLElement,
  cellMinWidth: number,
  overrideCol?: number,
  overrideValue?: any
) {
  let totalWidth = 0;
  let fixedWidth = true;
  let nextDOM = colgroup.firstChild as HTMLElement;
  const row = node.firstChild;

  if (!row) return;

  for (let i = 0, col = 0; i < row.childCount; i += 1) {
    const { colspan, colwidth } = row.child(i).attrs;

    for (let j = 0; j < colspan; j += 1, col += 1) {
      const hasWidth = overrideCol === col ? overrideValue : colwidth && colwidth[j];
      const cssWidth = hasWidth ? `${hasWidth}px` : "";

      totalWidth += hasWidth || cellMinWidth;

      if (!hasWidth) {
        fixedWidth = false;
      }

      if (!nextDOM) {
        colgroup.appendChild(document.createElement("col")).style.width = cssWidth;
      } else {
        if (nextDOM.style.width !== cssWidth) {
          nextDOM.style.width = cssWidth;
        }

        nextDOM = nextDOM.nextSibling as HTMLElement;
      }
    }
  }

  while (nextDOM) {
    const after = nextDOM.nextSibling;

    nextDOM.parentNode?.removeChild(nextDOM);
    nextDOM = after as HTMLElement;
  }

  if (fixedWidth) {
    table.style.width = `${totalWidth}px`;
    table.style.minWidth = "";
  } else {
    table.style.width = "";
    table.style.minWidth = `${totalWidth}px`;
  }
}

const defaultTippyOptions: Partial<Props> = {
  allowHTML: true,
  arrow: false,
  trigger: "click",
  animation: "scale-subtle",
  theme: "light-border no-padding",
  interactive: true,
  hideOnClick: true,
  placement: "right",
};

function setCellsBackgroundColor(editor: Editor, color: { backgroundColor: string; textColor: string }) {
  return editor
    .chain()
    .focus()
    .updateAttributes("tableCell", {
      background: color.backgroundColor,
      textColor: color.textColor,
    })
    .run();
}

function setTableRowBackgroundColor(editor: Editor, color: { backgroundColor: string; textColor: string }) {
  const { state, dispatch } = editor.view;
  const { selection } = state;
  if (!(selection instanceof CellSelection)) {
    return false;
  }

  // Get the position of the hovered cell in the selection to determine the row.
  const hoveredCell = selection.$headCell || selection.$anchorCell;

  // Find the depth of the table row node
  let rowDepth = hoveredCell.depth;
  while (rowDepth > 0 && hoveredCell.node(rowDepth).type.name !== "tableRow") {
    rowDepth--;
  }

  // If we couldn't find a tableRow node, we can't set the background color
  if (hoveredCell.node(rowDepth).type.name !== "tableRow") {
    return false;
  }

  // Get the position where the table row starts
  const rowStartPos = hoveredCell.start(rowDepth);

  // Create a transaction that sets the background color on the tableRow node.
  const tr = state.tr.setNodeMarkup(rowStartPos - 1, null, {
    ...hoveredCell.node(rowDepth).attrs,
    background: color.backgroundColor,
    textColor: color.textColor,
  });

  dispatch(tr);
  return true;
}

const columnsToolboxItems: ToolboxItem[] = [
  {
    label: "Toggle column header",
    icon: icons.toggleColumnHeader,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleHeaderColumn().run(),
  },
  {
    label: "Add column before",
    icon: icons.insertLeftTableIcon,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    label: "Add column after",
    icon: icons.insertRightTableIcon,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().addColumnAfter().run(),
  },
  {
    label: "Pick color",
    icon: "", // No icon needed for color picker
    action: (args: any) => {}, // Placeholder action; actual color picking is handled in `createToolbox`
  },
  {
    label: "Delete column",
    icon: icons.deleteColumn,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().deleteColumn().run(),
  },
];

const rowsToolboxItems: ToolboxItem[] = [
  {
    label: "Toggle row header",
    icon: icons.toggleRowHeader,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleHeaderRow().run(),
  },
  {
    label: "Add row above",
    icon: icons.insertTopTableIcon,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().addRowBefore().run(),
  },
  {
    label: "Add row below",
    icon: icons.insertBottomTableIcon,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().addRowAfter().run(),
  },
  {
    label: "Pick color",
    icon: "",
    action: (args: any) => {}, // Placeholder action; actual color picking is handled in `createToolbox`
  },
  {
    label: "Delete row",
    icon: icons.deleteRow,
    action: ({ editor }: { editor: Editor }) => editor.chain().focus().deleteRow().run(),
  },
];

function createToolbox({
  triggerButton,
  items,
  tippyOptions,
  onSelectColor,
  onClickItem,
  colors,
}: {
  triggerButton: Element | null;
  items: ToolboxItem[];
  tippyOptions: any;
  onClickItem: (item: ToolboxItem) => void;
  onSelectColor: (color: { backgroundColor: string; textColor: string }) => void;
  colors: { [key: string]: { backgroundColor: string; textColor: string; icon?: string } };
}): Instance<Props> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const toolbox = tippy(triggerButton, {
    content: h(
      "div",
      {
        className:
          "rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg min-w-[12rem] whitespace-nowrap",
      },
      items.map((item) => {
        if (item.label === "Pick color") {
          return h("div", { className: "flex flex-col" }, [
            h("hr", { className: "my-2 border-custom-border-200" }),
            h("div", { className: "text-custom-text-200 text-sm" }, item.label),
            h(
              "div",
              { className: "grid grid-cols-6 gap-x-1 gap-y-2.5 mt-2" },
              Object.entries(colors).map(([colorName, colorValue]) =>
                h("div", {
                  className: "grid place-items-center size-6 rounded cursor-pointer",
                  style: `background-color: ${colorValue.backgroundColor};color: ${colorValue.textColor || "inherit"};`,
                  innerHTML:
                    colorValue.icon ?? `<span class="text-md" style:"color: ${colorValue.backgroundColor}>A</span>`,
                  onClick: () => onSelectColor(colorValue),
                })
              )
            ),
            h("hr", { className: "my-2 border-custom-border-200" }),
          ]);
        } else {
          return h(
            "div",
            {
              className:
                "flex items-center gap-2 px-1 py-1.5 bg-custom-background-100 hover:bg-custom-background-80 text-sm text-custom-text-200 rounded cursor-pointer",
              itemType: "div",
              onClick: () => onClickItem(item),
            },
            [
              h("span", {
                className: "h-3 w-3 flex-shrink-0",
                innerHTML: item.icon,
              }),
              h("div", { className: "label" }, item.label),
            ]
          );
        }
      })
    ),
    ...tippyOptions,
  });

  return Array.isArray(toolbox) ? toolbox[0] : toolbox;
}

export class TableView implements NodeView {
  node: ProseMirrorNode;
  cellMinWidth: number;
  decorations: Decoration[];
  editor: Editor;
  getPos: () => number;
  hoveredCell: ResolvedPos | null = null;
  map: TableMap;
  root: HTMLElement;
  table: HTMLTableElement;
  colgroup: HTMLTableColElement;
  tbody: HTMLElement;
  rowsControl?: HTMLElement | null;
  columnsControl?: HTMLElement | null;
  columnsToolbox?: Instance<Props>;
  rowsToolbox?: Instance<Props>;
  controls?: HTMLElement;

  get dom() {
    return this.root;
  }

  get contentDOM() {
    return this.tbody;
  }

  constructor(
    node: ProseMirrorNode,
    cellMinWidth: number,
    decorations: Decoration[],
    editor: Editor,
    getPos: () => number
  ) {
    this.node = node;
    this.cellMinWidth = cellMinWidth;
    this.decorations = decorations;
    this.editor = editor;
    this.getPos = getPos;
    this.hoveredCell = null;
    this.map = TableMap.get(node);

    if (editor.isEditable) {
      this.rowsControl = h(
        "div",
        { className: "rows-control" },
        h("div", {
          itemType: "button",
          className: "rows-control-div",
          onClick: () => this.selectRow(),
        })
      );

      this.columnsControl = h(
        "div",
        { className: "columns-control" },
        h("div", {
          itemType: "button",
          className: "columns-control-div",
          onClick: () => this.selectColumn(),
        })
      );

      this.controls = h(
        "div",
        { className: "table-controls", contentEditable: "false" },
        this.rowsControl,
        this.columnsControl
      );
      const columnColors = {
        Blue: { backgroundColor: "#D9E4FF", textColor: "#171717" },
        Orange: { backgroundColor: "#FFEDD5", textColor: "#171717" },
        Grey: { backgroundColor: "#F1F1F1", textColor: "#171717" },
        Yellow: { backgroundColor: "#FEF3C7", textColor: "#171717" },
        Green: { backgroundColor: "#DCFCE7", textColor: "#171717" },
        Red: { backgroundColor: "#FFDDDD", textColor: "#171717" },
        Pink: { backgroundColor: "#FFE8FA", textColor: "#171717" },
        Purple: { backgroundColor: "#E8DAFB", textColor: "#171717" },
        None: {
          backgroundColor: "none",
          textColor: "none",
          icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-ban"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>`,
        },
      };

      this.columnsToolbox = createToolbox({
        triggerButton: this.columnsControl.querySelector(".columns-control-div"),
        items: columnsToolboxItems,
        colors: columnColors,
        onSelectColor: (color) => setCellsBackgroundColor(this.editor, color),
        tippyOptions: {
          ...defaultTippyOptions,
          appendTo: this.controls,
        },
        onClickItem: (item) => {
          item.action({
            editor: this.editor,
            triggerButton: this.columnsControl?.firstElementChild,
            controlsContainer: this.controls,
          });
          this.columnsToolbox?.hide();
        },
      });

      this.rowsToolbox = createToolbox({
        triggerButton: this.rowsControl.firstElementChild,
        items: rowsToolboxItems,
        colors: columnColors,
        tippyOptions: {
          ...defaultTippyOptions,
          appendTo: this.controls,
        },
        onSelectColor: (color) => setTableRowBackgroundColor(editor, color),
        onClickItem: (item) => {
          item.action({
            editor: this.editor,
            triggerButton: this.rowsControl?.firstElementChild,
            controlsContainer: this.controls,
          });
          this.rowsToolbox?.hide();
        },
      });
    }

    this.colgroup = h(
      "colgroup",
      null,
      Array.from({ length: this.map.width }, () => 1).map(() => h("col"))
    );
    this.tbody = h("tbody");
    this.table = h("table", null, this.colgroup, this.tbody);

    this.root = h(
      "div",
      {
        className: "table-wrapper horizontal-scrollbar scrollbar-md controls--disabled",
      },
      this.controls,
      this.table
    );

    this.render();
  }

  update(node: ProseMirrorNode, decorations: readonly Decoration[]) {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.decorations = [...decorations];
    this.map = TableMap.get(this.node);

    if (this.editor.isEditable) {
      this.updateControls();
    }

    this.render();

    return true;
  }

  render() {
    if (this.colgroup.children.length !== this.map.width) {
      const cols = Array.from({ length: this.map.width }, () => 1).map(() => h("col"));
      this.colgroup.replaceChildren(...cols);
    }

    updateColumnsOnResize(this.node, this.colgroup, this.table, this.cellMinWidth);
  }

  ignoreMutation() {
    return true;
  }

  updateControls() {
    const { hoveredTable: table, hoveredCell: cell } = Object.values(this.decorations).reduce(
      (acc, curr) => {
        if (curr.spec.hoveredCell !== undefined) {
          acc["hoveredCell"] = curr.spec.hoveredCell;
        }

        if (curr.spec.hoveredTable !== undefined) {
          acc["hoveredTable"] = curr.spec.hoveredTable;
        }
        return acc;
      },
      {} as Record<string, HTMLElement>
    ) as any;

    if (table === undefined || cell === undefined) {
      return this.root.classList.add("controls--disabled");
    }

    this.root.classList.remove("controls--disabled");
    this.hoveredCell = cell;

    const cellDom = this.editor.view.nodeDOM(cell.pos) as HTMLElement;

    if (!this.table || !cellDom) {
      return;
    }

    const tableRect = this.table?.getBoundingClientRect();
    const cellRect = cellDom?.getBoundingClientRect();

    if (this.columnsControl) {
      this.columnsControl.style.left = `${cellRect.left - tableRect.left - this.table.parentElement!.scrollLeft}px`;
      this.columnsControl.style.width = `${cellRect.width}px`;
    }
    if (this.rowsControl) {
      this.rowsControl.style.top = `${cellRect.top - tableRect.top}px`;
      this.rowsControl.style.height = `${cellRect.height}px`;
    }
  }

  selectColumn() {
    if (!this.hoveredCell) return;

    const colIndex = this.map.colCount(this.hoveredCell.pos - (this.getPos() + 1));
    const anchorCellPos = this.hoveredCell.pos;
    const headCellPos = this.map.map[colIndex + this.map.width * (this.map.height - 1)] + (this.getPos() + 1);

    const cellSelection = CellSelection.create(this.editor.view.state.doc, anchorCellPos, headCellPos);
    this.editor.view.dispatch(this.editor.state.tr.setSelection(cellSelection));
  }

  selectRow() {
    if (!this.hoveredCell) return;

    const anchorCellPos = this.hoveredCell.pos;
    const anchorCellIndex = this.map.map.indexOf(anchorCellPos - (this.getPos() + 1));
    const headCellPos = this.map.map[anchorCellIndex + (this.map.width - 1)] + (this.getPos() + 1);

    const cellSelection = CellSelection.create(this.editor.state.doc, anchorCellPos, headCellPos);
    this.editor.view.dispatch(this.editor.view.state.tr.setSelection(cellSelection));
  }
}
