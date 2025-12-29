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
    className={`mb-4 rounded-md border ${tone === "warn" ? "border-danger-strong bg-red-50 p-4" : "border-subtle bg-layer-1 p-4"}`}
  >
    <h3 className={`text-primary mb-2 text-16 font-semibold`}>{title}</h3>
    <div className="text-secondary text-13">{children}</div>
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
        <h4 className="text-primary mb-2 font-semibold">Page Content (bg-surface-1)</h4>
        <p className="text-secondary text-13">Pages use surfaces, not canvas. This is a typical page layout.</p>
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
          <h4 className="text-primary mb-2 font-semibold">Surface 1</h4>
          <p className="text-secondary text-13">This is bg-surface-1 - a primary surface</p>
        </Surface>

        <Surface className="bg-surface-2 rounded-md p-6">
          <h4 className="text-primary mb-2 font-semibold">Surface 2</h4>
          <p className="text-secondary text-13">This is bg-surface-2 - a secondary surface (sibling to surface-1)</p>
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
        <h4 className="text-primary mb-3 font-semibold">Surface 1</h4>

        <Layer className="bg-layer-1 hover:bg-layer-1-hover mb-4 rounded-md p-4">
          <h5 className="text-primary mb-2 font-medium">Layer 1 (First level of depth)</h5>
          <p className="text-secondary mb-3 text-13">Hover over me to see the hover state</p>

          <Layer className="bg-layer-2 hover:bg-layer-2-hover rounded-md p-3">
            <h6 className="text-primary mb-2 text-13 font-medium">Layer 2 (Second level)</h6>
            <p className="text-secondary mb-2 text-13">Nested within Layer 1</p>

            <Layer className="bg-layer-3 hover:bg-layer-3-hover rounded-md p-2" hover>
              <p className="text-primary text-11 font-medium">Layer 3 (Third level)</p>
              <p className="text-secondary text-11">Deepest nesting level</p>
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
          <h4 className="text-primary mb-3 font-semibold">Surface 1</h4>
          <Layer className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">
            <h5 className="text-primary mb-1 font-medium">Layer 1</h5>
            <p className="text-secondary text-13">Correctly using layer-1 with surface-1</p>
          </Layer>
        </Surface>

        <Surface className="bg-surface-2 rounded-md p-6">
          <h4 className="text-primary mb-3 font-semibold">Surface 2</h4>
          <Layer className="bg-layer-2 hover:bg-layer-2-hover rounded-md p-4">
            <h5 className="text-primary mb-1 font-medium">Layer 2</h5>
            <p className="text-secondary text-13">Correctly using layer-2 with surface-2</p>
          </Layer>
        </Surface>
      </TwoColGrid>

      <div className="mt-6">
        <Info title="✅ Rare Exception: Visual Separation for Form Elements">
          In very rare cases, form elements (inputs, buttons, switches) can use one level above for visual separation.
        </Info>
        <Surface>
          <h4 className="text-primary mb-3 font-semibold">Modal with Input (Rare Exception)</h4>
          <div className="space-y-3">
            <div>
              <label htmlFor="example-input" className="text-secondary text-13">
                Name
              </label>
              <input
                id="example-input"
                className="w-full bg-layer-2 border border-subtle rounded-md px-3 py-2 text-primary mt-1"
                placeholder="Input uses layer-2 for visual separation"
              />
              <p className="text-tertiary text-11 mt-1">
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
        <h4 className="text-primary mb-2 font-semibold">Main Page Content</h4>
        <p className="text-secondary text-13">This is the main page using bg-surface-1</p>
      </Surface>

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-backdrop absolute inset-0" />
        <div className="bg-surface-1 relative z-10 max-w-md rounded-lg p-6 shadow-lg">
          <h4 className="text-primary mb-3 font-semibold">Modal Dialog</h4>
          <p className="text-secondary mb-4 text-13">
            This modal uses bg-surface-1 even though the page below also uses bg-surface-1. This is allowed because
            they&apos;re on different planes.
          </p>

          <Layer className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-3">
            <p className="text-primary text-13">Modal content can use layers as normal</p>
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
        <h4 className="text-primary mb-4 font-semibold">Task List</h4>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Layer key={item} className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">
              <h5 className="text-primary mb-1 font-medium">Task {item}</h5>
              <p className="text-secondary text-13">This is a task card using bg-layer-1 with hover state</p>
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

      <Surface className="bg-surface-1 flex rounded-md">
        <aside className="border-subtle w-64 border-r p-4">
          <h4 className="text-primary mb-3 font-semibold">Sidebar</h4>
          <div className="space-y-2">
            {["Home", "Projects", "Settings"].map((item) => (
              <div key={item} className="hover:bg-layer-1-hover rounded-md p-2 transition-colors">
                <p className="text-primary text-13">{item}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6">
          <h4 className="text-primary mb-3 font-semibold">Main Content</h4>
          <Layer className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">
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
          <Layer className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">
            <h5 className="text-primary mb-1 font-medium">Hover State</h5>
            <p className="text-secondary text-13">Hover over me to see bg-layer-1-hover</p>
          </Layer>

          <div className="bg-layer-1-active rounded-md p-4">
            <h5 className="text-primary mb-1 font-medium">Active State</h5>
            <p className="text-secondary text-13">Using bg-layer-1-active (pressed/active)</p>
          </div>

          <div className="bg-layer-1-selected rounded-md p-4">
            <h5 className="text-primary mb-1 font-medium">Selected State</h5>
            <p className="text-secondary text-13">Using bg-layer-1-selected (when selected)</p>
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
        <div className="bg-layer-1 rounded-md p-4">
          <h4 className="text-primary mb-3 text-16 font-semibold">Primary Text</h4>
          <p className="text-secondary mb-3">Secondary text for descriptions and supporting content</p>
          <p className="text-tertiary mb-3 text-13">Tertiary text for labels and metadata</p>
          <input
            className="placeholder-(--text-color-placeholder) border-subtle rounded border px-3 py-2"
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

      <div className="bg-surface-1 mb-6 rounded-md">
        <div className="border-subtle border-b p-4">
          <h1 className="text-primary text-18 font-bold">Dashboard</h1>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: "Total Users", value: "1,234" },
          { label: "Active Projects", value: "42" },
          { label: "Completed Tasks", value: "856" },
        ].map((stat, idx) => (
          <Surface key={idx}>
            <Layer className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-4">
              <p className="text-tertiary mb-1 text-13">{stat.label}</p>
              <p className="text-primary text-20 font-bold">{stat.value}</p>
            </Layer>
          </Surface>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <Surface>
          <h3 className="text-primary mb-4 font-semibold">Recent Activity</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <Layer key={item} className="bg-layer-1 hover:bg-layer-1-hover rounded-md p-3">
                <p className="text-primary mb-1 text-13 font-medium">Activity {item}</p>
                <p className="text-secondary text-11">Description of the activity</p>
              </Layer>
            ))}
          </div>
        </Surface>

        <Surface className="bg-surface-2 rounded-md p-6">
          <h3 className="text-primary mb-4 font-semibold">Quick Actions</h3>
          <div className="space-y-2">
            {["Create Project", "Invite Team", "View Reports"].map((action) => (
              <Layer key={action} className="bg-layer-2 hover:bg-layer-2-hover rounded-md p-3">
                <p className="text-primary text-13">{action}</p>
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
        <div className="border-2 border-danger-strong rounded-md p-4">
          <h4 className="text-primary mb-2 font-semibold">❌ Mistake 1: Nested Surfaces (Same Plane)</h4>
          <Surface>
            <p className="text-secondary mb-2 text-13">Surface 1</p>
            <div className="bg-surface-2 rounded-md p-4">
              <p className="text-secondary text-13">Surface 2 nested inside Surface 1 - WRONG!</p>
            </div>
          </Surface>
          <p className="text-tertiary mt-2 text-11">
            ✅ Fix: Use bg-layer-1 for nested elements, or make them sibling surfaces
          </p>
        </div>

        <div className="border-2 border-danger-strong rounded-md p-4">
          <h4 className="text-primary mb-2 font-semibold">❌ Mistake 2: Wrong Layer-Surface Association</h4>
          <Surface>
            <p className="text-secondary mb-2 text-13">Surface 1</p>
            <div className="bg-layer-2 rounded-md p-4">
              <p className="text-secondary text-13">Using layer-2 with surface-1 for content box - WRONG!</p>
            </div>
          </Surface>
          <p className="text-tertiary mt-2 text-11">
            ✅ Fix: Use bg-layer-1 with bg-surface-1 for content boxes. Exception: Very rare cases for inputs/buttons
            that need visual separation (e.g., input in modal can use bg-layer-2 for separation).
          </p>
        </div>

        <div className="border-2 border-danger-strong rounded-md p-4">
          <h4 className="text-primary mb-2 font-semibold">❌ Mistake 3: Mismatched Hover State</h4>
          <Surface>
            <div className="bg-layer-1 hover:bg-layer-2-hover rounded-md p-4 transition-colors">
              <p className="text-secondary text-13">bg-layer-1 with hover:bg-layer-2-hover - WRONG!</p>
            </div>
          </Surface>
          <p className="text-tertiary mt-2 text-11">✅ Fix: Use bg-layer-1 hover:bg-layer-1-hover</p>
        </div>

        <div className="border-2 border-danger-strong rounded-md p-4">
          <h4 className="text-primary mb-2 font-semibold">❌ Mistake 4: Canvas for Pages</h4>
          <div className="bg-canvas rounded-md p-4">
            <p className="text-secondary text-13">Using bg-canvas for a page or component - WRONG!</p>
          </div>
          <p className="text-tertiary mt-2 text-11">
            ✅ Fix: Canvas should only be at application root. Use bg-surface-1 for pages
          </p>
        </div>
      </div>
    </DemoRoot>
  ),
};
