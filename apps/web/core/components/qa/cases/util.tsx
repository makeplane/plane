// 顶部 import 位置
import {
  DeleteOutlined,
  ExpandAltOutlined,
  PlusOutlined,
  MoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { Button, Input, Modal, Popover } from "antd";
import { Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // 引入默认样式
export const RichTextEditor = ({
  value,
  onChange,
  onBlur,
  placeholder = "请输入内容...",
}: {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
}) => {
  // 定义工具栏配置
  const modules = {
    toolbar: [
      [
        {
          size: [
            "extra-small", // 额外小
            "small", // 小
            false, // 默认
            "large", // 大
            "extra-large", // 超大
            "2x-large", // 2倍大
            "3x-large", // 3倍大
          ],
        },
      ],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
  };

  // 定义允许的格式
  const formats = [
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "align",
    "list",
    "bullet",
    "indent",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video",
  ];

  // 新增：阻止按键事件冒泡，避免触发全局快捷键
  const stopGlobalHotkeys = (e: React.KeyboardEvent) => {
    e.stopPropagation();
  };
  return (
    <>
      {/* 仅在本组件内作用：让编辑器正文超出 200px 时滚动，工具栏不滚动 */}
      <style>{`
        .qa-quill .ql-container {
          max-height: 200px;
          overflow-y: auto;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        // 移除填满容器高度，改为由 .ql-container 控制高度与滚动
        onBlur={onBlur}
        // 加强保险：也在编辑器根元素上拦截
        onKeyDown={stopGlobalHotkeys}
        onKeyUp={stopGlobalHotkeys}
        // 指定滚动容器为编辑器正文容器
        className="qa-quill"
        scrollingContainer=".qa-quill .ql-container"
      />
    </>
  );
};

export const StepsEditor: React.FC<{
  value?: { description?: string; result?: string }[];
  onChange?: (v: { description?: string; result?: string }[]) => void;
  onBlur?: () => void;
}> = ({ value, onChange, onBlur }) => {
  const rows = Array.isArray(value) && value.length > 0 ? value : [{ description: "", result: "" }];

  useEffect(() => {
    if (!Array.isArray(value) || value.length === 0) {
      onChange?.([{ description: "", result: "" }]);
    }
  }, [value, onChange]);

  const tableBorder = "1px solid #d9d9d9";
  const thStyle: React.CSSProperties = {
    padding: 8,
    border: tableBorder,
    textAlign: "center",
    fontWeight: 400,
  };
  const tdStyle: React.CSSProperties = {
    padding: 5,
    border: tableBorder,
    verticalAlign: "top",
  };

  // 拖拽排序所需的引用
  const dragItem = React.useRef<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // 新增：放大编辑状态管理
  const [expandedEdit, setExpandedEdit] = useState<{
    visible: boolean;
    rowIndex: number;
    field: "description" | "result";
    value: string;
  }>({
    visible: false,
    rowIndex: -1,
    field: "description",
    value: "",
  });

  // 新增：受控 Popover，记录当前打开的操作列索引
  const [actionPopoverOpenIndex, setActionPopoverOpenIndex] = useState<number | null>(null);

  const update = (next: { description?: string; result?: string }[]) => onChange?.(next);

  const handleAdd = () => update([...rows, { description: "", result: "" }]);

  const handleRemove = (idx: number) => {
    console.log("🚀 ~ handleRemove ~ idx:", idx);
    if (rows.length <= 1) {
      console.log(2222);

      update([{ description: "", result: "" }]);
    } else {
      update(rows.filter((_, i) => i !== idx));
    }
  };

  const handleCell = (idx: number, key: "description" | "result", val: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [key]: val } : r));
    update(next);
  };
  // 新增：在当前行上方插入空白步骤
  const handleInsertAbove = (idx: number) => {
    console.log("🚀 ~ handleInsertAbove ~ idx:", idx);
    const blank = { description: "", result: "" };
    const next = [...rows];
    next.splice(idx, 0, blank);
    update(next);
    // 插入后关闭 Popover，避免覆盖层影响后续点击删除
    setActionPopoverOpenIndex(null);
  };
  // 新增：在当前行下方插入空白步骤
  const handleInsertBelow = (idx: number) => {
    const blank = { description: "", result: "" };
    const next = [...rows];
    next.splice(idx + 1, 0, blank);
    update(next);
    // 插入后关闭 Popover
    setActionPopoverOpenIndex(null);
  };
  // 新增：复制当前行并插入到下一行
  const handleCopyRow = (idx: number) => {
    const current = rows[idx] ?? { description: "", result: "" };
    const copy = { description: current.description ?? "", result: current.result ?? "" };
    const next = [...rows];
    next.splice(idx + 1, 0, copy);
    update(next);
    // 复制后关闭 Popover
    setActionPopoverOpenIndex(null);
  };

  // 在目标行上触发 drop，完成数组内的重排
  const handleDropOnRow = (dropIdx: number) => {
    const dragIdx = dragItem.current;
    if (dragIdx === null || dragIdx === dropIdx) {
      dragItem.current = null;
      return;
    }
    const next = [...rows];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(dropIdx, 0, moved);
    update(next);
    dragItem.current = null;
  };

  // 新增：打开放大编辑模态框
  const openExpandedEdit = (rowIndex: number, field: "description" | "result") => {
    setExpandedEdit({
      visible: true,
      rowIndex,
      field,
      value: rows[rowIndex]?.[field] || "",
    });
  };

  // 新增：保存放大编辑的内容
  const saveExpandedEdit = () => {
    if (expandedEdit.rowIndex >= 0) {
      handleCell(expandedEdit.rowIndex, expandedEdit.field, expandedEdit.value);
    }
    setExpandedEdit({
      visible: false,
      rowIndex: -1,
      field: "description",
      value: "",
    });
  };

  // 新增：取消放大编辑
  const cancelExpandedEdit = () => {
    setExpandedEdit({
      visible: false,
      rowIndex: -1,
      field: "description",
      value: "",
    });
  };

  return (
    <div>
      {/* 新增：放大编辑模态框 */}
      <Modal
        open={expandedEdit.visible}
        onCancel={cancelExpandedEdit}
        title={expandedEdit.field === "description" ? "编辑步骤描述" : "编辑预期结果"}
        width="60vw"
        footer={[
          <Button key="cancel" onClick={cancelExpandedEdit}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={saveExpandedEdit}>
            保存
          </Button>,
        ]}
        destroyOnClose
      >
        <Input.TextArea
          autoSize={{ minRows: 6, maxRows: 20 }}
          placeholder={expandedEdit.field === "description" ? "请输入步骤描述" : "请输入预期结果"}
          value={expandedEdit.value}
          onChange={(e) => setExpandedEdit((prev) => ({ ...prev, value: e.target.value }))}
          style={{ width: "100%" }}
        />
      </Modal>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #d9d9d9",
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: 72 }} />
          <col />
          <col style={{ width: "30%" }} />
          <col style={{ width: 100 }} /> {/* 调整操作列宽度 */}
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle}>编号</th>
            <th style={thStyle}>步骤描述</th>
            <th style={thStyle}>预期结果</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              style={{ cursor: "default" }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                handleDropOnRow(idx);
                setDraggingIndex(null);
              }}
            >
              <td
                style={{ ...tdStyle, cursor: draggingIndex === idx ? "grabbing" : "grab" }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                draggable
                onMouseDown={() => setDraggingIndex(idx)}
                onDragStart={(e) => {
                  dragItem.current = idx;
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDraggingIndex(null)}
              >
                {hoveredIndex === idx ? (
                  <span
                    aria-label="drag-handle"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      cursor: draggingIndex === idx ? "grabbing" : "grab",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="#999"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ display: "block", transform: "rotate(90deg)" }}
                    >
                      <circle cx="5" cy="6" r="1.6" />
                      <circle cx="10" cy="6" r="1.6" />
                      <circle cx="15" cy="6" r="1.6" />
                      <circle cx="5" cy="12" r="1.6" />
                      <circle cx="10" cy="12" r="1.6" />
                      <circle cx="15" cy="12" r="1.6" />
                    </svg>
                  </span>
                ) : (
                  <span style={{ cursor: draggingIndex === idx ? "grabbing" : "grab" }}>{idx + 1}</span>
                )}
              </td>
              <td style={tdStyle}>
                <div className="group" style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <Input.TextArea
                    bordered={false}
                    autoSize={{ minRows: 1, maxRows: 8 }}
                    placeholder="请输入步骤描述"
                    value={row?.description ?? ""}
                    onChange={(e) => handleCell(idx, "description", e.target.value)}
                    onBlur={onBlur}
                    style={{
                      padding: 0,
                      background: "transparent",
                      lineHeight: "20px",
                      flex: 1,
                    }}
                  />
                  {/* 新增：放大图标按钮（仅在悬停输入区域时显示，纯 CSS） */}
                  <Button
                    type="text"
                    size="small"
                    icon={<ExpandAltOutlined />}
                    onClick={() => openExpandedEdit(idx, "description")}
                    title="放大编辑"
                    className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
                  />
                </div>
              </td>
              <td style={tdStyle}>
                <div className="group" style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
                  <Input.TextArea
                    bordered={false}
                    autoSize={{ minRows: 1, maxRows: 8 }}
                    placeholder="请输入预期结果"
                    value={row?.result ?? ""}
                    onChange={(e) => handleCell(idx, "result", e.target.value)}
                    onBlur={onBlur}
                    style={{
                      padding: 0,
                      background: "transparent",
                      lineHeight: "20px",
                      flex: 1,
                    }}
                  />
                  {/* 新增：放大图标按钮（仅在悬停输入区域时显示，纯 CSS） */}
                  <Button
                    type="text"
                    size="small"
                    icon={<ExpandAltOutlined />}
                    onClick={() => openExpandedEdit(idx, "result")}
                    title="放大编辑"
                    className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity"
                  />
                </div>
              </td>
              <td style={tdStyle}>
                {/* 原删除按钮 + 更多操作弹窗 */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Trash2
                    onClick={() => handleRemove(idx)}
                    style={{ color: "#cccccc", fontSize: 16, cursor: "pointer", scale: 0.8 }}
                  />
                  <Popover
                    trigger="click"
                    placement="rightTop"
                    overlayStyle={{ padding: 0 }}
                    content={
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          textAlign: "left",
                          alignItems: "flex-start",
                        }}
                      >
                        <Button
                          data-button-area="true"
                          size="small"
                          type="text"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInsertAbove(idx)}
                          style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 6 }}
                        >
                          <ArrowUpOutlined />
                          向上添加步骤
                        </Button>
                        <Button
                          data-button-area="true"
                          size="small"
                          type="text"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleInsertBelow(idx)}
                          style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 6 }}
                        >
                          <ArrowDownOutlined />
                          向下添加步骤
                        </Button>
                        <Button
                          data-button-area="true"
                          size="small"
                          type="text"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleCopyRow(idx)}
                          style={{ display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 6 }}
                        >
                          <CopyOutlined />
                          复制
                        </Button>
                      </div>
                    }
                  >
                    <Button type="text" size="small" icon={<MoreOutlined />} title="更多操作" />
                  </Popover>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-start" }}>
        <Button color="primary" variant="text" icon={<PlusOutlined />} onClick={handleAdd}>
          新增步骤
        </Button>
      </div>
    </div>
  );
};
