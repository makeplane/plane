"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@plane/propel/table";
import { Tag } from "antd";
import { renderFormattedDate } from "@plane/utils";
import { useRouter } from "next/navigation";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { Unlink } from "lucide-react";

type Props = {
  data: TestCaseItem[];
  loading: boolean;
  workspaceSlug: string;
  onDelete: (caseId: string | number) => void | Promise<void>;
};

type TestCaseItem = {
  id: string | number;
  name: string;
  created_at?: string;
  review?: string;
  repository?: any;
};

export const QaCasesCollapsibleContent: React.FC<Props> = (props) => {
  const { data, loading, workspaceSlug, onDelete } = props;
  const router = useRouter();

  const getReviewColor = (review?: string) => {
    switch (review) {
      case "通过":
        return "green";
      case "不通过":
        return "red";
      case "重新提审":
      case "建议":
        return "gold";
      case "评审中":
        return "blue";
      case "未评审":
      default:
        return "default";
    }
  };
  const pid = typeof window !== "undefined" ? sessionStorage.getItem("currentProjectId") || "" : "";

  return (
    <div className="px-2.5 pb-2.5">
      <div className="rounded-md">
        <Table>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="h-20 grid place-items-center text-sm text-custom-text-300">加载中...</div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <div className="h-20 grid place-items-center text-sm text-custom-text-300">暂无相关用例</div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, idx) => (
                <TableRow
                  key={String(item.id)}
                  className="hover:bg-[#f7f7f7] cursor-pointer"
                  onClick={() => {
                    const repoId = typeof item.repository === "string" ? item.repository : item?.repository?.id;
                    if (!repoId) {
                      setToast({ type: TOAST_TYPE.ERROR, title: "无法跳转", message: "缺少用例仓库ID" });
                      return;
                    }
                    const url = `/${workspaceSlug}/projects/${pid}/test-management/cases/?repositoryId=${repoId}&peekCase=${item.id}`;
                    router.push(url);
                  }}
                >
                  <TableCell className="max-w-[360px] truncate" title={item.name}>
                    {item.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Tag color={getReviewColor(item.review)} className="inline-flex justify-center w-[55px]">
                      {item.review || "-"}
                    </Tag>
                  </TableCell>
                  <TableCell>{item.created_at ? renderFormattedDate(item.created_at) : "-"}</TableCell>
                  <TableCell className="w-10">
                    <Button
                      variant="neutral-primary"
                      size="sm"
                      className="p-1 rounded-md border-none !bg-transparent shadow-none hover:!bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                      }}
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
