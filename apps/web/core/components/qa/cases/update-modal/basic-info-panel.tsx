"use client";
import React from "react";
import { Button, Table, Tooltip, Modal } from "antd";
import * as LucideIcons from "lucide-react";
import { convertBytesToSize, renderFormattedDate } from "@plane/utils";
import { RichTextEditor, StepsEditor } from "../util";

type BasicInfoPanelProps = {
  preconditionValue: string;
  onPreconditionChange: (v: string) => void;
  onPreconditionBlur: () => void;

  stepsValue: { description?: string; result?: string }[];
  onStepsChange: (v: { description?: string; result?: string }[]) => void;
  onStepsBlur: () => void;

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
  } = props;

  return (
    <div className="space-y-4 rounded-b-md border-x border-b px-4 py-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">前置条件</label>
        <RichTextEditor value={preconditionValue ?? ""} onChange={onPreconditionChange} onBlur={onPreconditionBlur} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">测试步骤</label>
        <StepsEditor value={stepsValue} onChange={onStepsChange} onBlur={onStepsBlur} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">备注（remark）</label>
        <RichTextEditor value={remarkValue ?? ""} onChange={onRemarkChange} onBlur={onRemarkBlur} />
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">附件</span>
          <Tooltip title="选择文件">
            <Button type="text" icon={<LucideIcons.Upload size={16} className="text-gray-600 hover:text-blue-600" />} onClick={onPickAttachments} />
          </Tooltip>
        </div>
        <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={onFilesChosen} />
        <div style={{ marginTop: 8 }}>
          <Table
            size="small"
            loading={attachmentsLoading}
            rowKey={(r: any) => String(r?.id ?? "")}
            dataSource={caseAttachments}
            pagination={false}
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
                    if (mime.startsWith("image/")) return <LucideIcons.Image size={18} className="text-gray-500" />;
                    if (mime.startsWith("video/")) return <LucideIcons.Video size={18} className="text-gray-500" />;
                    if (mime.startsWith("audio/")) return <LucideIcons.Music size={18} className="text-gray-500" />;
                    if (mime === "text/plain" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                      return <LucideIcons.FileText size={18} className="text-gray-500" />;
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
                      return <LucideIcons.Archive size={18} className="text-gray-500" />;
                    return <LucideIcons.File size={18} className="text-gray-500" />;
                  })();
                  return (
                    <div className="flex items-center gap-2 min-w-0">
                      {icon}
                      <span className="truncate" style={{ maxWidth: 360, fontSize: 16 }}>
                        {name}
                      </span>
                      <span style={{ fontSize: 14, color: "#888" }}>{sizeText}</span>
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
                        icon={<LucideIcons.Download size={16} className="text-gray-600 hover:text-blue-600" />}
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
                        icon={<LucideIcons.Trash2 size={16} className="text-gray-600 hover:text-red-600" />}
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
      </div>
    </div>
  );
}

