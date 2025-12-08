// 顶部：添加 client 指令与必要的导入
"use client";
import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CaseService } from "../../../services/qa/case.service";
import { Tag, Spin, Tooltip, message, Input, Table } from "antd";
import { getEnums } from "../../../../app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/test-management/util";
import { useMember } from "@/hooks/store/use-member";
import * as LucideIcons from "lucide-react";
import { useUser } from "@/hooks/store/user";
import { ModalHeader } from "./update-modal/modal-header";
import { TitleInput } from "./update-modal/title-input";
import { CaseMetaForm } from "./update-modal/case-meta-form";
import { BasicInfoPanel } from "./update-modal/basic-info-panel";
import { SideInfoPanel } from "./update-modal/side-info-panel";
import { FileUploadService, generateFileUploadPayload, getFileMetaDataForUpload } from "@plane/services";
import { WorkItemDisplayModal } from "./work-item-display-modal";
import { WorkItemSelectModal } from "./work-item-select-modal";
import { CommentOutlined, PlusOutlined } from "@ant-design/icons";
import type { TIssue } from "@plane/types";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { formatCNDateTime } from "./util";
import styles from "./update-modal.module.css";

type UpdateModalProps = {
  open: boolean;
  onClose: () => void;
  caseId?: string; // 改为传入case ID而不是完整数据
};

function UpdateModal({ open, onClose, caseId }: UpdateModalProps) {
  if (!open || !caseId) return null;

  const [activeTab, setActiveTab] = useState<string>("basic");
  // 增加：本地状态与失焦更新逻辑
  const { workspaceSlug } = useParams() as { workspaceSlug?: string };
  const caseService = React.useMemo(() => new CaseService(), []);

  // 新增：加载状态和用例数据状态
  const [loading, setLoading] = React.useState<boolean>(false);
  const [caseData, setCaseData] = React.useState<any>(null);

  // 新增：监听open变化，当模态框打开时获取数据
  React.useEffect(() => {
    if (open && caseId && workspaceSlug) {
      fetchCaseData();
    } else {
      // 关闭时清空数据
      setCaseData(null);
      setReplyTargetId(undefined);
      setReplyContent({});
    }
  }, [open]); // 仅在打开时拉取详情

  const fetchCaseData = async () => {
    if (!workspaceSlug || !caseId) return;

    setLoading(true);
    try {
      const data = await caseService.getCase(String(workspaceSlug), caseId);
      setCaseData(data);
    } catch (error) {
      console.error("获取用例数据失败:", error);
      // 这里可以添加错误提示
    } finally {
      setLoading(false);
    }
  };
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const [title, setTitle] = React.useState<string>("");
  React.useEffect(() => {
    setTitle(caseData?.name ?? "");
  }, [caseData?.name]);

  const handleBlurTitle = async () => {
    const newName = title?.trim();
    const oldName = (caseData?.name ?? "").trim();
    if (!workspaceSlug || !caseId) return;
    if (newName === oldName) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, name: newName });
      // 本地 optimistic 更新，避免再次请求导致闪动
      setCaseData((prev: any) => (prev ? { ...prev, name: newName } : prev));
    } catch {
      // 静默处理（可接入通知）
    }
  };

  // 新增：统一将 id/枚举值规范化为字符串，保证与下拉 options 的 value 类型一致
  const normalizeId = (v: any): string | undefined => {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "object") {
      const id = v.id ?? v.value ?? v.uuid;
      return id ? String(id) : undefined;
    }
    return String(v);
  };
  const stepsText = React.useMemo(() => {
    const s = caseData?.steps;
    if (Array.isArray(s)) {
      return s
        .map((item: any, idx: number) => {
          const desc = item?.description ?? "";
          const result = item?.result ?? "";
          return `${idx + 1}. ${desc}${result ? `（结果：${result}）` : ""}`;
        })
        .join("；");
    }
    return String(s ?? "");
  }, [caseData?.steps]);

  const [reloadToken, setReloadToken] = React.useState<number>(0);
  const [isWorkItemModalOpen, setIsWorkItemModalOpen] = React.useState<boolean>(false);
  const [forceTypeName, setForceTypeName] = React.useState<"Requirement" | "Task" | "Bug" | undefined>(undefined);
  const [currentCount, setCurrentCount] = React.useState<number>(0);
  const [currentLabel, setCurrentLabel] = React.useState<string>("");
  const [preselectedIssues, setPreselectedIssues] = React.useState<TIssue[]>([]);

  // 执行记录：类型定义与本地状态
  type TExecRecord = {
    id?: string | number;
    name?: string;
    result?: string;
    created_by?: string | null;
    created_at?: string;
  };
  const [execLoading, setExecLoading] = React.useState<boolean>(false);
  const [execError, setExecError] = React.useState<string | null>(null);
  const [execList, setExecList] = React.useState<TExecRecord[]>([]);
  const [execTotal, setExecTotal] = React.useState<number>(0);
  const [execPage, setExecPage] = React.useState<number>(1);
  const [execPageSize, setExecPageSize] = React.useState<number>(10);
  const execPageSizeOptions = [10, 20, 50, 100];

  // 执行记录：请求方法
  const fetchExecRecords = async () => {
    if (!workspaceSlug || !caseId) return;
    setExecLoading(true);
    setExecError(null);
    try {
      const res = await caseService.getCaseExecuteRecord(String(workspaceSlug), String(caseId));
      const list = Array.isArray((res as any)?.data) ? (res as any).data : Array.isArray(res) ? (res as any) : [];
      const count = (res as any)?.count ?? list.length;
      setExecList(list);
      setExecTotal(count);
      setExecPage(1);
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "获取执行记录失败";
      setExecError(msg);
      message.error(msg);
    } finally {
      setExecLoading(false);
    }
  };

  const handleOpenSelectModal = async (type: "Requirement" | "Task" | "Bug") => {
    setForceTypeName(type);
    if (workspaceSlug && caseId) {
      try {
        const typeName = type === "Requirement" ? "史诗,特性,用户故事" : type === "Task" ? "任务" : "缺陷";
        const res = await caseService.issueList(String(workspaceSlug), {
          case_id: caseId,
          type_name: typeName,
        });
        const resolved: TIssue[] = Array.isArray((res as any)?.data)
          ? ((res as any).data as TIssue[])
          : Array.isArray(res)
            ? (res as TIssue[])
            : [];
        setPreselectedIssues(resolved);
      } catch {
        setPreselectedIssues([]);
      }
    }
    setIsWorkItemModalOpen(true);
  };

  const handleWorkItemConfirm = async (issues: any[]) => {
    try {
      if (!workspaceSlug || !caseId) return;
      const issueIds = (issues || []).map((i) => i.id);
      await caseService.updateCase(String(workspaceSlug), { id: caseId, issues: issueIds });
      setIsWorkItemModalOpen(false);
      setReloadToken((t) => t + 1);
      await fetchCaseData();
      message.success("关联工作项已更新");
    } catch (e: any) {
      message.error(e?.message || e?.detail || e?.error || "更新失败");
    }
  };

  // 新增：附件相关本地状态（编辑模式展示与上传）
  const [caseAttachments, setCaseAttachments] = React.useState<any[]>([]);
  const [attachmentUploading, setAttachmentUploading] = React.useState<Record<string, boolean>>({});
  const [attachmentsLoading, setAttachmentsLoading] = React.useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const handlePickAttachments = () => fileInputRef.current?.click();

  // 新增：打开时拉取已上传附件列表
  React.useEffect(() => {
    let alive = true;
    const fetchAttachments = async () => {
      if (!open || !workspaceSlug || !caseId) return;
      setAttachmentsLoading(true);
      try {
        const list = await caseService.getCaseAssetList(String(workspaceSlug), String(caseId));
        if (!alive) return;
        setCaseAttachments(Array.isArray(list) ? list : []);
      } catch {
      } finally {
        if (alive) setAttachmentsLoading(false);
      }
    };
    fetchAttachments();
    return () => {
      alive = false;
    };
  }, [open, workspaceSlug, caseId]);

  const fileUploadService = useMemo(() => new FileUploadService(), []);
  const [attachmentAssetIds, setAttachmentAssetIds] = useState<string[]>([]);
  const [attachmentAssetMap, setAttachmentAssetMap] = useState<Record<string, string>>({});

  const handleRemoveAttachment = async (idx: number) => {
    const file = attachmentFiles[idx];
    if (!file) return;
    const key = `${file.name}-${file.size}-${file.lastModified}`;
    const uploading = !!attachmentUploading[key];
    if (uploading) {
      message.warning("该附件正在上传，无法删除");
      return;
    }
    const assetId = attachmentAssetMap[key];
    try {
      // 如果已存在对应 assetId，先调用接口删除后端资产
      if (assetId) {
        await caseService.deleteWorkspaceAsset(String(workspaceSlug), assetId);
      }
      // 本地状态同步移除
      setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx));
      if (assetId) {
        setAttachmentAssetIds((prev) => prev.filter((id) => id !== assetId));
      }
      setAttachmentAssetMap((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      message.success("附件已删除");
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "附件删除失败";
      message.error(msg);
    }
  };

  const uploadAttachmentViaProjectAssetEndpoint = async (file: File) => {
    try {
      if (!workspaceSlug) {
        message.error("缺少必要参数(workspaceSlug)，无法上传附件");
        return;
      }
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      setAttachmentUploading((prev) => ({ ...prev, [key]: true }));

      // 1. 获取签名（固定 entity_type 为 CASE_ATTACHMENT）
      const meta = await getFileMetaDataForUpload(file);
      const presignResp = await caseService.post(`/api/assets/v2/workspaces/${workspaceSlug}/`, {
        ...meta,
        entity_type: "CASE_ATTACHMENT",
        entity_identifier: "",
      });
      const signed = presignResp?.data ?? presignResp;

      // 2. 直传到对象存储
      const payload = generateFileUploadPayload(signed, file);
      await fileUploadService.uploadFile(signed.upload_data.url, payload);

      // 3. 标记已上传
      await caseService.patch(`/api/assets/v2/workspaces/${workspaceSlug}/${signed.asset_id}/`);
      // 4. 记录case_id
      await caseService.putAssetCaseId(String(workspaceSlug), String(signed.asset_id), {
        case_id: String(caseId),
      });
      // 记录 assetId，用于提交与删除
      setAttachmentAssetIds((prev) => [...prev, String(signed.asset_id)]);
      setAttachmentAssetMap((prev) => ({ ...prev, [key]: String(signed.asset_id) }));
      // 记录文件信息，便于展示
      // file.id = String(signed.asset_id);
      setAttachmentFiles((prev) => [...prev, file]);
      try {
        const refreshed = await caseService.getCaseAssetList(String(workspaceSlug), String(caseId));
        setCaseAttachments(Array.isArray(refreshed) ? refreshed : []);
      } catch {}
      message.success(`附件 ${file.name} 上传完成`);
    } catch (e: any) {
      const msg = e?.message || e?.detail || e?.error || "附件上传失败";
      message.error(msg);
    } finally {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      setAttachmentUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setAttachmentFiles((prev) => [...prev, ...files]);
      // 逐个文件进行三段式上传
      files.forEach((file) => uploadAttachmentViaProjectAssetEndpoint(file));
    }
    console.log("🚀 ~ handleFilesChosen ~ attachmentFiles:", attachmentFiles);

    // 重置 input 值，允许同名文件重复选择
    e.target.value = "";
  };

  // 新增：删除附件
  const handleRemoveCaseAttachment = async (attachmentId: string) => {
    if (!workspaceSlug || !caseId) return;
    if (!attachmentId) return;
    try {
      await caseService.deleteWorkspaceAsset(String(workspaceSlug), String(attachmentId));
      setCaseAttachments((prev) => prev.filter((a) => String(a?.id) !== String(attachmentId)));
    } catch {}
  };

  // 新增：下载附件
  const handleDownloadAttachment = async (attachment: any) => {
    const aid = String(attachment?.id ?? "");
    if (!workspaceSlug || !caseId || !aid) return;
    try {
      const resp = await caseService.getCaseAsset(String(workspaceSlug), String(caseId), aid);
      const blob = resp?.data as Blob;
      const filename = String(attachment?.attributes?.name ?? "附件");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };
  // 新增：状态 Tag 颜色映射
  const getCaseStateTagColor = (text: string): "blue" | "green" | "red" | "default" => {
    switch (text) {
      case "待评审":
        return "blue";
      case "已通过":
        return "green";
      case "已拒绝":
        return "red";
      default:
        return "default";
    }
  };

  const { data: currentUser } = useUser();
  const [comments, setComments] = React.useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = React.useState<boolean>(false);
  const [commentPage, setCommentPage] = React.useState<number>(1);
  const [commentPageSize, setCommentPageSize] = React.useState<number>(10);
  const [commentTotal, setCommentTotal] = React.useState<number>(0);
  const [newComment, setNewComment] = React.useState<string>("");
  const [replyContent, setReplyContent] = React.useState<Record<string, string>>({});
  const [editContent, setEditContent] = React.useState<Record<string, string>>({});
  const [replyTargetId, setReplyTargetId] = React.useState<string | undefined>(undefined);
  const [commentPlaceholder, setCommentPlaceholder] = React.useState<string>("输入评论内容");
  const newCommentInputRef = React.useRef<any>(null);

  const fetchComments = async (reset = true, pageOverride?: number) => {
    if (!workspaceSlug || !caseId) return;
    setCommentsLoading(true);
    try {
      const pageToUse = pageOverride ?? (reset ? 1 : commentPage);
      const resp = await caseService.get(`/api/workspaces/${workspaceSlug}/test/comments/`, {
        params: { case_id: caseId, page: pageToUse, page_size: commentPageSize, max_depth: 5 },
      });
      const results = resp?.data?.data ?? [];
      const count = resp?.data?.count ?? (Array.isArray(results) ? results.length : 0);
      setCommentTotal(Number(count || 0));
      if (reset) {
        setComments(Array.isArray(results) ? results : []);
        setCommentPage(1);
      } else {
        setComments((prev) => [...prev, ...(Array.isArray(results) ? results : [])]);
      }
    } catch {}
    setCommentsLoading(false);
  };

  React.useEffect(() => {
    if (open && caseId && workspaceSlug) fetchComments(true);
  }, [open, caseId, workspaceSlug]);

  const handleCreateComment = async () => {
    if (!workspaceSlug || !caseId) return;
    const content = newComment.trim();
    if (!content) {
      message.warning("请输入评论内容");
      return;
    }
    try {
      await caseService.createComment(String(workspaceSlug), { case: String(caseId), content });
      setNewComment("");
      setReplyTargetId(undefined);
      setCommentPlaceholder("输入评论内容");
      fetchComments(true);
    } catch (e: any) {
      message.error(e?.message || e?.detail || e?.error || "创建失败");
    }
  };

  const handleReply = async (parentId: string) => {
    if (!workspaceSlug || !caseId) return;
    const content = (replyContent[parentId] || "").trim();
    if (!content) {
      message.warning("请输入回复内容");
      return;
    }
    try {
      setReplyTargetId(undefined);
      await caseService.createComment(String(workspaceSlug), {
        case: String(caseId),
        content,
        parent: String(parentId),
      });
      setReplyContent((prev) => ({ ...prev, [parentId]: "" }));
      fetchComments(true);
    } catch (e: any) {
      message.error(e?.message || e?.detail || e?.error || "回复失败");
    }
  };
  const handleDelete = async (id: string) => {
    if (!workspaceSlug) return;
    try {
      await caseService.deleteComment(String(workspaceSlug), String(id));
      fetchComments(true);
    } catch (e: any) {
      message.error(e?.message || e?.detail || e?.error || "删除失败");
    }
  };

  const startReply = (c: any) => {
    const id = String(c?.id || "");
    setReplyTargetId(id);
  };

  const renderComment = (c: any, depth = 0, parentCreatorName?: string, parentCreatorId?: string) => {
    const isOwner = currentUser?.id && String(currentUser.id) === String(c?.creator);
    const children = Array.isArray(c?.children) ? c.children : [];
    const indentClass = depth === 1 ? styles.depthChild : styles.depth0;
    const creatorName = String(c?.creator_name || "");
    return (
      <div key={String(c?.id)} className={`${styles.commentItem} ${indentClass}`} data-depth={depth}>
        <div className={`rounded p-2 bg-white`}>
          {depth === 0 ? (
            <div className="flex items-center">
              <span className="flex-1 min-w-0">
                <div className={styles.noHover}>
                  <MemberDropdown
                    multiple={false}
                    value={c?.creator ?? null}
                    onChange={() => {}}
                    disabled={true}
                    placeholder={creatorName || "未知用户"}
                    className="w-full text-sm"
                    buttonContainerClassName="w-full text-left p-0 cursor-default"
                    buttonVariant="transparent-with-text"
                    buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit"
                    showUserDetails={true}
                    optionsClassName="z-[60]"
                  />
                </div>
              </span>
            </div>
          ) : (
            <div className="text-sm flex flex-wrap items-center">
              <div className={styles.noHover}>
                <MemberDropdown
                  multiple={false}
                  value={c?.creator ?? null}
                  onChange={() => {}}
                  disabled={true}
                  placeholder={creatorName || "未知用户"}
                  className="text-sm"
                  buttonContainerClassName="p-0 cursor-default inline-flex items-center gap-1"
                  buttonVariant="transparent-with-text"
                  buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit font-semibold"
                  showUserDetails={true}
                  optionsClassName="z-[60]"
                />
              </div>
              {depth >= 2 && parentCreatorName ? <span className="mx-1">回复</span> : null}
              {depth >= 2 && parentCreatorName ? (
                <div className={styles.noHover}>
                  <MemberDropdown
                    multiple={false}
                    value={parentCreatorId ?? null}
                    onChange={() => {}}
                    disabled={true}
                    placeholder={parentCreatorName || "未知用户"}
                    className="text-sm"
                    buttonContainerClassName="p-0 cursor-default inline-flex items-center gap-1"
                    buttonVariant="transparent-with-text"
                    buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit font-semibold"
                    showUserDetails={true}
                    optionsClassName="z-[60]"
                  />
                </div>
              ) : null}
              <span className="mx-1">：</span>
              <span className="whitespace-pre-wrap break-words">{c?.content || ""}</span>
            </div>
          )}
          {depth === 0 && <div className="mt-2 pl-8 text-sm whitespace-pre-wrap break-words">{c?.content || ""}</div>}
          <div className={`mt-1 text-xs text-gray-500 flex items-center gap-2 ${depth === 0 ? "pl-8" : ""}`}>
            <span>{formatCNDateTime(c?.created_at)}</span>
            <button
              type="button"
              title="回复"
              className="text-gray-500 hover:text-blue-600 inline-flex items-center gap-1"
              onClick={() => startReply(c)}
            >
              <CommentOutlined />
              <span>回复</span>
            </button>
            {isOwner && (
              <button
                type="button"
                title="删除"
                className="text-gray-500 hover:text-red-600 inline-flex items-center gap-1"
                onClick={() => handleDelete(String(c?.id))}
              >
                <LucideIcons.Trash2 size={14} />
                <span>删除</span>
              </button>
            )}
          </div>
          {replyTargetId === String(c?.id) && (
            <div className={`mt-2 ${depth === 0 ? "pl-8" : ""}`}>
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 4 }}
                placeholder={`回复${creatorName}：`}
                value={replyContent[String(c?.id)] || ""}
                onChange={(e) => setReplyContent((prev) => ({ ...prev, [String(c?.id)]: e.target.value }))}
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded bg-blue-600 text-white px-3 py-1.5 text-sm"
                  onClick={() => handleReply(String(c?.id))}
                >
                  回复
                </button>
                <button
                  type="button"
                  className="rounded bg-gray-100 text-gray-700 px-3 py-1.5 text-sm hover:bg-gray-200"
                  onClick={() => {
                    setReplyContent((prev) => ({ ...prev, [String(c?.id)]: "" }));
                    setReplyTargetId(undefined);
                  }}
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
        {children &&
          children.length > 0 &&
          children.slice(0, 100).map((child: any) => renderComment(child, depth + 1, creatorName, String(c?.creator)))}
      </div>
    );
  };

  // 新增：四个下拉框的本地值状态（从 caseData 同步，类型统一为字符串）
  const [assignee, setAssignee] = React.useState<string | undefined>(undefined);
  const [stateValue, setStateValue] = React.useState<string | undefined>(undefined);
  const [typeValue, setTypeValue] = React.useState<string | undefined>(undefined);
  const [priorityValue, setPriorityValue] = React.useState<string | undefined>(undefined);
  const [preconditionValue, setPreconditionValue] = React.useState<string | undefined>(undefined);
  const [remarkValue, setRemarkValue] = React.useState<string | undefined>(undefined);
  // 新增：测试步骤本地状态（与 StepsEditor 交互）
  const [stepsValue, setStepsValue] = React.useState<{ description?: string; result?: string }[]>([
    { description: "", result: "" },
  ]);

  React.useEffect(() => {
    if (caseData) {
      setAssignee(normalizeId(caseData?.assignee));
      setStateValue(normalizeId(caseData?.state));
      setTypeValue(normalizeId(caseData?.type));
      setPriorityValue(normalizeId(caseData?.priority));
      // 新增：同步富文本本地状态
      setPreconditionValue(caseData?.precondition ?? "");
      setRemarkValue(caseData?.remark ?? "");
      // 新增：同步步骤本地状态
      setStepsValue(
        Array.isArray(caseData?.steps) && caseData.steps.length > 0 ? caseData.steps : [{ description: "", result: "" }]
      );
    } else {
      // 清空状态
      setAssignee(undefined);
      setStateValue(undefined);
      setTypeValue(undefined);
      setPriorityValue(undefined);
      // 新增：清空富文本本地状态
      setPreconditionValue("");
      setRemarkValue("");
      // 新增：清空步骤本地状态
      setStepsValue([{ description: "", result: "" }]);
    }
  }, [caseData]);

  // 新增：枚举数据状态与拉取逻辑（参考 create-modal）
  const [enumsData, setEnumsData] = React.useState<{
    case_type?: Record<string, string>;
    case_priority?: Record<string, string>;
    case_state?: Record<string, string>;
    plan_case_result?: Record<string, string>;
  }>({});

  React.useEffect(() => {
    if (!open || !workspaceSlug) return;
    const fetchEnums = async () => {
      try {
        const enums = await getEnums(String(workspaceSlug));
        setEnumsData({
          case_type: enums.case_type || {},
          case_priority: enums.case_priority || {},
          case_state: enums.case_state || {},
          plan_case_result: enums.plan_case_result || {},
        });
      } catch {
        // 暂时静默处理错误
      }
    };
    fetchEnums();
  }, [open, workspaceSlug]);

  // 切换到“执行”页时自动拉取执行记录
  React.useEffect(() => {
    if (activeTab === "execution") {
      fetchExecRecords();
    }
  }, [activeTab, workspaceSlug, caseId]);

  // 生成选项（参考 create-modal）
  const caseTypeOptions = React.useMemo(
    () =>
      Object.entries(enumsData.case_type || {}).map(([value, label]) => ({
        value,
        label, // 保持字符串，直接用于过滤
        title: String(label), // 备用：统一用于 optionFilterProp
      })),
    [enumsData.case_type]
  );
  const casePriorityOptions = React.useMemo(
    () =>
      Object.entries(enumsData.case_priority || {}).map(([value, label]) => ({
        value,
        label, // 保持字符串，直接用于过滤
        title: String(label),
      })),
    [enumsData.case_priority]
  );
  const caseStateOptions = React.useMemo(
    () =>
      Object.entries(enumsData.case_state || {}).map(([value, label]) => {
        const text = String(label);
        return {
          value,
          // 用 Tag 展示状态，同时支持选择后在选择框中以 Tag 形式回显
          label: <Tag color={getCaseStateTagColor(text)}>{text}</Tag>,
          title: text, // 供搜索过滤使用
        };
      }),
    [enumsData.case_state]
  );

  // 维护人选项（复用 useMember 逻辑），显示 icon + 名字
  const {
    getUserDetails,
    workspace: { workspaceMemberIds, isUserSuspended },
  } = useMember();
  const assigneeOptions = React.useMemo(
    () =>
      (workspaceMemberIds ?? []).map((userId) => {
        const user = getUserDetails(userId);
        const name = user?.display_name ?? "";
        return {
          value: userId,
          // 使用 Tooltip + 省略样式，保证选项和选择框回显一致
          label: (
            <Tooltip title={name} placement="top">
              <span className="flex items-center gap-1 min-w-0">
                <LucideIcons.User size={14} className="text-gray-500 shrink-0" />
                <span className="truncate max-w-[160px]">{name}</span>
              </span>
            </Tooltip>
          ),
          title: name, // 供搜索过滤使用
          disabled: isUserSuspended(userId, workspaceSlug || ""),
        };
      }),
    [workspaceMemberIds, getUserDetails, isUserSuspended, workspaceSlug]
  );

  // 新增：失焦更新（各字段）
  const handleBlurAssignee = async () => {
    if (!workspaceSlug || !caseId) return;
    if (assignee === normalizeId(caseData?.assignee)) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, assignee });
      setCaseData((prev: any) => (prev ? { ...prev, assignee } : prev));
    } catch {
      // 静默处理
    }
  };

  const handleUpdateAssine = async (v: any) => {
    if (!workspaceSlug || !caseId) return;

    if (v === normalizeId(caseData?.assignee)) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, assignee: v });
      setCaseData((prev: any) => (prev ? { ...prev, assignee: normalizeId(v) } : prev));
      setAssignee(normalizeId(v));
    } catch {
      // 静默处理
    }
  };

  const handleBlurState = async () => {
    if (!workspaceSlug || !caseId) return;
    if (stateValue === normalizeId(caseData?.state)) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, state: stateValue });
      setCaseData((prev: any) => (prev ? { ...prev, state: stateValue } : prev));
    } catch {
      // 静默处理
    }
  };

  const handleBlurType = async () => {
    if (!workspaceSlug || !caseId) return;
    if (typeValue === normalizeId(caseData?.type)) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, type: typeValue });
      setCaseData((prev: any) => (prev ? { ...prev, type: typeValue } : prev));
    } catch {
      // 静默处理
    }
  };

  const handleBlurPriority = async () => {
    if (!workspaceSlug || !caseId) return;
    if (priorityValue === normalizeId(caseData?.priority)) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, priority: priorityValue });
      setCaseData((prev: any) => (prev ? { ...prev, priority: priorityValue } : prev));
    } catch {
      // 静默处理
    }
  };

  const handleBlurPrecondition = async () => {
    console.log(2222);

    if (!workspaceSlug || !caseId) return;
    if (preconditionValue === caseData?.precondition) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, precondition: preconditionValue });
      setCaseData((prev: any) => (prev ? { ...prev, precondition: preconditionValue } : prev));
    } catch {
      // 静默处理
    }
  };

  const handleBlurRemark = async () => {
    if (!workspaceSlug || !caseId) return;
    if (remarkValue === caseData?.remark) return;
    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, remark: remarkValue });
      setCaseData((prev: any) => (prev ? { ...prev, remark: remarkValue } : prev));
    } catch {
      // 静默处理
    }
  };

  // 新增：Steps 更新逻辑（参考前置条件 onBlur）
  const handleBlurSteps = async (rowsArg?: { description?: string; result?: string }[]) => {
    if (!workspaceSlug || !caseId) return;
    const oldSteps = Array.isArray(caseData?.steps) ? caseData.steps : [];
    const mapRows = (rows: { description?: string; result?: string }[]) =>
      (rows || []).map((r) => ({ description: r?.description ?? "", result: r?.result ?? "" }));
    const filterEmpty = (rows: { description: string; result: string }[]) =>
      rows.filter((r) => !(r.description.trim() === "" && r.result.trim() === ""));
    const sourceRows = Array.isArray(rowsArg) ? rowsArg : stepsValue;
    const nextSteps = filterEmpty(mapRows(sourceRows));
    const prevStepsRaw = mapRows(oldSteps);
    if (JSON.stringify(nextSteps) === JSON.stringify(prevStepsRaw)) return;

    try {
      await caseService.updateCase(String(workspaceSlug), { id: caseId, steps: nextSteps });
      setCaseData((prev: any) => (prev ? { ...prev, steps: nextSteps } : prev));
    } catch {
      // 静默处理
    }
  };

  // 新增：容器级 onBlur 包装（焦点离开 StepsEditor 整体区域时触发）
  const handleBlurStepsWrapper = (e: React.FocusEvent<HTMLDivElement>) => {
    console.log(8888);

    const nextFocus = e.relatedTarget as Node | null;
    if (nextFocus && e.currentTarget.contains(nextFocus)) return;
    handleBlurSteps();
  };

  // 新增：监听“外部点击”作为 onBlur 的兜底，解决多条步骤删除后不触发 onBlur 的问题
  const stepsEditorWrapperRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const handlePointerDownOutside = (event: PointerEvent) => {
      const el = stepsEditorWrapperRef.current;
      if (!el) return;
      const target = event.target as Node | null;
      if (target && el.contains(target)) return; // 点击在内部，忽略
      handleBlurSteps(); // 外部点击，尝试保存
    };
    document.addEventListener("pointerdown", handlePointerDownOutside, true);
    return () => document.removeEventListener("pointerdown", handlePointerDownOutside, true);
  }, [stepsValue, caseData?.steps, workspaceSlug, caseId]);

  // 渲染加载状态
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
        <div className="relative z-10 w-[85vw] h-[90vh] max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-lg flex items-center justify-center">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // 如果没有数据且不是加载中，不渲染内容
  if (!caseData && !loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-[85vw] h-[90vh] max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-lg flex flex-col">
        <ModalHeader onClose={onClose} caseId={String(caseId ?? "")} />
        {/* 内容区域：左右布局 */}
        <div className="flex flex-1 min-h-0">
          {/* 左侧：2/3宽度 */}
          <div className="w-2/3 px-6 py-4 h-full overflow-y-auto">
            <TitleInput value={title} onChange={setTitle} onBlur={handleBlurTitle} />
            <CaseMetaForm
              assignee={assignee}
              onAssigneeChange={(v) => handleUpdateAssine(v)}
              onAssigneeBlur={handleBlurAssignee}
              assigneeOptions={assigneeOptions}
              stateValue={stateValue}
              onStateChange={(v) => setStateValue(normalizeId(v))}
              onStateBlur={handleBlurState}
              caseStateOptions={caseStateOptions}
              typeValue={typeValue}
              onTypeChange={(v) => setTypeValue(normalizeId(v))}
              onTypeBlur={handleBlurType}
              caseTypeOptions={caseTypeOptions}
              priorityValue={priorityValue}
              onPriorityChange={(v) => setPriorityValue(normalizeId(v))}
              onPriorityBlur={handleBlurPriority}
              casePriorityOptions={casePriorityOptions}
            />
            {/* Menu 导航 */}
            <div className="mt-6">
              <div className="mx-2 border-b border-gray-200">
                <nav className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("basic")}
                    className={`px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                      activeTab === "basic"
                        ? "text-blue-600 border-blue-600"
                        : "text-black border-transparent hover:text-blue-600"
                    }`}
                  >
                    基本信息
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("requirement")}
                    className={`px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                      activeTab === "requirement"
                        ? "text-blue-600 border-blue-600"
                        : "text-black border-transparent hover:text-blue-600"
                    }`}
                  >
                    产品需求
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("work")}
                    className={`px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                      activeTab === "work"
                        ? "text-blue-600 border-blue-600"
                        : "text-black border-transparent hover:text-blue-600"
                    }`}
                  >
                    工作项
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("defect")}
                    className={`px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                      activeTab === "defect"
                        ? "text-blue-600 border-blue-600"
                        : "text-black border-transparent hover:text-blue-600"
                    }`}
                  >
                    缺陷
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("execution")}
                    className={`px-2 py-3 text-sm -mb-px border-b-2 transition-colors ${
                      activeTab === "execution"
                        ? "text-blue-600 border-blue-600"
                        : "text-black border-transparent hover:text-blue-600"
                    }`}
                  >
                    执行
                  </button>
                </nav>
              </div>
            </div>

            {false}

            {activeTab === "basic" && (
              <BasicInfoPanel
                preconditionValue={preconditionValue ?? ""}
                onPreconditionChange={(v) => setPreconditionValue(v)}
                onPreconditionBlur={handleBlurPrecondition}
                stepsValue={stepsValue}
                onStepsChange={setStepsValue}
                onStepsBlur={(rows) => handleBlurSteps(rows)}
                remarkValue={remarkValue ?? ""}
                onRemarkChange={(v) => setRemarkValue(v)}
                onRemarkBlur={handleBlurRemark}
                attachmentsLoading={attachmentsLoading}
                caseAttachments={caseAttachments}
                fileInputRef={fileInputRef}
                onPickAttachments={handlePickAttachments}
                onFilesChosen={handleFilesChosen}
                onDownloadAttachment={handleDownloadAttachment}
                onRemoveCaseAttachment={(id) => handleRemoveCaseAttachment(id)}
                commentsLoading={commentsLoading}
                comments={comments}
                commentPage={commentPage}
                commentPageSize={commentPageSize}
                commentTotal={commentTotal}
                setCommentPage={(n) => setCommentPage(n)}
                fetchComments={(reset?: boolean, pageOverride?: number) => fetchComments(reset, pageOverride)}
                renderComment={(c: any) => renderComment(c)}
                newComment={newComment}
                commentPlaceholder={commentPlaceholder}
                newCommentInputRef={newCommentInputRef}
                onNewCommentChange={(v: string) => setNewComment(v)}
                onCreateComment={() => handleCreateComment()}
              />
            )}
            {activeTab === "execution" && caseId && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">{execTotal}条执行记录</div>
                </div>
                <div className="rounded  border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table
                      size="middle"
                      rowKey={(r: TExecRecord) => String(r.id ?? `${r.name}-${r.created_at}`)}
                      dataSource={execList.slice((execPage - 1) * execPageSize, execPage * execPageSize)}
                      loading={execLoading}
                      pagination={{
                        current: execPage,
                        pageSize: execPageSize,
                        total: execTotal,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        pageSizeOptions: execPageSizeOptions.map(String),
                        showTotal: (t, range) => `第 ${range[0]}-${range[1]} 条，共 ${t} 条`,
                        onChange: (p) => setExecPage(p),
                        onShowSizeChange: (_c, s) => {
                          setExecPageSize(s);
                          setExecPage(1);
                        },
                      }}
                      columns={[
                        { title: "计划名称", dataIndex: "name", key: "name" },
                        {
                          title: "执行结果",
                          dataIndex: "result",
                          key: "result",
                          render: (label: string) => {
                            const color = (enumsData?.plan_case_result || {})[label];
                            return <Tag color={color}>{label || "-"}</Tag>;
                          },
                        },
                        {
                          title: "执行人",
                          dataIndex: "created_by",
                          key: "created_by",
                          render: (uid: string | null) => (
                            <MemberDropdown
                              multiple={false}
                              value={uid ?? null}
                              onChange={() => {}}
                              disabled={true}
                              placeholder={"未知用户"}
                              className="w-full text-sm"
                              buttonContainerClassName="w-full text-left p-0 cursor-default"
                              buttonVariant="transparent-with-text"
                              buttonClassName="text-sm p-0 hover:bg-transparent hover:bg-inherit"
                              showUserDetails={true}
                              optionsClassName="z-[60]"
                            />
                          ),
                        },
                        {
                          title: "执行时间",
                          dataIndex: "created_at",
                          key: "created_at",
                          render: (v: string) => formatCNDateTime(v),
                        },
                      ]}
                    />
                  </div>
                  {!execLoading && execList.length === 0 && (
                    <div className="py-20 text-center text-gray-400">暂无执行记录</div>
                  )}
                  {execError && <div className="px-3 py-2 text-sm text-red-600">{execError}</div>}
                </div>
              </div>
            )}
            {activeTab === "requirement" && caseId && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">{currentCount}个产品需求</div>
                  <button
                    type="button"
                    onClick={() => handleOpenSelectModal("Requirement")}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <PlusOutlined /> 添加
                  </button>
                </div>
                <WorkItemDisplayModal
                  caseId={String(caseId)}
                  defaultType="Requirement"
                  reloadToken={reloadToken}
                  onCountChange={(n) => setCurrentCount(n)}
                />
              </div>
            )}
            {activeTab === "work" && caseId && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">{currentCount}个工作项</div>
                  <button
                    type="button"
                    onClick={() => handleOpenSelectModal("Task")}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <PlusOutlined /> 添加
                  </button>
                </div>
                <WorkItemDisplayModal
                  caseId={String(caseId)}
                  defaultType="Task"
                  reloadToken={reloadToken}
                  onCountChange={(n) => setCurrentCount(n)}
                />
              </div>
            )}
            {activeTab === "defect" && caseId && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">{currentCount}个缺陷</div>
                  <button
                    type="button"
                    onClick={() => handleOpenSelectModal("Bug")}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <PlusOutlined /> 添加
                  </button>
                </div>
                <WorkItemDisplayModal
                  caseId={String(caseId)}
                  defaultType="Bug"
                  reloadToken={reloadToken}
                  onCountChange={(n) => setCurrentCount(n)}
                />
              </div>
            )}
          </div>
          <SideInfoPanel caseData={caseData} />
        </div>

        {/* 底部操作区 */}
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
            onClick={onClose}
          >
            关闭
          </button>
          {/* 暂不实现保存功能 */}
        </div>
      </div>
      <WorkItemSelectModal
        isOpen={isWorkItemModalOpen}
        workspaceSlug={String(workspaceSlug ?? "")}
        onClose={() => setIsWorkItemModalOpen(false)}
        onConfirm={handleWorkItemConfirm}
        forceTypeName={forceTypeName}
        initialSelectedIssues={preselectedIssues}
      />
    </div>
  );
}

export default UpdateModal;
