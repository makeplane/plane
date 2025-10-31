// 统一的测试管理路径工具

// 基础路径：/{workspaceSlug}/test-management
export const tmBasePath = (workspaceSlug: string) => `/${workspaceSlug}/test-management`;

// 归一化路径（移除末尾多余斜杠）
const normalizePath = (path: string) => path.replace(/\/+$/, "");

// 是否处于“测试用例库（概览）”页：等价于基础路径
export const isTMOverviewActive = (pathname: string, workspaceSlug: string) => {
  return normalizePath(pathname) === normalizePath(tmBasePath(workspaceSlug));
};