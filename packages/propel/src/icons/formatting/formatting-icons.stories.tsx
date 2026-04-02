/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import * as React from "react";
import preview from "#.storybook/preview";
import { Icon } from "../icon";
import type { IconName } from "../registry";
import { ICON_REGISTRY } from "../registry";
import { Tooltip } from "../../tooltip";
import { IconButton } from "../../icon-button";

const meta = preview.meta({
  title: "Media/Icons/Formatting",
  parameters: {
    layout: "padded",
  },
});

const allFormattingKeys = (Object.keys(ICON_REGISTRY) as IconName[]).filter((k) => k.startsWith("formatting."));
const outlineKeys = allFormattingKeys.filter((k) => !k.endsWith("-filled"));
const filledKeys = allFormattingKeys.filter((k) => k.endsWith("-filled"));

function getComponentName(registryKey: IconName): string {
  const Component = ICON_REGISTRY[registryKey];
  if (Component && "name" in Component) return Component.name;
  // fallback: derive from registry key
  return (
    registryKey
      .replace("formatting.", "")
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("") + "Icon"
  );
}

function IconCell({ name }: { name: IconName }) {
  const [copied, setCopied] = React.useState(false);
  const componentName = getComponentName(name);
  const snippet = `<${componentName} />`;

  const handleClick = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <Tooltip tooltipHeading={componentName} tooltipContent={copied ? "Copied!" : "Click to copy"} position="top">
      <button
        type="button"
        onClick={handleClick}
        className="relative flex items-center justify-center size-10 bg-surface-2 rounded-lg cursor-pointer transition-all hover:bg-surface-3 hover:shadow-sm group"
      >
        <Icon name={name} className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
        {copied && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 bg-success-primary rounded-full"
            style={{ animation: "check-pop 0.3s ease-out" }}
          >
            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.3 4.3a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L6.6 9.6l5.3-5.3a1 1 0 0 1 1.4 0Z"
                fill="currentColor"
              />
            </svg>
          </span>
        )}
      </button>
    </Tooltip>
  );
}

export const FormattingIcons = meta.story({
  render(_args) {
    const mid = Math.ceil(outlineKeys.length / 2);
    const leftColumn = outlineKeys.slice(0, mid);
    const rightColumn = outlineKeys.slice(mid);

    const renderRows = (keys: IconName[]) =>
      keys.map((outlineName) => {
        const filledName = `${outlineName}-filled` as IconName;
        const hasFilled = filledKeys.includes(filledName);
        const label = outlineName.replace("formatting.", "");
        return (
          <tr key={outlineName} className="border-b border-border-1">
            <td className="py-3 pr-4">
              <span className="text-13 font-medium text-primary">{label}</span>
            </td>
            <td className="py-3 px-2">
              <IconCell name={outlineName} />
            </td>
            <td className="py-3 pl-2">
              {hasFilled ? <IconCell name={filledName} /> : <span className="text-11 text-quaternary">--</span>}
            </td>
          </tr>
        );
      });

    return (
      <div className="bg-surface-1 p-10 rounded-xl">
        <style>{`@keyframes check-pop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }`}</style>
        <div className="mb-8 px-6">
          <h2 className="text-18 font-bold text-primary mb-2">Formatting & Editor Icons</h2>
          <p className="text-13 text-tertiary">
            {outlineKeys.length} icons with outline and filled variants. Hover for name, click to copy.
          </p>
        </div>

        <div className="flex gap-12 px-6">
          <table className="flex-1 border-collapse">
            <thead>
              <tr className="border-b border-border-1">
                <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal">Name</th>
                <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal px-2">
                  Outline
                </th>
                <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal pl-2">
                  Filled
                </th>
              </tr>
            </thead>
            <tbody>{renderRows(leftColumn)}</tbody>
          </table>

          <div className="w-px bg-border-1 self-stretch" />

          <table className="flex-1 border-collapse">
            <thead>
              <tr className="border-b border-border-1">
                <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal">Name</th>
                <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal px-2">
                  Outline
                </th>
                <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal pl-2">
                  Filled
                </th>
              </tr>
            </thead>
            <tbody>{renderRows(rightColumn)}</tbody>
          </table>
        </div>
      </div>
    );
  },
});

function CopyableCell({
  name,
  size,
  colorClass,
  bgClass,
}: {
  name: IconName;
  size?: number;
  colorClass?: string;
  bgClass?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const componentName = getComponentName(name);
  const sizeProp = size && size !== 16 ? ` width="${size}" height="${size}"` : "";
  const classProp = colorClass && colorClass !== "text-icon-primary" ? ` className="${colorClass}"` : "";
  const snippet = `<${componentName}${sizeProp}${classProp} />`;

  const handleClick = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  };

  const cellSize = size ? size + 16 : 36;

  return (
    <Tooltip tooltipHeading={componentName} tooltipContent={copied ? "Copied!" : snippet} position="top">
      <button
        type="button"
        onClick={handleClick}
        className={`relative flex items-center justify-center rounded-md cursor-pointer transition-all hover:shadow-sm hover:opacity-80 ${bgClass || "bg-surface-2"}`}
        style={{ width: cellSize, height: cellSize }}
      >
        <Icon
          name={name}
          width={size ? String(size) : undefined}
          height={size ? String(size) : undefined}
          className={`${colorClass || "text-secondary"}`}
        />
        {copied && (
          <span
            className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 bg-success-primary rounded-full"
            style={{ animation: "check-pop 0.3s ease-out" }}
          >
            <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 16 16" fill="none">
              <path
                d="M13.3 4.3a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L6.6 9.6l5.3-5.3a1 1 0 0 1 1.4 0Z"
                fill="currentColor"
              />
            </svg>
          </span>
        )}
      </button>
    </Tooltip>
  );
}

export const FormattingIconSizes = meta.story({
  render(_args) {
    const sizes = [12, 16, 20, 24, 32];
    const iconGroups: { label: string; icons: IconName[] }[] = [
      {
        label: "Text Styles",
        icons: ["formatting.bold", "formatting.italic", "formatting.underline", "formatting.strikethrough"],
      },
      { label: "Headings", icons: ["formatting.h1", "formatting.h2", "formatting.h3", "formatting.h4"] },
      { label: "Alignment", icons: ["formatting.align-left", "formatting.align-center", "formatting.align-right"] },
      {
        label: "Lists",
        icons: [
          "formatting.bulleted-list",
          "formatting.numbered-list",
          "formatting.toggle-list",
          "formatting.todo-list",
        ],
      },
      {
        label: "Blocks",
        icons: [
          "formatting.code",
          "formatting.quote",
          "formatting.callout",
          "formatting.embed",
          "formatting.divider",
          "formatting.table",
          "formatting.image",
          "formatting.formula",
        ],
      },
    ];

    return (
      <div className="bg-surface-1 p-10 rounded-xl space-y-10">
        <div className="px-6">
          <h2 className="text-18 font-bold text-primary mb-2">Size Variants</h2>
          <p className="text-13 text-tertiary">All formatting icons rendered at 12, 16, 20, 24, and 32px.</p>
        </div>

        {iconGroups.map((group) => (
          <div key={group.label} className="px-6 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-13 font-semibold text-primary uppercase tracking-wider">{group.label}</h3>
              <div className="flex-1 h-px bg-border-1" />
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-1">
                  <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal w-36">
                    Icon
                  </th>
                  {sizes.map((s) => (
                    <th
                      key={s}
                      className="text-11 text-quaternary uppercase tracking-wider py-2 text-center font-normal"
                    >
                      {s}px
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {group.icons.map((name) => (
                  <tr key={name} className="border-b border-border-1">
                    <td className="py-3">
                      <span className="text-13 font-medium text-primary">{name.replace("formatting.", "")}</span>
                    </td>
                    {sizes.map((size) => (
                      <td key={size} className="py-3">
                        <div className="flex items-center justify-center">
                          <CopyableCell name={name} size={size} />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  },
});

const ICON_COLOR_TOKENS = [
  { token: "text-icon-primary", label: "Primary" },
  { token: "text-icon-secondary", label: "Secondary" },
  { token: "text-icon-tertiary", label: "Tertiary" },
  { token: "text-icon-placeholder", label: "Placeholder" },
  { token: "text-icon-disabled", label: "Disabled" },
  { token: "text-icon-accent-primary", label: "Accent Primary" },
  { token: "text-icon-accent-secondary", label: "Accent Secondary" },
  { token: "text-icon-accent-subtle", label: "Accent Subtle" },
  { token: "text-icon-success-primary", label: "Success Primary" },
  { token: "text-icon-success-secondary", label: "Success Secondary" },
  { token: "text-icon-warning-primary", label: "Warning Primary" },
  { token: "text-icon-warning-secondary", label: "Warning Secondary" },
  { token: "text-icon-warning-subtle", label: "Warning Subtle" },
  { token: "text-icon-danger-primary", label: "Danger Primary" },
  { token: "text-icon-danger-secondary", label: "Danger Secondary" },
  { token: "text-icon-danger", label: "Danger" },
  { token: "text-icon-on-color", label: "On Color", bgClass: "bg-accent-primary" },
  { token: "text-icon-inverse", label: "Inverse", bgClass: "bg-primary" },
];

export const FormattingIconColors = meta.story({
  render(_args) {
    const iconGroups: { label: string; icons: IconName[] }[] = [
      {
        label: "Text Styles",
        icons: ["formatting.bold", "formatting.italic", "formatting.underline", "formatting.strikethrough"],
      },
      { label: "Headings", icons: ["formatting.h1", "formatting.h2", "formatting.h3", "formatting.h4"] },
      { label: "Alignment", icons: ["formatting.align-left", "formatting.align-center", "formatting.align-right"] },
      {
        label: "Lists",
        icons: [
          "formatting.bulleted-list",
          "formatting.numbered-list",
          "formatting.toggle-list",
          "formatting.todo-list",
        ],
      },
      {
        label: "Blocks",
        icons: [
          "formatting.code",
          "formatting.quote",
          "formatting.callout",
          "formatting.embed",
          "formatting.divider",
          "formatting.table",
          "formatting.image",
          "formatting.formula",
        ],
      },
    ];

    return (
      <div className="bg-surface-1 p-10 rounded-xl space-y-10">
        <div className="px-6">
          <h2 className="text-18 font-bold text-primary mb-2">Color Tokens</h2>
          <p className="text-13 text-tertiary">Formatting icons rendered with each icon-specific design token.</p>
        </div>

        {iconGroups.map((group) => (
          <div key={group.label} className="px-6 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-13 font-semibold text-primary uppercase tracking-wider">{group.label}</h3>
              <div className="flex-1 h-px bg-border-1" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border-1">
                    <th className="text-11 text-quaternary uppercase tracking-wider py-2 text-left font-normal w-36 sticky left-0 bg-surface-1">
                      Icon
                    </th>
                    {ICON_COLOR_TOKENS.map((c) => (
                      <th
                        key={c.token}
                        className="text-10 text-quaternary uppercase tracking-wider py-2 text-center font-normal px-1 whitespace-nowrap"
                      >
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.icons.map((name) => (
                    <tr key={name} className="border-b border-border-1">
                      <td className="py-3 sticky left-0 bg-surface-1">
                        <span className="text-13 font-medium text-primary">{name.replace("formatting.", "")}</span>
                      </td>
                      {ICON_COLOR_TOKENS.map((c) => (
                        <td key={c.token} className="py-3 px-1">
                          <div className="flex items-center justify-center">
                            <CopyableCell name={name} colorClass={c.token} bgClass={c.bgClass} />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  },
});

const PLAYGROUND_SIZES = [12, 14, 16, 20, 24, 32, 40, 48];

export const Playground = meta.story({
  render(_args) {
    const [selectedIcon, setSelectedIcon] = React.useState<IconName>("formatting.bold");
    const [selectedSize, setSelectedSize] = React.useState(20);
    const [selectedColor, setSelectedColor] = React.useState("text-icon-primary");
    const [useIconButton, setUseIconButton] = React.useState(false);
    const [selectedVariant, setSelectedVariant] = React.useState<
      "primary" | "secondary" | "tertiary" | "ghost" | "error-fill" | "error-outline"
    >("secondary");
    const [selectedBtnSize, setSelectedBtnSize] = React.useState<"sm" | "base" | "lg" | "xl">("base");
    const [copied, setCopied] = React.useState(false);

    const componentName = getComponentName(selectedIcon);

    const snippet = useIconButton
      ? `<IconButton variant="${selectedVariant}" size="${selectedBtnSize}" icon={${componentName}} onClick={() => {}} />`
      : (() => {
          const colorProp = selectedColor === "text-icon-primary" ? "" : ` className="${selectedColor}"`;
          const sizeProp = selectedSize === 16 ? "" : ` width="${selectedSize}" height="${selectedSize}"`;
          return `<${componentName}${sizeProp}${colorProp} />`;
        })();

    const handleCopy = () => {
      navigator.clipboard.writeText(snippet).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      });
    };

    return (
      <div className="bg-surface-1 p-10 rounded-xl space-y-8">
        <style>{`@keyframes check-pop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }`}</style>
        <div className="px-6">
          <h2 className="text-18 font-bold text-primary mb-2">Playground</h2>
          <p className="text-13 text-tertiary">Pick an icon, size, and color token. Copy the ready-to-use code.</p>
        </div>

        <div className="flex gap-10 px-6">
          {/* Preview */}
          <div className="flex flex-col items-center gap-4 shrink-0">
            <div className="flex items-center justify-center size-32 bg-surface-2 rounded-xl">
              {useIconButton ? (
                <IconButton variant={selectedVariant} size={selectedBtnSize} icon={ICON_REGISTRY[selectedIcon]} />
              ) : (
                <Icon
                  name={selectedIcon}
                  width={String(selectedSize)}
                  height={String(selectedSize)}
                  className={selectedColor}
                />
              )}
            </div>
            <span className="text-13 font-medium text-primary">{componentName}</span>
            <span className="text-11 text-quaternary">{useIconButton ? "IconButton" : "Icon"}</span>
          </div>

          {/* Controls */}
          <div className="flex-1 space-y-6">
            {/* Icon picker */}
            <div className="space-y-3">
              <label className="text-12 font-medium text-secondary uppercase tracking-wider">Outline</label>
              <div className="flex flex-wrap gap-1.5">
                {outlineKeys.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`flex items-center justify-center size-9 rounded-md cursor-pointer transition-all ${
                      selectedIcon === name
                        ? "bg-accent-primary/10 ring-1 ring-accent-primary"
                        : "bg-surface-2 hover:bg-surface-3"
                    }`}
                  >
                    <Icon
                      name={name}
                      className={`h-4 w-4 ${selectedIcon === name ? "text-accent-primary" : "text-secondary"}`}
                    />
                  </button>
                ))}
              </div>
              <label className="text-12 font-medium text-secondary uppercase tracking-wider">Filled</label>
              <div className="flex flex-wrap gap-1.5">
                {filledKeys.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`flex items-center justify-center size-9 rounded-md cursor-pointer transition-all ${
                      selectedIcon === name
                        ? "bg-accent-primary/10 ring-1 ring-accent-primary"
                        : "bg-surface-2 hover:bg-surface-3"
                    }`}
                  >
                    <Icon
                      name={name}
                      className={`h-4 w-4 ${selectedIcon === name ? "text-accent-primary" : "text-secondary"}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Size: icon px sizes OR IconButton sizes */}
            <div className="space-y-2">
              <label className="text-12 font-medium text-secondary uppercase tracking-wider">Size</label>
              {useIconButton ? (
                <div className="flex gap-2">
                  {(["sm", "base", "lg", "xl"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedBtnSize(s)}
                      className={`px-3 py-1.5 rounded-md text-12 cursor-pointer transition-all ${
                        selectedBtnSize === s
                          ? "bg-accent-primary text-on-color font-medium"
                          : "bg-surface-2 text-secondary hover:bg-surface-3"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  {PLAYGROUND_SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`px-3 py-1.5 rounded-md text-12 cursor-pointer transition-all ${
                        selectedSize === s
                          ? "bg-accent-primary text-on-color font-medium"
                          : "bg-surface-2 text-secondary hover:bg-surface-3"
                      }`}
                    >
                      {s}px
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Color tokens OR IconButton variant */}
            <div className="space-y-2">
              <label className="text-12 font-medium text-secondary uppercase tracking-wider">
                {useIconButton ? "Variant" : "Color Token"}
              </label>
              {useIconButton ? (
                <div className="flex flex-wrap gap-2">
                  {(["primary", "secondary", "tertiary", "ghost", "error-fill", "error-outline"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-12 cursor-pointer transition-all ${
                        selectedVariant === v
                          ? "bg-accent-primary text-on-color font-medium"
                          : "bg-surface-2 text-secondary hover:bg-surface-3"
                      }`}
                    >
                      <IconButton variant={v} size="sm" icon={ICON_REGISTRY[selectedIcon]} />
                      {v}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ICON_COLOR_TOKENS.map((c) => (
                    <button
                      key={c.token}
                      type="button"
                      onClick={() => setSelectedColor(c.token)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-12 cursor-pointer transition-all ${
                        selectedColor === c.token
                          ? "bg-accent-primary text-on-color font-medium"
                          : "bg-surface-2 text-secondary hover:bg-surface-3"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* IconButton toggle */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="text-12 font-medium text-secondary uppercase tracking-wider">Use as IconButton</label>
                <button
                  type="button"
                  onClick={() => setUseIconButton(!useIconButton)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${
                    useIconButton ? "bg-accent-primary" : "bg-layer-3"
                  }`}
                >
                  <span
                    className={`inline-block size-3.5 rounded-full bg-white transition-transform ${
                      useIconButton ? "translate-x-4.5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Code output */}
            <div className="space-y-2">
              <label className="text-12 font-medium text-secondary uppercase tracking-wider">Code</label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-surface-2 px-4 py-3 rounded-lg text-13 text-primary font-mono">
                  {snippet}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="relative flex items-center gap-2 px-4 py-3 bg-accent-primary text-on-color rounded-lg text-13 font-medium cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                >
                  Copy
                  {copied && (
                    <span
                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 bg-success-primary rounded-full"
                      style={{ animation: "check-pop 0.3s ease-out" }}
                    >
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13.3 4.3a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L6.6 9.6l5.3-5.3a1 1 0 0 1 1.4 0Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
});
