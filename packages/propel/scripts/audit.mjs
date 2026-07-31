#!/usr/bin/env node
// Design System Audit Script
// Generates AUDIT.md with coverage report for packages/propel and packages/ui

import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd(), "../..");
const PROPEL_SRC = resolve(process.cwd(), "src");
const UI_SRC = resolve(ROOT, "packages/ui/src");

function getComponentDirs(srcPath) {
  if (!existsSync(srcPath)) return [];
  return readdirSync(srcPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((d) => !["styles", "utils", "assets", "icons", "charts", "spinners", "design-system"].includes(d));
}

function analyzeComponent(srcPath, name) {
  const dir = join(srcPath, name);
  const files = existsSync(dir) ? readdirSync(dir) : [];

  const hasComponent = files.some(
    (f) => f.endsWith(".tsx") && !f.includes("stories") && !f.includes("helper") && !f.includes("index")
  );
  const hasHelper = files.includes("helper.tsx");
  const hasIndex = files.includes("index.ts") || files.includes("index.tsx");
  const storyFile = files.find((f) => f.includes(".stories."));
  const hasStory = !!storyFile;

  let storyQuality = "❌ sin story";
  let figmaLink = false;
  let propDocs = false;
  let variantCount = 0;
  let hardcodedValues = false;

  if (hasStory) {
    const storyContent = readFileSync(join(dir, storyFile), "utf-8");
    const storyLines = storyContent.split("\n").length;

    // Check for Figma link
    figmaLink = storyContent.includes("addon-designs") || storyContent.includes("figma.com");

    // Check for prop documentation (argTypes descriptions)
    propDocs = storyContent.includes("description:") || storyContent.includes("argTypes");

    // Count story exports (rough proxy for coverage)
    const storyCount = (storyContent.match(/^export const /gm) || []).length;

    if (storyLines < 30) storyQuality = "⚠️ story mínima";
    else if (storyCount >= 3) storyQuality = "✅ story completa";
    else storyQuality = "⚠️ story básica";
  }

  // Check helper for CVA variants
  if (hasHelper) {
    const helperContent = readFileSync(join(dir, "helper.tsx"), "utf-8");
    const cvaMatches = helperContent.match(/variants:\s*{([^}]+)}/s);
    if (cvaMatches) {
      variantCount = (cvaMatches[1].match(/\w+:/g) || []).length;
    }
    // Check for hardcoded hex values
    hardcodedValues = /#[0-9a-fA-F]{3,6}/.test(helperContent) || /\d+px/.test(helperContent.replace(/\d+px;/g, ""));
  }

  // Also check main component file for hardcoded values
  const componentFile = files.find(
    (f) => f.endsWith(".tsx") && !f.includes("stories") && !f.includes("helper") && !f.includes("index")
  );
  if (componentFile) {
    const componentContent = readFileSync(join(dir, componentFile), "utf-8");
    if (!hardcodedValues) {
      hardcodedValues = /#[0-9a-fA-F]{3,6}/.test(componentContent);
    }
  }

  return {
    name,
    hasComponent,
    hasHelper,
    hasIndex,
    hasStory,
    storyQuality,
    figmaLink,
    propDocs,
    variantCount,
    hardcodedValues,
  };
}

function analyzeSpecialDirs(srcPath) {
  const results = [];
  const specialDirs = ["charts", "spinners", "icons"];

  for (const dir of specialDirs) {
    const fullPath = join(srcPath, dir);
    if (!existsSync(fullPath)) continue;

    const files = readdirSync(fullPath, { withFileTypes: true });
    const subdirs = files.filter((f) => f.isDirectory()).map((f) => f.name);
    const storyFile = readdirSync(fullPath).find((f) => f.includes(".stories."));

    results.push({
      name: dir,
      hasComponent: subdirs.length > 0,
      hasHelper: existsSync(join(fullPath, "helper.tsx")),
      hasIndex: existsSync(join(fullPath, "index.ts")),
      hasStory: !!storyFile,
      storyQuality: storyFile ? "⚠️ story de grupo" : "❌ sin story",
      figmaLink: false,
      propDocs: false,
      variantCount: subdirs.length,
      hardcodedValues: false,
      isGroup: true,
      subComponents: subdirs,
    });
  }
  return results;
}

// --- Run audit ---

const propelDirs = getComponentDirs(PROPEL_SRC);
const uiDirs = getComponentDirs(UI_SRC);

const propelResults = [
  ...propelDirs.map((name) => analyzeComponent(PROPEL_SRC, name)),
  ...analyzeSpecialDirs(PROPEL_SRC),
];

const uiResults = uiDirs.map((name) => analyzeComponent(UI_SRC, name));

// Find UI components without propel equivalent
const propelNames = new Set(propelResults.map((r) => r.name.toLowerCase()));
const uiWithoutPropel = uiResults.filter((r) => {
  const similar = [...propelNames].some((p) => p.includes(r.name.toLowerCase()) || r.name.toLowerCase().includes(p));
  return !similar;
});

// Stats
const propelWithStory = propelResults.filter((r) => r.hasStory).length;
const propelWithFigma = propelResults.filter((r) => r.figmaLink).length;
const propelWithDocs = propelResults.filter((r) => r.propDocs).length;
const propelComplete = propelResults.filter((r) => r.storyQuality.includes("✅")).length;
const propelHardcoded = propelResults.filter((r) => r.hardcodedValues).length;

// --- Generate Markdown ---

const now = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

let md = `# Auditoría del Design System de Plane
*Generado el ${now}*

---

## Resumen Ejecutivo

| Métrica | Propel | UI (legacy) |
|---------|--------|-------------|
| Total componentes | ${propelResults.length} | ${uiResults.length} |
| Con story | ${propelWithStory}/${propelResults.length} (${Math.round((propelWithStory / propelResults.length) * 100)}%) | — |
| Stories completas | ${propelComplete}/${propelResults.length} (${Math.round((propelComplete / propelResults.length) * 100)}%) | — |
| Con Figma link | ${propelWithFigma}/${propelResults.length} (${Math.round((propelWithFigma / propelResults.length) * 100)}%) | — |
| Con prop docs | ${propelWithDocs}/${propelResults.length} (${Math.round((propelWithDocs / propelResults.length) * 100)}%) | — |
| Valores hardcodeados | ${propelHardcoded} componentes ⚠️ | — |
| Sin equivalente en propel | — | ${uiWithoutPropel.length} componentes |

---

## packages/propel — Estado por componente

| Componente | Story | Calidad | Figma | Prop docs | Variants CVA | Hardcoded |
|-----------|-------|---------|-------|-----------|-------------|-----------|
`;

for (const r of propelResults.toSorted((a, b) => a.name.localeCompare(b.name))) {
  const story = r.hasStory ? "✅" : "❌";
  const figma = r.figmaLink ? "✅" : "—";
  const docs = r.propDocs ? "✅" : "—";
  const hardcoded = r.hardcodedValues ? "⚠️" : "✅";
  const variants = r.variantCount > 0 ? `${r.variantCount}` : "—";
  md += `| \`${r.name}\` | ${story} | ${r.storyQuality} | ${figma} | ${docs} | ${variants} | ${hardcoded} |\n`;
}

md += `
---

## packages/ui (legacy) — Componentes sin equivalente en propel

Estos ${uiWithoutPropel.length} componentes de \`packages/ui\` no tienen equivalente en \`packages/propel\` y son **candidatos a migrar o crear**:

| Componente | Tiene story | Tiene helper CVA |
|-----------|-------------|-----------------|
`;

for (const r of uiWithoutPropel.toSorted((a, b) => a.name.localeCompare(b.name))) {
  const story = r.hasStory ? "✅" : "❌";
  const helper = r.hasHelper ? "✅" : "❌";
  md += `| \`${r.name}\` | ${story} | ${helper} |\n`;
}

md += `
---

## Prioridades de acción

### 🔴 Crítico — Stories faltantes en propel
`;

const noStory = propelResults.filter((r) => !r.hasStory);
if (noStory.length === 0) {
  md += `✅ Todos los componentes tienen al menos una story.\n`;
} else {
  for (const r of noStory) {
    md += `- [ ] \`${r.name}\` — crear story completa\n`;
  }
}

md += `
### 🟡 Mejorar — Stories básicas o mínimas
`;

const basicStory = propelResults.filter((r) => r.hasStory && !r.storyQuality.includes("✅"));
for (const r of basicStory) {
  md += `- [ ] \`${r.name}\` (${r.storyQuality}) — ampliar con más variants y prop docs\n`;
}

md += `
### 🟠 Figma links faltantes
`;

const noFigma = propelResults.filter((r) => !r.figmaLink);
for (const r of noFigma) {
  md += `- [ ] \`${r.name}\` — añadir Figma link via \`@storybook/addon-designs\`\n`;
}

md += `
### 🟡 Valores hardcodeados detectados
`;

const hardcoded = propelResults.filter((r) => r.hardcodedValues);
if (hardcoded.length === 0) {
  md += `✅ No se detectaron valores hardcodeados. Todos usan tokens semánticos.\n`;
} else {
  for (const r of hardcoded) {
    md += `- [ ] \`${r.name}\` — revisar y reemplazar con tokens de \`tailwind-config\`\n`;
  }
}

md += `
### 🔵 Migración de ui → propel
`;
for (const r of uiWithoutPropel) {
  md += `- [ ] Crear \`${r.name}\` en propel basado en la implementación de ui\n`;
}

md += `
---

## Próximos pasos

1. **Completar stories** de los ${noStory.length} componentes sin cobertura
2. **Añadir Figma links** a todos los componentes en Storybook
3. **Construir MCP server** en \`packages/design-system-mcp/\` para acceso agéntico
4. **Añadir AI components**: \`AIInput\`, \`AICommandPalette\`, \`StreamingText\`
5. **Migrar** los ${uiWithoutPropel.length} componentes de ui sin equivalente en propel

---
*Script: \`packages/propel/scripts/audit.mjs\`*
`;

const outputPath = resolve(process.cwd(), "AUDIT.md");
writeFileSync(outputPath, md);
console.log(`✅ Auditoría completada → ${outputPath}`);
console.log(`\nResumen:`);
console.log(
  `  propel: ${propelResults.length} componentes, ${propelWithStory} con story (${Math.round((propelWithStory / propelResults.length) * 100)}%)`
);
console.log(`  Stories completas: ${propelComplete}/${propelResults.length}`);
console.log(`  Sin Figma link: ${noFigma.length}`);
console.log(`  ui sin equivalente en propel: ${uiWithoutPropel.length}`);
