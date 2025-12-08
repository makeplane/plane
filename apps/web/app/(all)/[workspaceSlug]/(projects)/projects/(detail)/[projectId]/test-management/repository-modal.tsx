"use client";

import React from "react";
import { Modal, Form, Input, Select, message } from "antd";
import { RepositoryService } from "@/services/qa/repository.service";
import { WorkspaceService } from "@/services/workspace.service";
import { ProjectService } from "@/services/project/project.service";
import { Logo } from "@/components/common/logo";

type Props = {
  open: boolean;
  workspaceSlug: string;
  initialValues?: {
    id?: string;
    name?: string;
    description?: string;
    project?: { id: string; name: string } | string | null;
  } | null;
  projectId?: string;
  onCancel: () => void;
  onSuccess: () => void;
};

export const RepositoryModal: React.FC<Props> = ({
  open,
  workspaceSlug,
  initialValues,
  projectId,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);
  const [projects, setProjects] = React.useState<Array<{ id: string; name: string; logo_props?: any }>>([]);
  const [workspaceId, setWorkspaceId] = React.useState<string | null>(null);

  const repositoryService = React.useMemo(() => new RepositoryService(), []);
  const workspaceService = React.useMemo(() => new WorkspaceService(), []);
  const projectService = React.useMemo(() => new ProjectService(), []);

  React.useEffect(() => {
    if (!workspaceSlug) return;
    const init = async () => {
      try {
        const ws = await workspaceService.getWorkspace(workspaceSlug);
        setWorkspaceId(ws?.id || null);
      } catch {
        setWorkspaceId(null);
      }

      try {
        const list = await projectService.getProjectsLite(workspaceSlug);
        const mapped = Array.isArray(list)
          ? list.map((p: any) => ({ id: p.id, name: p.name, logo_props: p.logo_props }))
          : [];
        setProjects(mapped);
      } catch {
        setProjects([]);
      }
    };
    init();
  }, [workspaceSlug, workspaceService, projectService]);

  React.useEffect(() => {
    if (!open) return;
    if (!initialValues) {
      form.resetFields();
      if (projectId) {
        form.setFieldValue("project", projectId);
      }
    } else {
      form.setFieldsValue({
        name: initialValues.name ?? "",
        description: initialValues.description ?? "",
        project:
          typeof initialValues.project === "string" ? initialValues.project : (initialValues.project?.id ?? null),
      });
    }
  }, [open, initialValues, form, projectId]);

  React.useEffect(() => {
    const ensureSelectedProjectInOptions = async () => {
      if (!workspaceSlug) return;
      const currentProjectId = initialValues?.project
        ? typeof initialValues.project === "string"
          ? initialValues.project
          : initialValues.project.id
        : projectId;

      if (!currentProjectId) return;
      const exists = projects.some((p) => p.id === currentProjectId);
      if (exists) return;
      try {
        const detail = await projectService.getProject(workspaceSlug, currentProjectId);
        setProjects((prev) => [{ id: detail.id, name: detail.name, logo_props: detail.logo_props }, ...prev]);
      } catch {}
    };
    ensureSelectedProjectInOptions();
  }, [projects, initialValues, workspaceSlug, projectService, projectId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload: any = {
        name: values.name,
        description: values.description || "",
        project: values.project || null,
        workspace: workspaceId,
      };

      if (initialValues?.id) {
        await repositoryService.updateRepository(String(workspaceSlug), { id: initialValues.id, ...payload });
        message.success("用例库已更新");
      } else {
        await repositoryService.createRepository(String(workspaceSlug), payload);
        message.success("用例库已创建");
      }
      onSuccess();
      onCancel();
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "提交失败";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={initialValues?.id ? "编辑用例库" : "新增用例库"}
      okText={initialValues?.id ? "更新" : "创建"}
      cancelText="取消"
      confirmLoading={submitting}
      onOk={handleSubmit}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="name" label="用例库名称" rules={[{ required: true, message: "请输入用例库名称" }]}>
          <Input placeholder="请输入名称" maxLength={255} />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea placeholder="可填写简单描述" autoSize={{ minRows: 3, maxRows: 6 }} />
        </Form.Item>
        <Form.Item name="project" label="关联项目">
          <Select
            allowClear
            placeholder="可选，关联到某个项目"
            showSearch
            optionFilterProp="data-name"
            filterOption={(input, option) => {
              const name = String(option?.props?.["data-name"] || "");
              return name.toLowerCase().includes(input.toLowerCase());
            }}
            disabled={true}
          >
            {projects.map((p) => (
              <Select.Option key={p.id} value={p.id} data-name={p.name}>
                <div className="flex items-center gap-2">
                  <Logo logo={p.logo_props} size={16} />
                  <span className="truncate">{p.name}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RepositoryModal;
