import type { Meta, StoryObj } from "@storybook/react-vite";

import { TOAST_TYPE, Toast, setToast, ToastProps } from "./index";
import React from "react";

const meta = {
  title: "Components/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    theme: {
      options: ["light", "dark", "system"],
      control: { type: "select" },
    },
  },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

const GlobalToast = ({ children, theme }: { children: React.ReactNode; theme: ToastProps["theme"] }) => (
  <>
    <Toast theme={theme} />
    {children}
  </>
);

export const Default: Story = {
  args: {
    theme: "light",
  },
  render: ({ theme }) => {
    const activeTheme = theme as ToastProps["theme"];
    return (
      <GlobalToast theme={activeTheme}>
        <div className="flex gap-2">
          {/* Success Toast */}
          <button
            onClick={() => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Success",
                message: "This is a success message",
              });
            }}
            className="bg-custom-background-100 border border-custom-border-200 rounded-md px-4 py-2"
          >
            Success
          </button>
          {/* Error Toast */}
          <button
            onClick={() => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error",
                message: "This is an error message",
              });
            }}
            className="bg-custom-background-100 border border-custom-border-200 rounded-md px-4 py-2"
          >
            Error
          </button>
          {/* Toast with action items */}
          <button
            onClick={() => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Action Items",
                message: "This is an action items message",
                actionItems: (
                  <div className="flex items-center gap-1 text-xs text-custom-text-200">
                    <a
                      href="https://www.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-bold rounded"
                    >
                      Action 1
                    </a>

                    <button className="cursor-pointer group-hover:flex px-2 py-1 text-custom-text-300 hover:text-custom-text-200 hover:bg-custom-background-90 rounded">
                      Action 2
                    </button>
                  </div>
                ),
              });
            }}
            className="bg-custom-background-100 border border-custom-border-200 rounded-md px-4 py-2"
          >
            Action Items
          </button>
        </div>
      </GlobalToast>
    );
  },
};

export const PromiseToast: Story = {
  args: {
    theme: "light",
  },
  render: ({ theme }) => {
    const activeTheme = theme as ToastProps["theme"];
    return <></>;
  },
};
