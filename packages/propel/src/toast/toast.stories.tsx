import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toast, ToastStatic, setToast, updateToast, setPromiseToast, TOAST_TYPE } from "./toast";

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
          <p className="text-13 text-gray-600">
            Toast provider is required to display toasts. It should be added to your app root.
          </p>
          <code className="block rounded-sm bg-gray-100 p-2 text-11">{`<Toast theme="light" />`}</code>
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
          className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color hover:bg-success-primary/90"
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
          className="rounded-sm bg-danger-primary px-4 py-2 text-13 text-on-color hover:bg-danger-primary/90"
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
          className="rounded-sm bg-warning-primary px-4 py-2 text-13 text-on-color hover:bg-warning-primary/90"
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
          className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
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
          className="rounded-sm bg-layer-2 border border-subtle px-4 py-2 text-13 text-primary hover:bg-layer-1"
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
                <>
                  <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
                  <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
                </>
              ),
            })
          }
          className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color hover:bg-success-primary/90"
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
        <button
          onClick={handleUpdate}
          className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
        >
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
        <button
          onClick={handlePromise}
          className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
        >
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
            className="rounded-sm bg-success-primary px-3 py-2 text-13 text-on-color hover:bg-success-primary/90"
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
            className="rounded-sm bg-danger-primary px-3 py-2 text-13 text-on-color hover:bg-danger-primary/90"
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
            className="rounded-sm bg-warning-primary px-3 py-2 text-13 text-on-color hover:bg-warning-primary/90"
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
            className="rounded-sm bg-accent-primary px-3 py-2 text-13 text-on-color hover:bg-accent-primary/90"
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
            className="rounded-sm bg-layer-2 border border-subtle px-3 py-2 text-13 text-primary hover:bg-layer-1"
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
          className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
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
          className="rounded-sm bg-success-primary px-4 py-2 text-13 text-on-color hover:bg-success-primary/90"
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
          className="rounded-sm bg-accent-primary px-4 py-2 text-13 text-on-color hover:bg-accent-primary/90"
        >
          Show Long Message
        </button>
      </>
    );
  },
};

// ========== Static Variants ==========

export const StaticVariants: Story = {
  render() {
    return (
      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-13 text-secondary mb-2 font-medium">All toast variants (static):</p>
        </div>
        <div className="flex flex-col gap-3">
          <ToastStatic type={TOAST_TYPE.SUCCESS} title="Success" message="Your changes have been saved successfully." />
          <ToastStatic type={TOAST_TYPE.ERROR} title="Error" message="Something went wrong. Please try again." />
          <ToastStatic type={TOAST_TYPE.WARNING} title="Warning" message="This action cannot be undone." />
          <ToastStatic type={TOAST_TYPE.INFO} title="Information" message="Here's some helpful information for you." />
          <ToastStatic type={TOAST_TYPE.LOADING} title="Loading..." />
        </div>
      </div>
    );
  },
};

export const StaticSuccess: Story = {
  render() {
    return (
      <ToastStatic
        type={TOAST_TYPE.SUCCESS}
        title="Changes saved"
        message="Your changes have been saved successfully."
      />
    );
  },
};

export const StaticError: Story = {
  render() {
    return <ToastStatic type={TOAST_TYPE.ERROR} title="Upload failed" message="Failed to upload file. Try again." />;
  },
};

export const StaticWarning: Story = {
  render() {
    return (
      <ToastStatic
        type={TOAST_TYPE.WARNING}
        title="Unsaved changes"
        message="You have unsaved changes. Save before leaving."
      />
    );
  },
};

export const StaticInfo: Story = {
  render() {
    return (
      <ToastStatic
        type={TOAST_TYPE.INFO}
        title="New feature available"
        message="Check out our latest feature in settings."
      />
    );
  },
};

export const StaticLoading: Story = {
  render() {
    return <ToastStatic type={TOAST_TYPE.LOADING} title="Processing your request..." />;
  },
};

export const StaticWithActions: Story = {
  render() {
    return (
      <ToastStatic
        type={TOAST_TYPE.SUCCESS}
        title="File uploaded"
        message="Your file has been uploaded successfully."
        actionItems={
          <>
            <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
            <button className="text-13 font-medium text-primary hover:text-secondary">Button</button>
          </>
        }
      />
    );
  },
};

export const StaticDarkMode: Story = {
  render() {
    return (
      <div className="flex flex-col gap-3 p-6 bg-canvas rounded-lg" data-theme="dark">
        <p className="text-13 text-secondary mb-2 font-medium">Toast variants in dark mode:</p>
        <ToastStatic
          type={TOAST_TYPE.SUCCESS}
          title="Success"
          message="Operation completed successfully."
          theme="dark"
        />
        <ToastStatic type={TOAST_TYPE.ERROR} title="Error" message="An error occurred." theme="dark" />
        <ToastStatic type={TOAST_TYPE.WARNING} title="Warning" message="Please proceed with caution." theme="dark" />
        <ToastStatic type={TOAST_TYPE.INFO} title="Information" message="Here's some useful info." theme="dark" />
        <ToastStatic type={TOAST_TYPE.LOADING} title="Loading..." theme="dark" />
      </div>
    );
  },
};

// ========== Design Tokens Documentation ==========

export const DesignTokens: Story = {
  render() {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-16 font-semibold text-primary mb-2">Toast Design Tokens</h2>
          <p className="text-13 text-secondary">
            The toast component uses semantic design tokens from the Plane design system.
          </p>
        </div>

        <div>
          <h3 className="text-14 font-semibold text-primary mb-3">Token Mapping by Variant</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-11 border border-subtle rounded-lg">
              <thead>
                <tr className="bg-layer-1">
                  <th className="text-left px-3 py-2 font-semibold text-primary border-b border-subtle">Variant</th>
                  <th className="text-left px-3 py-2 font-semibold text-primary border-b border-subtle">Title Text</th>
                  <th className="text-left px-3 py-2 font-semibold text-primary border-b border-subtle">Icon BG</th>
                  <th className="text-left px-3 py-2 font-semibold text-primary border-b border-subtle">Toast BG</th>
                  <th className="text-left px-3 py-2 font-semibold text-primary border-b border-subtle">Border</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-subtle">
                  <td className="px-3 py-2 font-medium text-primary">Success</td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-success-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-surface-1</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">border-subtle</code>
                  </td>
                </tr>
                <tr className="border-b border-subtle">
                  <td className="px-3 py-2 font-medium text-primary">Error</td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-danger-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-surface-1</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">border-subtle</code>
                  </td>
                </tr>
                <tr className="border-b border-subtle">
                  <td className="px-3 py-2 font-medium text-primary">Warning</td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-warning-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-surface-1</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">border-subtle</code>
                  </td>
                </tr>
                <tr className="border-b border-subtle">
                  <td className="px-3 py-2 font-medium text-primary">Info</td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-accent-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-surface-1</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">border-subtle</code>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-primary">Loading</td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-primary</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-layer-2</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">bg-surface-1</code>
                  </td>
                  <td className="px-3 py-2">
                    <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">border-subtle</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-14 font-semibold text-primary mb-3">Typography</h3>
            <ul className="space-y-2 text-12 text-secondary">
              <li>
                <span className="font-medium text-primary">Title:</span>{" "}
                <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-14 font-semibold</code>
              </li>
              <li>
                <span className="font-medium text-primary">Message:</span>{" "}
                <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-13</code>
              </li>
              <li>
                <span className="font-medium text-primary">Message Color:</span>{" "}
                <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-secondary</code>
              </li>
              <li>
                <span className="font-medium text-primary">Action Button:</span>{" "}
                <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-13 font-medium</code>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-14 font-semibold text-primary mb-3">Dimensions & Styling</h3>
            <ul className="space-y-2 text-12 text-secondary">
              <li>
                <span className="font-medium text-primary">Width:</span> 350px
              </li>
              <li>
                <span className="font-medium text-primary">Padding:</span> 16px (p-4)
              </li>
              <li>
                <span className="font-medium text-primary">Border Radius:</span> 8px (rounded-lg)
              </li>
              <li>
                <span className="font-medium text-primary">Shadow:</span>{" "}
                <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">shadow-raised-200</code>
              </li>
              <li>
                <span className="font-medium text-primary">Border Width:</span> 1px
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-14 font-semibold text-primary mb-3">Icon Specifications</h3>
          <ul className="space-y-2 text-12 text-secondary">
            <li>
              <span className="font-medium text-primary">Icon Size:</span> 20x20px
            </li>
            <li>
              <span className="font-medium text-primary">Icon Stroke Width:</span> 2px
            </li>
            <li>
              <span className="font-medium text-primary">Icon Container:</span> 40x40px circular (w-10 h-10
              rounded-full)
            </li>
            <li>
              <span className="font-medium text-primary">Icon Color:</span>{" "}
              <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">text-on-color</code>
            </li>
            <li>
              <span className="font-medium text-primary">Icon Background:</span>{" "}
              <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">
                bg-{"{"}variant{"}"}-primary
              </code>
            </li>
            <li>
              <span className="font-medium text-primary">Close Icon Size:</span> 16x16px
            </li>
            <li>
              <span className="font-medium text-primary">Close Icon Color:</span>{" "}
              <code className="text-10 bg-layer-1 px-1.5 py-0.5 rounded">
                text-icon-secondary hover:text-icon-tertiary
              </code>
            </li>
          </ul>
        </div>

        <div className="bg-layer-1 p-4 rounded-lg">
          <h3 className="text-14 font-semibold text-primary mb-2">Visual Examples</h3>
          <p className="text-12 text-secondary mb-4">See how the tokens are applied across all toast variants:</p>
          <div className="flex flex-col gap-3">
            <ToastStatic
              type={TOAST_TYPE.SUCCESS}
              title="Success"
              message="Your changes have been saved successfully."
            />
            <ToastStatic type={TOAST_TYPE.ERROR} title="Error" message="Something went wrong. Please try again." />
            <ToastStatic type={TOAST_TYPE.WARNING} title="Warning" message="This action cannot be undone." />
            <ToastStatic type={TOAST_TYPE.INFO} title="Information" message="Here's some helpful information." />
            <ToastStatic type={TOAST_TYPE.LOADING} title="Loading..." />
          </div>
        </div>
      </div>
    );
  },
};
