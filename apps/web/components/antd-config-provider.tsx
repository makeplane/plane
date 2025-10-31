"use client";

import { ConfigProvider, theme } from "antd";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";
import zhCN from "antd/locale/zh_CN";

interface AntdConfigProviderProps {
  children: ReactNode;
}

export const AntdConfigProvider = ({ children }: AntdConfigProviderProps) => {
  const { resolvedTheme } = useTheme();

  // 根据当前主题配置 Ant Design 主题
  const antdTheme = {
    algorithm: resolvedTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      // 与项目主题色保持一致
      colorPrimary: "rgb(var(--color-primary-100))",
      colorBgContainer: "rgb(var(--color-background-100))",
      colorBgElevated: "rgb(var(--color-background-200))",
      colorBorder: "rgb(var(--color-border-200))",
      colorText: "rgb(var(--color-text-100))",
      colorTextSecondary: "rgb(var(--color-text-200))",
      colorTextTertiary: "rgb(var(--color-text-300))",
      borderRadius: 6,
      fontSize: 14,
    },
  };

  return (
    <ConfigProvider locale={zhCN} componentSize="middle">
      {children}
    </ConfigProvider>
  );
};
