"use client";
import React from "react";
import { Button, Table, Tooltip, Modal, Input, Spin } from "antd";
import * as LucideIcons from "lucide-react";
import { convertBytesToSize, renderFormattedDate } from "@plane/utils";
import { RichTextEditor, StepsEditor } from "../util";

type BasicInfoPanelProps = {
  preconditionValue: string;
  onPreconditionChange: (v: string) => void;
  onPreconditionBlur: () => void;

  stepsValue: { description?: string; result?: string }[];
  onStepsChange: (v: { description?: string; result?: string }[]) => void;
  onStepsBlur: (v: { description?: string; result?: string }[]) => void;

  remarkValue: string;
  onRemarkChange: (v: string) => void;
  onRemarkBlur: () => void;

  attachmentsLoading: boolean;
  caseAttachments: any[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  onPickAttachments: () => void;
  onFilesChosen: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadAttachment: (attachment: any) => void;
  onRemoveCaseAttachment: (id: string) => void;

  commentsLoading: boolean;
  comments: any[];
  commentPage: number;
  commentPageSize: number;
  commentTotal: number;
  setCommentPage: (n: number) => void;
  fetchComments: (reset?: boolean, pageOverride?: number) => void;
  renderComment: (c: any) => React.ReactNode;
  newComment: string;
  commentPlaceholder: string;
  newCommentInputRef: React.RefObject<any>;
  onNewCommentChange: (v: string) => void;
  onCreateComment: () => void;
};

export function BasicInfoPanel(props: BasicInfoPanelProps) {
  const {
    preconditionValue,
    onPreconditionChange,
    onPreconditionBlur,
    stepsValue,
    onStepsChange,
    onStepsBlur,
    remarkValue,
    onRemarkChange,
    onRemarkBlur,
    attachmentsLoading,
    caseAttachments,
    fileInputRef,
    onPickAttachments,
    onFilesChosen,
    onDownloadAttachment,
    onRemoveCaseAttachment,
    commentsLoading,
    comments,
    commentPage,
    commentPageSize,
    commentTotal,
    setCommentPage,
    fetchComments,
    renderComment,
    newComment,
    commentPlaceholder,
    newCommentInputRef,
    onNewCommentChange,
    onCreateComment,
  } = props;

  return (
    <div className="space-y-8 rounded-b-md border-gray-200 px-6 py-6 transition-colors focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100">
      <div>
        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <LucideIcons.ListChecks size={16} className="text-gray-500" aria-hidden="true" />
          前置条件
        </label>
        <RichTextEditor
          value={preconditionValue ?? ""}
          onChange={onPreconditionChange}
          onBlur={onPreconditionBlur}
          aria-label="前置条件"
        />
      </div>
      <div>
        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <LucideIcons.ListOrdered size={16} className="text-gray-500" aria-hidden="true" />
          测试步骤
        </label>
        <StepsEditor value={stepsValue} onChange={onStepsChange} onBlur={onStepsBlur} aria-label="测试步骤" />
      </div>
      <div>
        <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <LucideIcons.StickyNote size={16} className="text-gray-500" aria-hidden="true" />
          备注
        </label>
        <RichTextEditor value={remarkValue ?? ""} onChange={onRemarkChange} onBlur={onRemarkBlur} aria-label="备注" />
      </div>
      <section
        aria-labelledby="attachments-title"
        aria-busy={attachmentsLoading}
        className="transition-colors"
        role="group"
      >
        <div className="mb-3 flex items-center justify-between">
          <span id="attachments-title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <LucideIcons.Paperclip size={16} className="text-gray-500" aria-hidden="true" />
            附件
          </span>
          <Tooltip title="上传文件">
            <Button
              type="text"
              aria-label="上传附件"
              icon={<LucideIcons.Upload size={16} className="text-gray-600 hover:text-blue-600" aria-hidden="true" />}
              onClick={onPickAttachments}
            />
          </Tooltip>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: "none" }}
          aria-hidden="true"
          onChange={onFilesChosen}
        />
        <div className="mt-2">
          <Table
            size="small"
            loading={attachmentsLoading}
            rowKey={(r: any) => String(r?.id ?? "")}
            dataSource={caseAttachments}
            pagination={false}
            rowClassName={() => "hover:bg-gray-50 focus:bg-blue-50"}
            onRow={(record: any) => ({
              tabIndex: 0,
              onKeyDown: (e) => {
                if ((e as React.KeyboardEvent).key === "Enter") onDownloadAttachment(record);
              },
            })}
            columns={[
              {
                title: "名称",
                dataIndex: ["attributes", "name"],
                render: (_: any, record: any) => {
                  const name = String(record?.attributes?.name ?? record?.asset ?? "-");
                  const sizeNum = Number(record?.attributes?.size ?? 0);
                  const sizeText = (() => {
                    try {
                      return convertBytesToSize(sizeNum);
                    } catch {
                      return `${(sizeNum / 1024).toFixed(2)}KB`;
                    }
                  })();
                  const mime: string = String(record?.attributes?.type ?? "");
                  const icon = (() => {
                    if (mime.startsWith("image/"))
                      return <LucideIcons.Image size={16} className="text-gray-500" aria-hidden="true" />;
                    if (mime.startsWith("video/"))
                      return <LucideIcons.Video size={16} className="text-gray-500" aria-hidden="true" />;
                    if (mime.startsWith("audio/"))
                      return <LucideIcons.Music size={16} className="text-gray-500" aria-hidden="true" />;
                    if (
                      mime === "text/plain" ||
                      mime === "application/pdf" ||
                      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    )
                      return <LucideIcons.FileText size={16} className="text-gray-500" aria-hidden="true" />;
                    if (
                      [
                        "application/zip",
                        "application/x-zip",
                        "application/x-zip-compressed",
                        "application/x-7z-compressed",
                        "application/x-rar",
                        "application/x-rar-compressed",
                        "application/x-tar",
                        "application/gzip",
                      ].includes(mime)
                    )
                      return <LucideIcons.Archive size={16} className="text-gray-500" aria-hidden="true" />;
                    return <LucideIcons.File size={16} className="text-gray-500" aria-hidden="true" />;
                  })();
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      {icon}
                      <span className="truncate max-w-[360px] text-sm text-gray-700">{name}</span>
                      <span className="text-xs text-gray-500">{sizeText}</span>
                    </div>
                  );
                },
              },
              {
                title: "类型",
                dataIndex: ["attributes", "type"],
                render: (v: any) => {
                  const mime = String(v ?? "");
                  if (mime.startsWith("image/")) return "图片";
                  if (mime.startsWith("video/")) return "视频";
                  if (mime.startsWith("audio/")) return "音频";
                  if (mime === "text/plain") return "文本";
                  if (mime === "application/pdf") return "PDF文档";
                  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "Word";
                  return "-";
                },
              },
              {
                title: "上传时间",
                dataIndex: "created_at",
                render: (v: any) => {
                  const dt = String(v ?? "");
                  try {
                    return renderFormattedDate(dt, "YYYY年MM月DD日");
                  } catch {
                    return dt;
                  }
                },
              },
              {
                title: "操作",
                key: "actions",
                render: (_: any, record: any) => (
                  <div className="flex items-center gap-3">
                    <Tooltip title="下载">
                      <Button
                        type="text"
                        aria-label="下载附件"
                        icon={
                          <LucideIcons.Download
                            size={16}
                            className="text-gray-600 hover:text-blue-600"
                            aria-hidden="true"
                          />
                        }
                        onClick={() =>
                          Modal.confirm({
                            title: "下载附件",
                            content: `确认下载：${String(record?.attributes?.name ?? "附件")}`,
                            onOk: () => onDownloadAttachment(record),
                          })
                        }
                      />
                    </Tooltip>
                    <Tooltip title="删除">
                      <Button
                        type="text"
                        danger
                        aria-label="删除附件"
                        icon={
                          <LucideIcons.Trash2
                            size={16}
                            className="text-gray-600 hover:text-red-600"
                            aria-hidden="true"
                          />
                        }
                        onClick={() =>
                          Modal.confirm({
                            title: "删除附件",
                            content: `确认删除：${String(record?.attributes?.name ?? "附件")}`,
                            onOk: () => onRemoveCaseAttachment(String(record?.id ?? "")),
                          })
                        }
                      />
                    </Tooltip>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </section>
      <div className="mt-6 h-[420px] flex flex-col rounded bg-white">
        <span id="attachments-title" className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <LucideIcons.MessageSquareMore size={16} className="text-gray-500" aria-hidden="true" />
          评论
        </span>
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
          {commentsLoading ? (
            <div className="py-6 flex justify-center">
              <Spin />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-gray-500">暂无评论</div>
          ) : (
            <div>
              {comments.map((c) => renderComment(c))}
              {commentPage * commentPageSize < commentTotal && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                    onClick={() => {
                      const nextPage = commentPage + 1;
                      setCommentPage(nextPage);
                      fetchComments(false, nextPage);
                    }}
                  >
                    加载更多
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className=" px-3 py-2 bg-white">
          <div className="flex items-start gap-2">
            <Input.TextArea
              ref={newCommentInputRef}
              placeholder={commentPlaceholder}
              autoSize={{ minRows: 2, maxRows: 4 }}
              value={newComment}
              onChange={(e) => onNewCommentChange(e.target.value)}
            />
            <button
              type="button"
              className="rounded bg-blue-600 text-white px-3 py-2 text-sm shrink-0"
              onClick={onCreateComment}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
