import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useArgs } from "storybook/preview-api";
import { CloseIcon } from "../icons/actions/close-icon";
import { Dialog, EDialogWidth } from "./root";

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  subcomponents: {
    DialogPanel: Dialog.Panel,
    DialogTitle: Dialog.Title,
  },
  args: {
    children: null,
    open: false,
    onOpenChange: () => {},
  },
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  render(args) {
    const [{ open }, updateArgs] = useArgs();
    const setOpen = (value: boolean) => updateArgs({ open: value });

    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600"
        >
          Open Dialog
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel>
              <div className="p-6">
                <Dialog.Title>Dialog Title</Dialog.Title>
                <div className="mt-4">
                  <p className="text-13 text-gray-600">This is the dialog content. You can put any content here.</p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-gray-200 px-4 py-2 text-13 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: null,
  },
};

export const TopPosition: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600"
        >
          Open Dialog (Top)
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel position="top">
              <div className="p-6">
                <Dialog.Title>Top Positioned Dialog</Dialog.Title>
                <div className="mt-4">
                  <p className="text-13 text-gray-600">
                    This dialog appears at the top of the screen instead of centered.
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-gray-200 px-4 py-2 text-13 hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
};

export const SmallWidth: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600"
        >
          Open Small Dialog
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel width={EDialogWidth.SM}>
              <div className="p-6">
                <Dialog.Title>Small Dialog</Dialog.Title>
                <div className="mt-4">
                  <p className="text-13 text-gray-600">This is a small dialog.</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
};

export const LargeWidth: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600"
        >
          Open Large Dialog
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel width={EDialogWidth.XXXXL}>
              <div className="p-6">
                <Dialog.Title>Large Dialog</Dialog.Title>
                <div className="mt-4">
                  <p className="text-13 text-gray-600">
                    This is a large dialog with more horizontal space for content.
                  </p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
};

export const WithCloseButton: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600"
        >
          Open Dialog with Close Button
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <Dialog.Title>Dialog with Close Button</Dialog.Title>
                  <button onClick={() => setOpen(false)} className="rounded-full p-1 hover:bg-gray-100">
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-13 text-gray-600">This dialog has a close button in the header.</p>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
};

export const ConfirmationDialog: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    const handleConfirm = () => {
      alert("Confirmed!");
      setOpen(false);
    };
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-red-500 px-4 py-2 text-on-color hover:bg-red-600"
        >
          Delete Item
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel width={EDialogWidth.SM}>
              <div className="p-6">
                <Dialog.Title>Confirm Deletion</Dialog.Title>
                <div className="mt-4">
                  <p className="text-13 text-gray-600">
                    Are you sure you want to delete this item? This action cannot be undone.
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-gray-200 px-4 py-2 text-13 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="rounded-sm bg-red-500 px-4 py-2 text-13 text-on-color hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
};

export const FormDialog: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Form submitted!");
      setOpen(false);
    };
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600"
        >
          Open Form
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel width={EDialogWidth.MD}>
              <form onSubmit={handleSubmit} className="p-6">
                <Dialog.Title>Create New Item</Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-13 font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-13"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-13 font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      className="mt-1 w-full rounded-sm border border-gray-300 px-3 py-2 text-13"
                      placeholder="Enter description"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-gray-200 px-4 py-2 text-13 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
                  >
                    Create
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
};

export const ScrollableContent: Story = {
  render(args) {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className="rounded-sm bg-blue-500 px-4 py-2 text-on-color hover:bg-blue-600"
        >
          Open Scrollable Dialog
        </button>
        {open && (
          <Dialog {...args} open={open} onOpenChange={setOpen}>
            <Dialog.Panel width={EDialogWidth.MD}>
              <div className="p-6">
                <Dialog.Title>Scrollable Content</Dialog.Title>
                <div className="mt-4 max-h-96 overflow-y-auto">
                  {Array.from({ length: 20 }, (_, i) => (
                    <p key={i} className="mb-2 text-13 text-gray-600">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut
                      labore et dolore magna aliqua.
                    </p>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        )}
      </>
    );
  },
};

export const AllWidths: Story = {
  render() {
    const [openWidth, setOpenWidth] = useState<EDialogWidth | null>(null);

    const widths = [
      { width: EDialogWidth.SM, label: "Small" },
      { width: EDialogWidth.MD, label: "Medium" },
      { width: EDialogWidth.LG, label: "Large" },
      { width: EDialogWidth.XL, label: "XL" },
      { width: EDialogWidth.XXL, label: "2XL" },
      { width: EDialogWidth.XXXL, label: "3XL" },
      { width: EDialogWidth.XXXXL, label: "4XL" },
    ];

    return (
      <div className="flex flex-wrap gap-2">
        {widths.map(({ width, label }) => (
          <button
            key={width}
            onClick={() => setOpenWidth(width)}
            className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
          >
            {label}
          </button>
        ))}
        {widths.map(({ width, label }) => (
          <Dialog key={width} open={openWidth === width} onOpenChange={() => setOpenWidth(null)}>
            <Dialog.Panel width={width}>
              <div className="p-6">
                <Dialog.Title>{label} Dialog</Dialog.Title>
                <div className="mt-4">
                  <p className="text-13 text-gray-600">This dialog uses the {label} width variant.</p>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setOpenWidth(null)}
                    className="rounded-sm bg-blue-500 px-4 py-2 text-13 text-on-color hover:bg-blue-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Dialog>
        ))}
      </div>
    );
  },
};
