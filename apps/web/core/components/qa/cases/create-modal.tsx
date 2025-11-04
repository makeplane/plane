"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import { CaseService } from "@/services/qa/case.service";
import { ExpandAltOutlined, PlusOutlined } from "@ant-design/icons";
// 删除顶层 Quill import，改为动态加载
// import Quill from "quill";
// import "quill/dist/quill.snow.css";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  // 只读展示字段
  repositoryId: string;
  repositoryName: string;
  // 创建成功回调（用于刷新列表或其它联动）
  onSuccess?: () => void | Promise<void>;
};

const caseService = new CaseService();

import type { TIssue } from "@plane/types";
import { WorkItemSelectModal } from "./work-item-select-modal";

export const CreateCaseModal: React.FC<Props> = (props) => {
  const { isOpen, handleClose, workspaceSlug, repositoryId, repositoryName, onSuccess } = props;

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState<boolean>(false);
  const title = useMemo(() => "新建测试用例", []);
  const [isWorkItemModalOpen, setIsWorkItemModalOpen] = useState<boolean>(false);

  const handleWorkItemConfirm = (selectedIssues: TIssue[]) => {
    const text = selectedIssues.map((i) => i.name).join(", ");
    form.setFieldsValue({ issues: text });
    setIsWorkItemModalOpen(false);
  };

  const resetForm = () => {
    form.resetFields();
    setSubmitting(false);
  };

  const onCloseWithReset = () => {
    resetForm();
    handleClose();
  };

  // 可编辑步骤表格组件：受控组件，受 Form.Item 管控
  const StepsEditor: React.FC<{
    value?: { description?: string; result?: string }[];
    onChange?: (v: { description?: string; result?: string }[]) => void;
  }> = ({ value, onChange }) => {
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
      background: "#fafafa",
      textAlign: "left",
      fontWeight: 500,
    };
    // 调整单元格内边距，使默认高度更紧凑
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

    const update = (next: { description?: string; result?: string }[]) => onChange?.(next);

    const handleAdd = () => update([...rows, { description: "", result: "" }]);

    const handleRemove = (idx: number) => {
      if (rows.length <= 1) {
        update([{ description: "", result: "" }]);
      } else {
        update(rows.filter((_, i) => i !== idx));
      }
    };

    const handleCell = (idx: number, key: "description" | "result", val: string) => {
      const next = rows.map((r, i) => (i === idx ? { ...r, [key]: val } : r));
      update(next);
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
                  <Button danger type="link" onClick={() => handleRemove(idx)}>
                    删除
                  </Button>
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

  useEffect(() => {
    if (!isOpen) return;
    // 打开弹窗时同步初始值（仅创建模式）
    form.setFieldsValue({
      name: "",
      precondition: "",
      // 修正 steps 初始类型为数组且默认一行空数据
      steps: [{ description: "", result: "" }],
      remark: "",
      issues: "",
      repository: repositoryName || "",
      module: "",
      type: "",
      priority: "",
      test_type: "",
      assignee: "",
    });
  }, [isOpen, form, repositoryName]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // 构造 payload：包含 steps 数组（仅创建）
      const payload: any = {
        name: (values?.name || "").trim(),
        precondition: (values?.precondition || "").trim(),
        repository: repositoryId,
        remark: values?.remark || "",
        steps: Array.isArray(values?.steps)
          ? values.steps.map((s: any) => ({
              description: (s?.description || "").trim(),
              result: (s?.result || "").trim(),
            }))
          : [],
      };

      if (!payload.name) {
        message.warning("请输入用例名称");
        setSubmitting(false);
        return;
      }

      await caseService.createCase(workspaceSlug, payload);
      message.success("测试用例创建成功");

      await onSuccess?.();
      onCloseWithReset();
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "操作失败，请稍后重试";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 受控富文本组件：接入 Antd Form（value/onChange）
  const QuillField: React.FC<{ value?: string; onChange?: (val: string) => void }> = ({ value, onChange }) => {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const quillRef = React.useRef<any>(null); // 改为 any 类型，因为 Quill 是动态加载的
    const [quillLoaded, setQuillLoaded] = useState(false);

    useEffect(() => {
      // 仅在浏览器端动态加载 Quill
      if (typeof window === "undefined") return;

      const loadQuill = async () => {
        try {
          const { default: Quill } = await import("quill");

          if (!containerRef.current || quillRef.current) return;

          const q = new Quill(containerRef.current, {
            theme: "snow",
            placeholder: "请输入前置条件",
          });
          quillRef.current = q;

          // 初始化内容（如果有）
          if (typeof value === "string") {
            q.root.innerHTML = value || "";
          }

          // 监听编辑变化，同步到表单
          q.on("text-change", () => {
            const html = q.root.innerHTML;
            onChange?.(html);
          });

          setQuillLoaded(true);
        } catch (error) {
          console.error("Failed to load Quill:", error);
        }
      };

      loadQuill();

      return () => {
        quillRef.current = null;
      };
    }, []);

    // 外部 value 变化时，避免不必要的覆盖
    useEffect(() => {
      if (!quillLoaded || !quillRef.current || typeof value !== "string") return;

      const currentHTML = quillRef.current.root.innerHTML;
      if (value !== currentHTML) {
        quillRef.current.root.innerHTML = value || "";
      }
    }, [value, quillLoaded]);

    // 关键：在捕获阶段阻止按键事件冒泡，避免触发全局快捷键
    useEffect(() => {
      const el = containerRef.current;
      if (!el || !quillLoaded) return;

      const handler = (e: KeyboardEvent) => {
        const q = quillRef.current;
        const isFocused = !!q?.hasFocus() || (document.activeElement && el.contains(document.activeElement as Node));

        // 仅在编辑器聚焦时进行处理
        if (!isFocused) return;

        // 保留组合键与 Esc/Tab 的冒泡（不影响复制粘贴、关闭弹窗、焦点切换）
        if (e.ctrlKey || e.metaKey || e.altKey || e.key === "Escape" || e.key === "Tab") return;

        // 阻止其它按键冒泡到全局（如单字母快捷键 'c'）
        e.stopPropagation();
      };

      // 捕获阶段优先处理
      el.addEventListener("keydown", handler, { capture: true });
      return () => el.removeEventListener("keydown", handler, { capture: true });
    }, [quillLoaded]);

    return (
      <div style={{ border: "1px solid #d9d9d9", borderRadius: 4 }}>
        <div ref={containerRef} style={{ minHeight: 180 }} />
        {!quillLoaded && <div style={{ padding: 16, textAlign: "center", color: "#999" }}>加载富文本编辑器...</div>}
      </div>
    );
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onCloseWithReset}
      title={title}
      width="75vw"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onCloseWithReset} disabled={submitting}>
            取消
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting}
            data-testid="qa-case-submit"
          >
            创建
          </Button>
        </div>
      }
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: "",
          precondition: "",
          // 修正 steps 初始值为数组且默认一行空数据
          steps: [{ description: "", result: "" }],
          remark: "",
          issues: "",
          repository: repositoryName || "",
          module: "",
          type: "",
          priority: "",
          test_type: "",
          assignee: "",
        }}
      >
        {/* 其余表单项与自定义组件保持不变 */}
        {/* 包括 QuillField 与 StepsEditor 的用法 */}
        {/* 左右布局、风格与已有设计体系保持一致 */}
        <div style={{ display: "flex", gap: 16 }}>
          {/* 左侧区域 */}
          <div style={{ flex: 2 }}>
            <Form.Item label={<span>标题</span>} name="name" rules={[{ required: true, message: "请输入标题" }]}>
              <Input placeholder="请输入标题" />
            </Form.Item>

            <Form.Item label="前置条件" name="precondition">
              <QuillField />
            </Form.Item>

            <Form.Item label="用例步骤" name="steps">
              <StepsEditor />
            </Form.Item>

            <Form.Item label="备注" name="remark">
              <QuillField />
            </Form.Item>

            <Form.Item label="工作项" name="issues">
              <div style={{ display: "flex", gap: 8 }}>
                <Input placeholder="请输入关联的工作项" />
                <Button icon={<PlusOutlined />} onClick={() => setIsWorkItemModalOpen(true)}>
                  选择工作项
                </Button>
              </div>
            </Form.Item>
          </div>

          {/* 右侧区域 */}
          <div style={{ flex: 1 }}>
            <Form.Item label="所属测试库" name="repository">
              <Input placeholder="所属测试库" disabled />
            </Form.Item>

            <Form.Item label="模块" name="module">
              <Input placeholder="请输入模块" />
            </Form.Item>

            <Form.Item label="用例类型" name="type">
              <Input placeholder="请输入用例类型" />
            </Form.Item>

            <Form.Item label="重要程度" name="priority">
              <Input placeholder="请输入重要程度" />
            </Form.Item>

            <Form.Item label="测试类型" name="test_type">
              <Input placeholder="请输入测试类型" />
            </Form.Item>

            <Form.Item label="维护人" name="assignee">
              <Input placeholder="请输入维护人" />
            </Form.Item>
          </div>
        </div>
      </Form>

      {/* 新增：选择工作项独立模态组件调用 */}
      <WorkItemSelectModal
        isOpen={isWorkItemModalOpen}
        workspaceSlug={workspaceSlug}
        onClose={() => setIsWorkItemModalOpen(false)}
        onConfirm={handleWorkItemConfirm}
      />
    </Modal>
  );
};
