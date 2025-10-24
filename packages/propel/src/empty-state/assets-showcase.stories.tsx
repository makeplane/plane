import type { Meta, StoryObj } from "@storybook/react-vite";
import { HorizontalStackAssetsMap } from "./assets/horizontal-stack/constant";
import { IllustrationMap } from "./assets/illustration/constant";
import { VerticalStackAssetsMap } from "./assets/vertical-stack/constant";

// Meta for asset showcase
const meta: Meta = {
  title: "Components/EmptyState/Assets Showcase",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Visual catalog of all available empty state assets organized by type.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const HorizontalStackAssets: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Horizontal stack assets designed for compact empty states. These are optimized for smaller, inline empty state scenarios.",
      },
    },
  },
  render: () => (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-custom-text-100">Horizontal Stack Assets</h2>
        <p className="text-sm text-custom-text-300">Used primarily in EmptyStateCompact component</p>
      </div>
      <div className="grid w-full grid-cols-12 gap-6">
        {HorizontalStackAssetsMap.map((item) => (
          <div
            key={item.title}
            className="col-span-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-custom-border-200 bg-custom-background-100 p-6 sm:col-span-4 lg:col-span-3"
          >
            <div className="flex h-24 w-24 items-center justify-center">{item.asset}</div>
            <p className="text-center text-xs font-medium text-custom-text-200">{item.title}</p>
            <code className="rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-300">
              {item.title.toLowerCase().replace(/\s+/g, "-")}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const VerticalStackAssets: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Vertical stack assets designed for detailed empty states. These are larger and more prominent, suitable for feature-specific empty states.",
      },
    },
  },
  render: () => (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-custom-text-100">Vertical Stack Assets</h2>
        <p className="text-sm text-custom-text-300">Used primarily in EmptyStateDetailed component</p>
      </div>
      <div className="grid w-full grid-cols-12 gap-6">
        {VerticalStackAssetsMap.map((item) => (
          <div
            key={item.title}
            className="col-span-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-custom-border-200 bg-custom-background-100 p-6 sm:col-span-4 lg:col-span-3"
          >
            <div className="flex h-32 w-32 items-center justify-center">{item.asset}</div>
            <p className="text-center text-xs font-medium text-custom-text-200">
              {item.title.replace(/VerticalStackIllustration$/, "")}
            </p>
            <code className="rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-300">
              {item.title
                .replace(/VerticalStackIllustration$/, "")
                .replace(/([A-Z])/g, "-$1")
                .toLowerCase()
                .slice(1)}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const IllustrationAssets: Story = {
  parameters: {
    docs: {
      description: {
        story: "Illustration assets available for both compact and detailed empty states.",
      },
    },
  },
  render: () => (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-custom-text-100">Illustration Assets</h2>
        <p className="text-sm text-custom-text-300">Available in both EmptyStateCompact and EmptyStateDetailed</p>
      </div>
      <div className="grid w-full grid-cols-12 gap-6">
        {IllustrationMap.map((item) => (
          <div
            key={item.title}
            className="col-span-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-custom-border-200 bg-custom-background-100 p-6 sm:col-span-4 lg:col-span-3"
          >
            <div className="flex h-24 w-24 items-center justify-center">{item.asset}</div>
            <p className="text-center text-xs font-medium text-custom-text-200">{item.title}</p>
            <code className="rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-300">
              {item.title.toLowerCase()}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const AllAssets: Story = {
  parameters: {
    docs: {
      description: {
        story: "Complete catalog of all available empty state assets.",
      },
    },
  },
  render: () => (
    <div className="space-y-12 p-8">
      {/* Horizontal Stack */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-custom-text-100">Horizontal Stack Assets</h2>
          <p className="text-sm text-custom-text-300">
            For EmptyStateCompact - {HorizontalStackAssetsMap.length} assets
          </p>
        </div>
        <div className="grid w-full grid-cols-12 gap-4">
          {HorizontalStackAssetsMap.map((item) => (
            <div
              key={item.title}
              className="col-span-6 flex flex-col items-center justify-center gap-2 rounded border border-custom-border-200 bg-custom-background-100 p-4 sm:col-span-3 lg:col-span-2"
            >
              <div className="flex h-16 w-16 items-center justify-center">{item.asset}</div>
              <code className="text-[10px] text-custom-text-400">{item.title.toLowerCase().replace(/\s+/g, "-")}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Vertical Stack */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-custom-text-100">Vertical Stack Assets</h2>
          <p className="text-sm text-custom-text-300">
            For EmptyStateDetailed - {VerticalStackAssetsMap.length} assets
          </p>
        </div>
        <div className="grid w-full grid-cols-12 gap-4">
          {VerticalStackAssetsMap.map((item) => (
            <div
              key={item.title}
              className="col-span-6 flex flex-col items-center justify-center gap-2 rounded border border-custom-border-200 bg-custom-background-100 p-4 sm:col-span-3 lg:col-span-2"
            >
              <div className="flex h-20 w-20 items-center justify-center">{item.asset}</div>
              <code className="text-center text-[10px] text-custom-text-400">
                {item.title
                  .replace(/VerticalStackIllustration$/, "")
                  .replace(/([A-Z])/g, "-$1")
                  .toLowerCase()
                  .slice(1)}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Illustrations */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-custom-text-100">Illustration Assets</h2>
          <p className="text-sm text-custom-text-300">For both components - {IllustrationMap.length} assets</p>
        </div>
        <div className="grid w-full grid-cols-12 gap-4">
          {IllustrationMap.map((item) => (
            <div
              key={item.title}
              className="col-span-6 flex flex-col items-center justify-center gap-2 rounded border border-custom-border-200 bg-custom-background-100 p-4 sm:col-span-3 lg:col-span-2"
            >
              <div className="flex h-16 w-16 items-center justify-center">{item.asset}</div>
              <code className="text-[10px] text-custom-text-400">{item.title.toLowerCase()}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};
