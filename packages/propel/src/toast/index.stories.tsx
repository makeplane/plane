import type { Meta, StoryObj } from "@storybook/react-vite";

import { TOAST_TYPE, Toast, setPromiseToast, setToast, ToastProps } from "./index";
import React from "react";

const Button = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
    bg-white
     text-custom-text-200 
    rounded-[30px] 
    shadow-[-20px_-20px_60px_#ffffff]
    hover:text-custom-text-100
    active:shadow-[inset_20px_20px_60px_#bebebe,inset_-20px_-20px_60px_#ffffff]
    transition-all duration-300 focus:outline-none
    border
    "
  >
    {children}
  </button>
);

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
        <div className="flex flex-wrap gap-5">
          {/* Success Toast */}
          <Button
            onClick={() => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Saved",
                message: "Your changes were saved successfully.",
              });
            }}
          >
            ✅ Success
          </Button>
          {/* Error Toast */}
          <Button
            onClick={() => {
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Action failed",
                message: "We couldn't complete that action. Please try again.",
              });
            }}
          >
            ❌ Error
          </Button>
          {/* Toast with action items */}
          <Button
            onClick={() => {
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Next steps",
                message: "Pick an option to continue.",
                actionItems: (
                  <div className="flex items-center gap-1 text-xs text-custom-text-200">
                    <a
                      href="https://plane.so"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-semibold rounded"
                    >
                      View docs
                    </a>

                    <button
                      className="cursor-pointer px-2 py-1 text-custom-text-300 hover:text-custom-text-100 hover:bg-custom-background-90 rounded"
                      onClick={() =>
                        setToast({
                          type: TOAST_TYPE.SUCCESS,
                          title: "Retried",
                          message: "We ran that action again.",
                        })
                      }
                    >
                      Retry
                    </button>
                  </div>
                ),
              });
            }}
          >
            🧭 Action items
          </Button>
          {/* Promise Toast */}
          <Button
            onClick={() => {
              const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                  resolve("Success");
                }, 1000);
              });
              setPromiseToast(promise, {
                loading: "Working on it...",
                success: {
                  title: "All set",
                  message: () => "Operation completed successfully.",
                },
                error: {
                  title: "Request failed",
                  message: () => "Something went wrong. Please try again.",
                },
              });
            }}
          >
            ⏳→✅ Promise success
          </Button>
          {/* Promise Error Toast */}
          <Button
            onClick={() => {
              const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                  reject("Error");
                }, 1000);
              });
              setPromiseToast(promise, {
                loading: "Working on it...",
                success: {
                  title: "All set",
                  message: () => "Operation completed successfully.",
                },
                error: {
                  title: "Request failed",
                  message: () => "Something went wrong. Please try again.",
                },
              });
            }}
          >
            ⏳→❌ Promise error
          </Button>
        </div>
      </GlobalToast>
    );
  },
};
