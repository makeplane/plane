/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Design System/Philosophy",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# Design System Philosophy

Reusable, composable Storybook stories that demonstrate Canvas, Surface, and Layer concepts.

Key concepts and rules are preserved, but the implementation is componentized for DRYness and clarity.
        `,
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
export type Story = StoryObj<typeof meta>;

/* -----------------------------
   Reusable UI building blocks
   -----------------------------*/

type ContainerProps = {
  children?: React.ReactNode;
  className?: string;
};

const DemoRoot: React.FC<ContainerProps> = ({ children, className = "" }) => (
  <div className={`p-8 ${className}`}>{children}</div>
);

const Info: React.FC<{ title: string; children?: React.ReactNode; tone?: "info" | "warn" }> = ({
  title,
  children,
  tone = "info",
}) => (
  <div
    className={`mb-4 rounded-md border ${tone === "warn" ? "bg-red-50 border-danger-strong p-4" : "border-subtle bg-layer-1 p-4"}`}
  >
    <h3 className={`mb-2 text-16 font-semibold text-primary`}>{title}</h3>
    <div className="text-13 text-secondary">{children}</div>
  </div>
);

const Surface: React.FC<ContainerProps> = ({ children, className = "bg-surface-1 rounded-md p-6" }) => (
  <div className={className}>{children}</div>
);

const Layer: React.FC<ContainerProps & { hover?: boolean }> = ({
  children,
  className = "bg-layer-1 hover:bg-layer-1-hover rounded-md p-4",
}) => <div className={`${className} transition-colors`}>{children}</div>;

/* Small helpers to keep stories concise */
const TwoColGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-2 gap-6">{children}</div>
);

/* -----------------------------
   Stories (using the building blocks)
   -----------------------------*/

export const ApplicationRoot: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Application Root Pattern">
        This is the <strong>bg-canvas</strong> - the application-level background. It should only appear{" "}
        <strong>once</strong> in your entire application at the root level.
      </Info>

      <Surface>
        <h4 className="mb-2 font-semibold text-primary">Page Content (bg-surface-1)</h4>
        <p className="text-13 text-secondary">Pages use surfaces, not canvas. This is a typical page layout.</p>
      </Surface>
    </DemoRoot>
  ),
};

export const SurfaceSiblings: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Surface Siblings Pattern">
        Surfaces are <strong>siblings</strong>, not nested.
      </Info>

      <TwoColGrid>
        <Surface>
          <h4 className="mb-2 font-semibold text-primary">Surface 1</h4>
          <p className="text-13 text-secondary">This is bg-surface-1 - a primary surface</p>
        </Surface>

        <Surface className="rounded-md bg-surface-2 p-6">
          <h4 className="mb-2 font-semibold text-primary">Surface 2</h4>
          <p className="text-13 text-secondary">This is bg-surface-2 - a secondary surface (sibling to surface-1)</p>
        </Surface>
      </TwoColGrid>
    </DemoRoot>
  ),
};

export const LayerStacking: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Layer Stacking Pattern">Layers stack to create depth: Surface → Layer 1 → Layer 2 → Layer 3</Info>

      <Surface>
        <h4 className="mb-3 font-semibold text-primary">Surface 1</h4>

        <Layer className="mb-4 rounded-md bg-layer-1 p-4 hover:bg-layer-1-hover">
          <h5 className="mb-2 font-medium text-primary">Layer 1 (First level of depth)</h5>
          <p className="mb-3 text-13 text-secondary">Hover over me to see the hover state</p>

          <Layer className="rounded-md bg-layer-2 p-3 hover:bg-layer-2-hover">
            <h6 className="mb-2 text-13 font-medium text-primary">Layer 2 (Second level)</h6>
            <p className="mb-2 text-13 text-secondary">Nested within Layer 1</p>

            <Layer className="rounded-md bg-layer-3 p-2 hover:bg-layer-3-hover" hover>
              <p className="text-11 font-medium text-primary">Layer 3 (Third level)</p>
              <p className="text-11 text-secondary">Deepest nesting level</p>
            </Layer>
          </Layer>
        </Layer>
      </Surface>
    </DemoRoot>
  ),
};

export const SurfaceLayerAssociation: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Surface-Layer Association">
        Each surface should use its corresponding layer: surface-1 → layer-1, surface-2 → layer-2. Very rare exception:
        inputs/buttons can go one level above for visual separation.
      </Info>

      <TwoColGrid>
        <Surface>
          <h4 className="mb-3 font-semibold text-primary">Surface 1</h4>
          <Layer className="rounded-md bg-layer-1 p-4 hover:bg-layer-1-hover">
            <h5 className="mb-1 font-medium text-primary">Layer 1</h5>
            <p className="text-13 text-secondary">Correctly using layer-1 with surface-1</p>
          </Layer>
        </Surface>

        <Surface className="rounded-md bg-surface-2 p-6">
          <h4 className="mb-3 font-semibold text-primary">Surface 2</h4>
          <Layer className="rounded-md bg-layer-2 p-4 hover:bg-layer-2-hover">
            <h5 className="mb-1 font-medium text-primary">Layer 2</h5>
            <p className="text-13 text-secondary">Correctly using layer-2 with surface-2</p>
          </Layer>
        </Surface>
      </TwoColGrid>

      <div className="mt-6">
        <Info title="✅ Rare Exception: Visual Separation for Form Elements">
          In very rare cases, form elements (inputs, buttons, switches) can use one level above for visual separation.
        </Info>
        <Surface>
          <h4 className="mb-3 font-semibold text-primary">Modal with Input (Rare Exception)</h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="example-input" className="text-13 text-secondary">
                Name
              </label>
              <input
                id="example-input"
                className="mt-1 w-full rounded-md border border-subtle bg-layer-2 px-3 py-2 text-primary"
                placeholder="Input uses layer-2 for visual separation"
              />
              <p className="mt-1 text-11 text-tertiary">
                Input uses bg-layer-2 (one level above) for visual separation from modal surface
              </p>
            </div>
          </div>
        </Surface>
      </div>
    </DemoRoot>
  ),
};

export const ModalException: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Modal Exception Pattern">
        Modals exist on a <strong>different plane</strong>, so they can use surfaces even when there&apos;s a surface
        below
      </Info>

      <Surface>
        <h4 className="mb-2 font-semibold text-primary">Main Page Content</h4>
        <p className="text-13 text-secondary">This is the main page using bg-surface-1</p>
      </Surface>

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-backdrop" />
        <div className="shadow-lg relative z-10 max-w-md rounded-lg bg-surface-1 p-6">
          <h4 className="mb-3 font-semibold text-primary">Modal Dialog</h4>
          <p className="mb-4 text-13 text-secondary">
            This modal uses bg-surface-1 even though the page below also uses bg-surface-1. This is allowed because
            they&apos;re on different planes.
          </p>

          <Layer className="rounded-md bg-layer-1 p-3 hover:bg-layer-1-hover">
            <p className="text-13 text-primary">Modal content can use layers as normal</p>
          </Layer>
        </div>
      </div>
    </DemoRoot>
  ),
};

export const CardListPattern: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Card List Pattern">Common pattern: Surface containing multiple layer-1 cards</Info>

      <Surface>
        <h4 className="mb-4 font-semibold text-primary">Task List</h4>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Layer key={item} className="rounded-md bg-layer-1 p-4 hover:bg-layer-1-hover">
              <h5 className="mb-1 font-medium text-primary">Task {item}</h5>
              <p className="text-13 text-secondary">This is a task card using bg-layer-1 with hover state</p>
            </Layer>
          ))}
        </div>
      </Surface>
    </DemoRoot>
  ),
};

export const SidebarLayoutPattern: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Sidebar Layout Pattern">
        Sidebar and main content are both part of the same surface. Sidebar menu items use transparent backgrounds with
        hover states.
      </Info>

      <Surface className="flex rounded-md bg-surface-1">
        <aside className="w-64 border-r border-subtle p-4">
          <h4 className="mb-3 font-semibold text-primary">Sidebar</h4>
          <div className="space-y-2">
            {["Home", "Projects", "Settings"].map((item) => (
              <div key={item} className="rounded-md p-2 transition-colors hover:bg-layer-1-hover">
                <p className="text-13 text-primary">{item}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6">
          <h4 className="mb-3 font-semibold text-primary">Main Content</h4>
          <Layer className="rounded-md bg-layer-1 p-4 hover:bg-layer-1-hover">
            <p className="text-primary">Content card using layer-1</p>
          </Layer>
        </main>
      </Surface>
    </DemoRoot>
  ),
};

export const StateVariants: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ State Variants">Demonstrating hover, active, and selected states</Info>

      <Surface>
        <div className="space-y-4">
          <Layer className="rounded-md bg-layer-1 p-4 hover:bg-layer-1-hover">
            <h5 className="mb-1 font-medium text-primary">Hover State</h5>
            <p className="text-13 text-secondary">Hover over me to see bg-layer-1-hover</p>
          </Layer>

          <div className="rounded-md bg-layer-1-active p-4">
            <h5 className="mb-1 font-medium text-primary">Active State</h5>
            <p className="text-13 text-secondary">Using bg-layer-1-active (pressed/active)</p>
          </div>

          <div className="rounded-md bg-layer-1-selected p-4">
            <h5 className="mb-1 font-medium text-primary">Selected State</h5>
            <p className="text-13 text-secondary">Using bg-layer-1-selected (when selected)</p>
          </div>
        </div>
      </Surface>
    </DemoRoot>
  ),
};

export const TextColorHierarchy: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Text Color Hierarchy">Semantic text colors for different importance levels</Info>

      <Surface>
        <div className="rounded-md bg-layer-1 p-4">
          <h4 className="mb-3 text-16 font-semibold text-primary">Primary Text</h4>
          <p className="mb-3 text-secondary">Secondary text for descriptions and supporting content</p>
          <p className="mb-3 text-13 text-tertiary">Tertiary text for labels and metadata</p>
          <input
            className="rounded border border-subtle px-3 py-2 placeholder-(--text-color-placeholder)"
            placeholder="Placeholder text for inputs"
          />
        </div>
      </Surface>
    </DemoRoot>
  ),
};

export const CompleteExample: Story = {
  render: () => (
    <DemoRoot>
      <Info title="✅ Complete Example">A realistic dashboard layout using all design system concepts</Info>

      <div className="mb-6 rounded-md bg-surface-1">
        <div className="border-b border-subtle p-4">
          <h1 className="text-18 font-bold text-primary">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Total Users", value: "1,234" },
          { label: "Active Projects", value: "42" },
          { label: "Completed Tasks", value: "856" },
        ].map((stat, idx) => (
          <Surface key={idx}>
            <Layer className="rounded-md bg-layer-1 p-4 hover:bg-layer-1-hover">
              <p className="mb-1 text-13 text-tertiary">{stat.label}</p>
              <p className="text-20 font-bold text-primary">{stat.value}</p>
            </Layer>
          </Surface>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <Surface>
          <h3 className="mb-4 font-semibold text-primary">Recent Activity</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <Layer key={item} className="rounded-md bg-layer-1 p-3 hover:bg-layer-1-hover">
                <p className="mb-1 text-13 font-medium text-primary">Activity {item}</p>
                <p className="text-11 text-secondary">Description of the activity</p>
              </Layer>
            ))}
          </div>
        </Surface>

        <Surface className="rounded-md bg-surface-2 p-6">
          <h3 className="mb-4 font-semibold text-primary">Quick Actions</h3>
          <div className="space-y-2">
            {["Create Project", "Invite Team", "View Reports"].map((action) => (
              <Layer key={action} className="rounded-md bg-layer-2 p-3 hover:bg-layer-2-hover">
                <p className="text-13 text-primary">{action}</p>
              </Layer>
            ))}
          </div>
        </Surface>
      </div>
    </DemoRoot>
  ),
};

export const CommonMistakes: Story = {
  render: () => (
    <DemoRoot>
      <Info title="❌ Common Mistakes to Avoid" tone="warn">
        These examples show incorrect usage patterns
      </Info>

      <div className="space-y-6">
        <div className="rounded-md border-2 border-danger-strong p-4">
          <h4 className="mb-2 font-semibold text-primary">❌ Mistake 1: Nested Surfaces (Same Plane)</h4>
          <Surface>
            <p className="mb-2 text-13 text-secondary">Surface 1</p>
            <div className="rounded-md bg-surface-2 p-4">
              <p className="text-13 text-secondary">Surface 2 nested inside Surface 1 - WRONG!</p>
            </div>
          </Surface>
          <p className="mt-2 text-11 text-tertiary">
            ✅ Fix: Use bg-layer-1 for nested elements, or make them sibling surfaces
          </p>
        </div>

        <div className="rounded-md border-2 border-danger-strong p-4">
          <h4 className="mb-2 font-semibold text-primary">❌ Mistake 2: Wrong Layer-Surface Association</h4>
          <Surface>
            <p className="mb-2 text-13 text-secondary">Surface 1</p>
            <div className="rounded-md bg-layer-2 p-4">
              <p className="text-13 text-secondary">Using layer-2 with surface-1 for content box - WRONG!</p>
            </div>
          </Surface>
          <p className="mt-2 text-11 text-tertiary">
            ✅ Fix: Use bg-layer-1 with bg-surface-1 for content boxes. Exception: Very rare cases for inputs/buttons
            that need visual separation (e.g., input in modal can use bg-layer-2 for separation).
          </p>
        </div>

        <div className="rounded-md border-2 border-danger-strong p-4">
          <h4 className="mb-2 font-semibold text-primary">❌ Mistake 3: Mismatched Hover State</h4>
          <Surface>
            <div className="rounded-md bg-layer-1 p-4 transition-colors hover:bg-layer-2-hover">
              <p className="text-13 text-secondary">bg-layer-1 with hover:bg-layer-2-hover - WRONG!</p>
            </div>
          </Surface>
          <p className="mt-2 text-11 text-tertiary">✅ Fix: Use bg-layer-1 hover:bg-layer-1-hover</p>
        </div>

        <div className="rounded-md border-2 border-danger-strong p-4">
          <h4 className="mb-2 font-semibold text-primary">❌ Mistake 4: Canvas for Pages</h4>
          <div className="rounded-md bg-canvas p-4">
            <p className="text-13 text-secondary">Using bg-canvas for a page or component - WRONG!</p>
          </div>
          <p className="mt-2 text-11 text-tertiary">
            ✅ Fix: Canvas should only be at application root. Use bg-surface-1 for pages
          </p>
        </div>
      </div>
    </DemoRoot>
  ),
};
