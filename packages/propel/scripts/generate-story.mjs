#!/usr/bin/env node
/**
 * Story generator for propel components.
 *
 * Usage:
 *   node scripts/generate-story.mjs <ComponentName> [--force]
 *   pnpm generate-story Button
 *   pnpm generate-story AIInput --force
 *
 * Reads helper.tsx (CVA variants + props) and the component .tsx file,
 * then generates a complete .stories.tsx following the propel pattern.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, resolve } from "path";

const PROPEL_SRC = resolve(process.cwd(), "src");

// ─── String helpers ──────────────────────────────────────────────────────────

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase → camel-Case
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2") // AIInput → AI-Input (acronym + word)
    .toLowerCase();
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function humanize(camelCase) {
  return capitalizeFirst(
    camelCase
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim()
  );
}

// ─── Balanced-brace extractor ─────────────────────────────────────────────────

/**
 * Given content and the index of an opening `{`, returns the inner text
 * up to (not including) the matching closing `}`.
 */
function extractBracedBlock(content, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < content.length; i++) {
    if (content[i] === "{") depth++;
    else if (content[i] === "}") {
      depth--;
      if (depth === 0) return content.slice(openBraceIndex + 1, i);
    }
  }
  return null;
}

// ─── CVA variant parser ───────────────────────────────────────────────────────

/**
 * Strips string literals from content so that Tailwind class modifiers
 * (hover:, active:, disabled:) inside them are not mistaken for object keys.
 */
function stripStringLiterals(content) {
  return content
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, (m) => '"' + " ".repeat(m.length - 2) + '"')
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, (m) => "'" + " ".repeat(m.length - 2) + "'")
    .replace(/`[^`\\]*(?:\\.[^`\\]*)*`/g, (m) => "`" + " ".repeat(m.length - 2) + "`");
}

/**
 * Returns { variants: { key: string[] }, defaultVariants: { key: string } }
 * from a helper.tsx that uses cva().
 */
function extractCVAVariants(content) {
  const result = { variants: {}, defaultVariants: {} };

  // Find `variants: {`
  const variantsKeyRe = /\bvariants\s*:\s*\{/;
  const variantsKeyMatch = variantsKeyRe.exec(content);
  if (variantsKeyMatch) {
    const openBrace = content.indexOf("{", variantsKeyMatch.index + variantsKeyMatch[0].length - 1);
    const variantsBlock = extractBracedBlock(content, openBrace);

    if (variantsBlock) {
      // Each variant group: `key: {` — parse on a stripped version to avoid matching
      // Tailwind class modifiers (hover:, active:) inside string values.
      const stripped = stripStringLiterals(variantsBlock);
      const groupRe = /\b(\w+)\s*:\s*\{/g;
      let m;
      while ((m = groupRe.exec(stripped)) !== null) {
        const variantName = m[1];
        // Use the original block for brace extraction (stripped has same length)
        const braceIdx = variantsBlock.indexOf("{", m.index + m[0].length - 1);
        const optionsBlock = extractBracedBlock(variantsBlock, braceIdx);
        if (optionsBlock) {
          // Extract option keys line-by-line to avoid matching Tailwind modifiers
          // (hover:, active:) that appear inside the string values on the same line.
          // Each option key appears at the start of its own line.
          const keys = [];
          for (const line of optionsBlock.split("\n")) {
            const t = line.trim();
            if (!t || t.startsWith("//") || t.startsWith("*")) continue;
            const keyMatch = /^["']?([\w-]+)["']?\s*:/.exec(t);
            if (keyMatch) keys.push(keyMatch[1]);
          }
          if (keys.length) result.variants[variantName] = keys;
        }
      }
    }
  }

  // Find `defaultVariants: { key: "value" ... }`
  const defMatch = /\bdefaultVariants\s*:\s*\{([^}]+)\}/.exec(content);
  if (defMatch) {
    for (const [, key, val] of defMatch[1].matchAll(/(\w+)\s*:\s*["']([^"']+)["']/g)) {
      result.defaultVariants[key] = val;
    }
  }

  return result;
}

// ─── Interface prop parser ────────────────────────────────────────────────────

/** Parses a props object body (between `{` and `}`) into prop descriptors. */
function parsePropsBody(body, out) {
  const lines = body.split("\n");
  let pendingComment = null;

  for (const line of lines) {
    const t = line.trim();

    // JSDoc / inline comment
    if (t.startsWith("/**") || t.startsWith("*") || t.startsWith("//")) {
      const cm = /[/*\s]+(.+)/.exec(t);
      if (cm && !t.startsWith("*/")) pendingComment = cm[1].trim().replace(/\*\/$/, "").trim();
      continue;
    }

    // Property line: `name?:` or `name:`
    const m = /^([\w]+)(\??):\s*(.+?)\s*;?\s*$/.exec(t);
    if (!m) {
      if (t !== "") pendingComment = null;
      continue;
    }

    out.push({ name: m[1], optional: m[2] === "?", type: m[3].replace(/;$/, "").trim(), comment: pendingComment });
    pendingComment = null;
  }
}

/**
 * Extracts non-inherited, non-function props from the helper.
 * Handles both `interface XxxProps { ... }` and `type XxxProps = ... & { ... }`.
 * Returns [{ name, type, optional, comment }]
 */
function extractPropsFromHelper(content) {
  const props = [];

  // Strategy 1: interface declaration
  const ifaceMatch = /\binterface\s+\w+Props[^{]*\{/.exec(content);
  if (ifaceMatch) {
    const openBrace = content.indexOf("{", ifaceMatch.index + ifaceMatch[0].length - 1);
    const body = extractBracedBlock(content, openBrace);
    if (body) parsePropsBody(body, props);
    return props;
  }

  // Strategy 2: type alias — find all `& {` object literals after `type XxxProps`
  const typeMatch = /\btype\s+\w+Props\b/.exec(content);
  if (typeMatch) {
    const afterType = content.slice(typeMatch.index);
    const ampRe = /&\s*\{/g;
    let m;
    while ((m = ampRe.exec(afterType)) !== null) {
      const braceIdx = typeMatch.index + m.index + m[0].length - 1;
      const body = extractBracedBlock(content, braceIdx);
      if (body) parsePropsBody(body, props);
    }
  }

  return props;
}

// ─── Component name finder ────────────────────────────────────────────────────

function findComponentFile(dir) {
  const files = readdirSync(dir);
  return files.find(
    (f) => f.endsWith(".tsx") && !f.includes(".stories.") && !f.includes("helper") && !f.includes("index")
  );
}

/**
 * Scans files in the component dir to find the exported PascalCase component name.
 * Falls back to the provided PascalCase name.
 */
function findExportedComponent(dir, fallback) {
  const componentFile = findComponentFile(dir);
  if (!componentFile) return fallback;

  const content = readFileSync(join(dir, componentFile), "utf8");

  // export { Name };
  const namedExport = /export\s*\{\s*(\w+)\s*\}/.exec(content);
  if (namedExport) return namedExport[1];

  // export const Name = or export function Name
  const directExport = /export\s+(?:const|function)\s+(\w+)/.exec(content);
  if (directExport) return directExport[1];

  return fallback;
}

/**
 * Returns true if the component file contains `{children}` or `children` in JSX.
 */
function componentUsesChildren(dir) {
  const componentFile = findComponentFile(dir);
  if (!componentFile) return false;
  const content = readFileSync(join(dir, componentFile), "utf8");
  return /\{children\}/.test(content);
}

// ─── Storybook argType builder ────────────────────────────────────────────────

const SKIP_TYPES = [
  "React.ReactElement",
  "React.ReactNode",
  "React.CSSProperties",
  "React.ForwardedRef",
  "React.RefObject",
  "React.MutableRefObject",
  "MouseEvent",
  "KeyboardEvent",
  "ChangeEvent",
  "FocusEvent",
  "FormEvent",
  "RefObject",
  "ForwardedRef",
];

function shouldSkipProp(name, type) {
  if (SKIP_TYPES.some((t) => type.includes(t))) return true;
  if (type.startsWith("(") || /=>/.test(type)) return true; // function type
  if (name === "className" || name === "style") return true;
  if (name === "ref") return true;
  if (name.startsWith("on") && /[A-Z]/.test(name[2] || "")) return true; // event handlers
  return false;
}

/**
 * Scans helper content for simple string-union type aliases.
 * Returns a map like { TThinkingStatus: '"thinking" | "typing" | "done"' }
 */
function extractTypeAliases(content) {
  const map = {};
  // type TXxx = "a" | "b" | "c";
  for (const [, name, body] of content.matchAll(
    /\btype\s+(T\w+)\s*=\s*(["'][\w-]+["'](?:\s*\|\s*["'][\w-]+["'])+)\s*;/g
  )) {
    map[name] = body.trim();
  }
  return map;
}

function buildArgType(name, type, comment, defaultValue, typeAliases = {}) {
  // Resolve type alias before any check
  const resolvedType = typeAliases[type] ?? type;

  if (shouldSkipProp(name, resolvedType)) return null;

  const description = comment || humanize(name);

  if (resolvedType === "boolean") {
    return {
      control: "boolean",
      description,
      table: { defaultValue: { summary: String(defaultValue ?? "false") } },
    };
  }

  // String literal union: "a" | "b" | "c"
  if (/^["'][\w-]+["'](\s*\|\s*["'][\w-]+["'])*$/.test(resolvedType)) {
    const options = [...resolvedType.matchAll(/["']([\w-]+)["']/g)].map((m) => m[1]);
    return {
      control: "select",
      options,
      description,
      table: { defaultValue: { summary: defaultValue ? `"${defaultValue}"` : `"${options[0]}"` } },
    };
  }

  if (resolvedType === "string") {
    return { control: "text", description };
  }

  if (resolvedType === "number") {
    return { control: "number", description, table: { defaultValue: { summary: String(defaultValue ?? "0") } } };
  }

  return null;
}

// ─── Story content builder ────────────────────────────────────────────────────

function argTypeToString(name, def) {
  const lines = [`    ${name}: {`];
  lines.push(`      control: ${JSON.stringify(def.control)},`);
  if (def.options) lines.push(`      options: ${JSON.stringify(def.options)},`);
  lines.push(`      description: ${JSON.stringify(def.description)},`);
  if (def.table) {
    const tv = def.table.defaultValue;
    lines.push(`      table: { defaultValue: { summary: ${JSON.stringify(tv.summary)} } },`);
  }
  lines.push(`    },`);
  return lines.join("\n");
}

function argsToString(args) {
  const entries = Object.entries(args)
    .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`)
    .join("\n");
  return `{\n${entries}\n  }`;
}

function generatePerVariantStories(variantKey, options, componentName, defaultVariants) {
  if (!variantKey || !options) return "";
  return options
    .map((opt) => {
      const storyName = opt.split("-").map(capitalizeFirst).join("");
      const childrenArg = defaultVariants.children !== undefined ? "" : `\n    children: "${capitalizeFirst(opt)}",`;
      return `export const ${storyName}: Story = {\n  args: {\n    variant: ${JSON.stringify(opt)},${childrenArg}\n  },\n};`;
    })
    .join("\n\n");
}

function generateAllVariantsRender(variantKey, options, componentName, hasChildren) {
  const items = options.map((opt) => {
    const label = opt.split("-").map(capitalizeFirst).join(" ");
    return hasChildren
      ? `          <${componentName} ${variantKey}="${opt}">${label}</${componentName}>`
      : `          <${componentName} ${variantKey}="${opt}" />`;
  });
  return `  render() {\n    return (\n      <div className="flex flex-wrap gap-2">\n${items.join("\n")}\n      </div>\n    );\n  },`;
}

function generateAllSizesRender(sizeKey, options, componentName, hasChildren) {
  const items = options.map((opt) => {
    const label = capitalizeFirst(opt);
    return hasChildren
      ? `          <${componentName} size="${opt}">${label}</${componentName}>`
      : `          <${componentName} size="${opt}" />`;
  });
  return `  render() {\n    return (\n      <div className="flex items-center gap-2">\n${items.join("\n")}\n      </div>\n    );\n  },`;
}

// ─── Main generator ───────────────────────────────────────────────────────────

function generateStoryContent(options) {
  const { componentName, kebabName, cvaData, extraProps, hasChildren, typeAliases = {} } = options;

  const isAIComponent =
    componentName.startsWith("AI") || ["StreamingText", "ThinkingIndicator"].includes(componentName);
  const category = isAIComponent ? "AI Components" : "Components";

  const variantKey = Object.keys(cvaData.variants).find((k) => k === "variant");
  const sizeKey = Object.keys(cvaData.variants).find((k) => k === "size");
  const defaultVariants = cvaData.defaultVariants;

  // ── args ──
  const args = {};
  if (hasChildren) args.children = componentName;
  for (const [k, v] of Object.entries(defaultVariants)) args[k] = v;
  for (const prop of extraProps) {
    if (prop.type === "boolean" && !shouldSkipProp(prop.name, prop.type)) {
      args[prop.name] = false;
    }
  }

  // ── argTypes ──
  const argTypeParts = [];

  // CVA variants as argTypes
  for (const [key, opts] of Object.entries(cvaData.variants)) {
    const def = {
      control: "select",
      options: opts,
      description: humanize(key),
      table: { defaultValue: { summary: defaultVariants[key] ? `"${defaultVariants[key]}"` : `"${opts[0]}"` } },
    };
    argTypeParts.push(argTypeToString(key, def));
  }

  // Extra props (from interface)
  for (const prop of extraProps) {
    if (prop.name in args && prop.type !== "boolean") continue; // already in args as CVA
    const at = buildArgType(prop.name, prop.type, prop.comment, undefined, typeAliases);
    if (at) argTypeParts.push(argTypeToString(prop.name, at));
  }

  // ── per-variant stories ──
  const variantOptions = variantKey ? cvaData.variants[variantKey] : [];
  const perVariantStories =
    variantOptions.length > 0 && variantOptions.length <= 8
      ? generatePerVariantStories(variantKey, variantOptions, componentName, defaultVariants)
      : "";

  // ── AllVariants story ──
  const allVariantsStory =
    variantOptions.length > 0
      ? `export const AllVariants: Story = {\n${generateAllVariantsRender(variantKey, variantOptions, componentName, hasChildren)}\n};`
      : "";

  // ── AllSizes story ──
  const sizeOptions = sizeKey ? cvaData.variants[sizeKey] : [];
  const allSizesStory =
    sizeOptions.length > 0
      ? `export const AllSizes: Story = {\n${generateAllSizesRender(sizeKey, sizeOptions, componentName, hasChildren)}\n};`
      : "";

  // ── assemble file ──
  const needsReactImport = allVariantsStory || allSizesStory || perVariantStories;
  const importLine = `import type { Meta, StoryObj } from "@storybook/react-vite";`;
  const reactImportLine = needsReactImport ? `import * as React from "react";\n` : "";

  const metaBlock = [
    `const meta = {`,
    `  title: "${category}/${componentName}",`,
    `  component: ${componentName},`,
    `  parameters: { layout: isAIComponent || sizeOptions.length > 0 ? "padded" : "centered" },`,
    `  tags: ["autodocs"],`,
    `  args: ${argsToString(args)},`,
    argTypeParts.length > 0 ? `  argTypes: {\n${argTypeParts.join("\n")}\n  },` : "",
    `} satisfies Meta<typeof ${componentName}>;`,
  ]
    .filter(Boolean)
    .join("\n");

  // Fix: replace the placeholder literal in the parameters line
  const layout = isAIComponent || sizeOptions.length > 0 ? "padded" : "centered";
  const metaFixed = metaBlock.replace(
    `parameters: { layout: isAIComponent || sizeOptions.length > 0 ? "padded" : "centered" },`,
    `parameters: { layout: "${layout}" },`
  );

  const sections =
    [
      `/**`,
      ` * Copyright (c) 2023-present Plane Software, Inc. and contributors`,
      ` * SPDX-License-Identifier: AGPL-3.0-only`,
      ` * See the LICENSE file for details.`,
      ` */`,
      ``,
      reactImportLine.trimEnd(),
      importLine,
      `import { ${componentName} } from "./${kebabName}";`,
      ``,
      metaFixed,
      ``,
      `export default meta;`,
      `type Story = StoryObj<typeof meta>;`,
      ``,
      `export const Default: Story = {};`,
      ``,
      perVariantStories,
      allVariantsStory,
      allSizesStory,
    ]
      .filter((s) => s !== undefined && s !== null)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd() + "\n";

  return sections;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const rawName = args.find((a) => !a.startsWith("--"));
  const force = args.includes("--force");

  if (!rawName) {
    console.error("Usage: node scripts/generate-story.mjs <ComponentName> [--force]");
    console.error("Example: node scripts/generate-story.mjs Button");
    process.exit(1);
  }

  // Normalize: accept both Button and button
  const componentName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
  const kebabName = toKebabCase(componentName);
  const componentDir = join(PROPEL_SRC, kebabName);

  if (!existsSync(componentDir)) {
    console.error(`❌  Component directory not found: ${componentDir}`);
    console.error(`    Make sure packages/propel/src/${kebabName}/ exists.`);
    process.exit(1);
  }

  const storyPath = join(componentDir, `${kebabName}.stories.tsx`);

  if (existsSync(storyPath) && !force) {
    console.log(`⚠️   Story already exists: src/${kebabName}/${kebabName}.stories.tsx`);
    console.log(`    Use --force to overwrite.`);
    process.exit(0);
  }

  // ── Read helper.tsx ──
  const helperPath = join(componentDir, "helper.tsx");
  const helperContent = existsSync(helperPath) ? readFileSync(helperPath, "utf8") : "";

  const cvaData = extractCVAVariants(helperContent);
  const extraProps = extractPropsFromHelper(helperContent);
  const typeAliases = extractTypeAliases(helperContent);

  // ── Find actual exported component name ──
  const exportedName = findExportedComponent(componentDir, componentName);

  // ── Check for children usage ──
  const hasChildren = componentUsesChildren(componentDir);

  // ── Generate ──
  const content = generateStoryContent({
    componentName: exportedName,
    kebabName,
    cvaData,
    extraProps,
    hasChildren,
    typeAliases,
  });

  writeFileSync(storyPath, content);

  const variantCount = Object.keys(cvaData.variants).length;
  const propsCount = extraProps.filter((p) => !shouldSkipProp(p.name, p.type)).length;

  console.log(`✅  Generated: src/${kebabName}/${kebabName}.stories.tsx`);
  console.log(`   Component : ${exportedName}`);
  console.log(`   CVA groups: ${variantCount} (${Object.keys(cvaData.variants).join(", ") || "none"})`);
  console.log(`   Extra props: ${propsCount} controllable`);
  if (Object.keys(cvaData.variants).find((k) => k === "variant")) {
    const opts = cvaData.variants.variant;
    console.log(`   Variant stories: ${opts.length} (${opts.join(", ")})`);
  }
}

main();
