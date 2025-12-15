import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button";
import type { TButtonVariant } from "../button/helper";
import { EPortalWidth, EPortalPosition } from "./constants";
import { ModalPortal, PortalWrapper } from "./";

const meta = {
  title: "Components/Portal/ModalPortal",
  component: ModalPortal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
A high-performance, accessible modal portal component with comprehensive features:
Perfect for modals, drawers, overlays, and any UI that needs to appear above other content.
        `,
      },
    },
  },
  tags: ["autodocs"],
  args: {
    isOpen: false,
    children: null,
  },
  render(args) {
    return (
      <ModalDemo {...args} buttonText="Open Modal">
        <ModalContent
          title="Default Modal"
          description="A standard modal with all default settings. Demonstrates focus management, keyboard navigation, and accessibility features."
        />
      </ModalDemo>
    );
  },
} satisfies Meta<typeof ModalPortal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for interactive stories
function ModalDemo({
  children,
  buttonText = "Open Modal",
  buttonVariant = "primary",
  ...modalProps
}: Omit<Parameters<typeof ModalPortal>[0], "isOpen" | "onClose"> & {
  buttonText?: string;
  buttonVariant?: TButtonVariant;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant={buttonVariant} onClick={() => setIsOpen(true)}>
        {buttonText}
      </Button>
      <ModalPortal {...modalProps} isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </ModalPortal>
    </>
  );
}

function ModalContent({
  title = "Modal Title",
  showCloseButton = true,
  description = "This is a modal portal component with full accessibility support. Try pressing Tab to navigate through elements or Escape to close.",
  onClose,
}: {
  title?: string;
  showCloseButton?: boolean;
  description?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-18 font-semibold text-gray-900">{title}</h2>
          <p className="text-13 text-gray-500 mt-1">Modal demonstration</p>
        </div>
        {showCloseButton && onClose && (
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            ✕
          </Button>
        )}
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <p className="text-gray-600 mb-6">{description}</p>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Feature Highlights</h3>
            <ul className="text-13 text-gray-600 space-y-1">
              <li>• ESC key closes the modal</li>
              <li>• Click outside overlay to close</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {};

export const Positions: Story = {
  name: "Different Positions",
  render() {
    const [activeModal, setActiveModal] = useState<EPortalPosition | null>(null);

    return (
      <div className="flex gap-3">
        {Object.values(EPortalPosition).map((position) => (
          <React.Fragment key={position}>
            <Button variant="secondary" onClick={() => setActiveModal(position)}>
              {position.charAt(0).toUpperCase() + position.slice(1)}
            </Button>
            <ModalPortal
              isOpen={activeModal === position}
              onClose={() => setActiveModal(null)}
              width={EPortalWidth.HALF}
              position={position}
            >
              <ModalContent
                title={`${position.charAt(0).toUpperCase() + position.slice(1)} Modal`}
                description={`This modal is positioned at ${position}. Try different positions to see how the modal appears in different areas of the screen.`}
                onClose={() => setActiveModal(null)}
              />
            </ModalPortal>
          </React.Fragment>
        ))}
      </div>
    );
  },
};

export const Widths: Story = {
  name: "Different Widths",
  render() {
    const [activeModal, setActiveModal] = useState<EPortalWidth | null>(null);

    return (
      <div className="flex gap-3">
        {Object.values(EPortalWidth).map((width) => (
          <React.Fragment key={width}>
            <Button variant="secondary" onClick={() => setActiveModal(width)}>
              {width.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </Button>
            <ModalPortal
              isOpen={activeModal === width}
              onClose={() => setActiveModal(null)}
              width={width}
              position={EPortalPosition.RIGHT}
            >
              <ModalContent
                title={`${width.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())} Width`}
                description={`This modal uses ${width} width. Compare different widths to find the perfect size for your content.`}
                onClose={() => setActiveModal(null)}
              />
            </ModalPortal>
          </React.Fragment>
        ))}
      </div>
    );
  },
};

export const BasicPortal: Story = {
  render() {
    return (
      <div className="relative">
        <p>This content renders in the normal document flow.</p>
        <PortalWrapper portalId="storybook-portal">
          <div className="fixed top-4 right-4 p-4 bg-blue-500 text-on-color rounded-sm shadow-lg z-50">
            This content is rendered in a portal!
          </div>
        </PortalWrapper>
      </div>
    );
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
The PortalWrapper is a low-level component that handles rendering content into DOM portals.
It's used internally by ModalPortal but can also be used directly for custom portal needs.`,
      },
    },
  },
};
