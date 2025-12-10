"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Modal, Tree, Button, message } from "antd";
import { CaseService } from "@/services/qa/case.service";
import { AppstoreOutlined, PlusOutlined } from "@ant-design/icons";
import type { TreeProps } from "antd";
import { FolderOpenDot } from "lucide-react";

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  workspaceSlug: string;
  repositoryId: string;
  selectedCaseIds: string[];
  onSuccess: () => void;
};

const caseService = new CaseService();

export const MoveCaseModal: React.FC<Props> = ({
  isOpen,
  handleClose,
  workspaceSlug,
  repositoryId,
  selectedCaseIds,
  onSuccess,
}) => {
  const [modules, setModules] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(["all"]);
  const [autoExpandParent, setAutoExpandParent] = useState<boolean>(true);
  const [searchModule, setSearchModule] = useState<string>("");

  const onExpand: TreeProps["onExpand"] = (keys) => {
    setExpandedKeys(keys as string[]);
    setAutoExpandParent(false);
  };

  const fetchModules = async () => {
    if (!workspaceSlug || !repositoryId) return;
    try {
      const moduleData = await caseService.getModules(workspaceSlug, repositoryId);
      // We don't need counts for the move modal, just the structure
      setModules(moduleData);
    } catch (err) {
      console.error("获取模块失败:", err);
      message.error("获取模块列表失败");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchModules();
      setSelectedModuleId(null);
    }
  }, [isOpen, workspaceSlug, repositoryId]);

  const handleOk = async () => {
    if (!selectedModuleId) {
      message.warning("请选择目标模块");
      return;
    }
    if (selectedCaseIds.length === 0) {
      message.warning("未选择任何用例");
      return;
    }

    setLoading(true);
    try {
      // API call: updateCaseModule(workspaceSlug: string, casesId: Array<string>, moduleId: string)
      await caseService.updateCaseModule(workspaceSlug, selectedCaseIds, selectedModuleId);
      message.success("移动成功");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("移动用例失败:", error);
      message.error("移动用例失败");
    } finally {
      setLoading(false);
    }
  };

  const onSelect: TreeProps["onSelect"] = (selectedKeys, info) => {
    // 如果是“取消选择”事件（再次点击同一模块），则忽略，保持当前选中不变
    if (!info.selected) {
      if (String(info?.node?.key) === "all") {
        setSelectedModuleId(null);
      }
      return;
    }
    const key = selectedKeys[0] as string | undefined;
    const nextModuleId = !key || key === "all" ? null : key;
    setSelectedModuleId(nextModuleId);
  };

  // Custom tree rendering logic (simplified from TestCasesPage)
  const renderNodeTitle = (title: string, nodeId?: string | "all") => {
    return (
      <div className="group flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
            <FolderOpenDot size={14} />
          </span>
          <span className="text-sm text-custom-text-200">{title}</span>
        </div>
      </div>
    );
  };

  const buildTreeNodes = (list: any[]): any[] => {
    if (!Array.isArray(list)) return [];
    return list.map((node: any) => {
      const nodeId = String(node?.id);
      const childrenNodes = buildTreeNodes(node?.children || []);
      return {
        title: renderNodeTitle(node?.name ?? "-", nodeId),
        key: nodeId,
        // icon: <AppstoreOutlined />,
        children: childrenNodes,
      };
    });
  };

  const filterModulesByName = (list: any[], q: string): any[] => {
    if (!q) return list || [];
    const query = q.trim().toLowerCase();
    const walk = (nodes: any[]): any[] => {
      return (nodes || [])
        .map((n) => {
          const name = String(n?.name || "").toLowerCase();
          const childMatches = walk(n?.children || []);
          const selfMatch = name.includes(query);
          if (selfMatch || childMatches.length) {
            return { ...n, children: childMatches };
          }
          return null;
        })
        .filter(Boolean) as any[];
    };
    return walk(list || []);
  };

  const filteredModules = useMemo(() => filterModulesByName(modules, searchModule), [modules, searchModule]);

  const treeData = [
    {
      title: (
        <div className="group flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 text-custom-text-300">
              <AppstoreOutlined />
            </span>
            <span className="text-sm font-medium text-custom-text-200">全部模块</span>
          </div>
        </div>
      ),
      key: "all",
      // icon: <AppstoreOutlined />,
      children: buildTreeNodes(filteredModules),
    },
  ];

  return (
    <Modal
      title="移动到模块"
      open={isOpen}
      onCancel={handleClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText="确定"
      cancelText="取消"
    >
      <div className="h-[400px] overflow-y-auto border rounded p-2">
        <Tree
          blockNode
          onSelect={onSelect}
          onExpand={onExpand}
          expandedKeys={expandedKeys}
          autoExpandParent={autoExpandParent}
          treeData={treeData}
          selectedKeys={selectedModuleId ? [selectedModuleId] : ["all"]}
          className="py-2 custom-tree-indent"
        />
      </div>
    </Modal>
  );
};
