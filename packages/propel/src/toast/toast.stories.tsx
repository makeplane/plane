import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast, setToast, updateToast, setPromiseToast, TOAST_TYPE } from "./toast";

const meta = {
  title: "Components/Toast",
  component: Toast,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    theme: "light",
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Provider: Story = {
  render() {
    return (
      <div>
        <Toast theme="light" />
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Toast provider is required to display toasts. It should be added to your app root.
          </p>
          <code className="block rounded bg-gray-100 p-2 text-xs">{`<Toast theme="light" />`}</code>
        </div>
      </div>
    );
  },
};

export const Success: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Your changes have been saved successfully.",
            })
          }
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Show Success Toast
        </button>
      </>
    );
  },
};

export const Error: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error",
              message: "Something went wrong. Please try again.",
            })
          }
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Show Error Toast
        </button>
      </>
    );
  },
};

export const Warning: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.WARNING,
              title: "Warning",
              message: "This action cannot be undone.",
            })
          }
          className="rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600"
        >
          Show Warning Toast
        </button>
      </>
    );
  },
};

export const Info: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.INFO,
              title: "Information",
              message: "Here's some helpful information for you.",
            })
          }
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Show Info Toast
        </button>
      </>
    );
  },
};

export const Loading: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.LOADING,
              title: "Loading...",
            })
          }
          className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Show Loading Toast
        </button>
      </>
    );
  },
};

export const WithActionItems: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "File uploaded",
              message: "Your file has been uploaded successfully.",
              actionItems: (
                <div className="flex items-center gap-1 text-xs text-custom-text-200">
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-custom-primary px-2 py-1 hover:bg-custom-background-90 font-medium rounded"
                  >
                    {`View work item`}
                  </a>
                  <button className="cursor-pointer hidden group-hover:flex px-2 py-1 text-custom-text-300 hover:text-custom-text-200 hover:bg-custom-background-90 rounded">
                    Copy link
                  </button>
                </div>
              ),
            })
          }
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Show Toast with Action
        </button>
      </>
    );
  },
};

export const UpdateToast: Story = {
  render() {
    const handleUpdate = () => {
      const id = setToast({
        type: TOAST_TYPE.LOADING,
        title: "Processing...",
      });

      setTimeout(() => {
        updateToast(id, {
          type: TOAST_TYPE.SUCCESS,
          title: "Complete!",
          message: "The operation has finished successfully.",
        });
      }, 2000);
    };

    return (
      <>
        <Toast theme="light" />
        <button onClick={handleUpdate} className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">
          Update Toast After 2s
        </button>
      </>
    );
  },
};

export const PromiseToast: Story = {
  render() {
    const handlePromise = () => {
      const promise = new Promise<{ name?: string; error?: string }>((resolve, reject) => {
        setTimeout(() => {
          Math.random() > 0.5 ? resolve({ name: "Success data" }) : reject({ error: "Failed" });
        }, 2000);
      });

      setPromiseToast(promise, {
        loading: "Processing request...",
        success: {
          title: "Request completed!",
          message: (data) => `Successfully processed: ${data.name}`,
        },
        error: {
          title: "Request failed",
          message: (error) => `Error: ${error.error}`,
        },
      });
    };

    return (
      <>
        <Toast theme="light" />
        <button onClick={handlePromise} className="rounded bg-purple-500 px-4 py-2 text-white hover:bg-purple-600">
          Show Promise Toast
        </button>
      </>
    );
  },
};

export const AllTypes: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Success",
                message: "Operation successful",
              })
            }
            className="rounded bg-green-500 px-3 py-2 text-sm text-white hover:bg-green-600"
          >
            Success
          </button>
          <button
            onClick={() =>
              setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error",
                message: "Operation failed",
              })
            }
            className="rounded bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600"
          >
            Error
          </button>
          <button
            onClick={() =>
              setToast({
                type: TOAST_TYPE.WARNING,
                title: "Warning",
                message: "Please be careful",
              })
            }
            className="rounded bg-yellow-500 px-3 py-2 text-sm text-white hover:bg-yellow-600"
          >
            Warning
          </button>
          <button
            onClick={() =>
              setToast({
                type: TOAST_TYPE.INFO,
                title: "Info",
                message: "Here's some info",
              })
            }
            className="rounded bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
          >
            Info
          </button>
          <button
            onClick={() =>
              setToast({
                type: TOAST_TYPE.LOADING,
                title: "Loading",
              })
            }
            className="rounded bg-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-600"
          >
            Loading
          </button>
        </div>
      </>
    );
  },
};

export const MultipleToasts: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "First toast",
              message: "This is the first toast",
            });
            setTimeout(() => {
              setToast({
                type: TOAST_TYPE.INFO,
                title: "Second toast",
                message: "This is the second toast",
              });
            }, 500);
            setTimeout(() => {
              setToast({
                type: TOAST_TYPE.WARNING,
                title: "Third toast",
                message: "This is the third toast",
              });
            }, 1000);
          }}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Show Multiple Toasts
        </button>
      </>
    );
  },
};

export const TitleOnly: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Saved!",
            })
          }
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Show Title Only
        </button>
      </>
    );
  },
};

export const LongMessage: Story = {
  render() {
    return (
      <>
        <Toast theme="light" />
        <button
          onClick={() =>
            setToast({
              type: TOAST_TYPE.INFO,
              title: "Important Information",
              message:
                "This is a longer message that provides more detailed information about what happened and what the user should do next.",
            })
          }
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Show Long Message
        </button>
      </>
    );
  },
};
