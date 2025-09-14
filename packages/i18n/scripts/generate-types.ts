import fs from "fs";
import path from "path";
import { LocaleManager } from "./locale/manager";
import { TranslationRow } from "./locale/types";

async function ensureGeneratedFiles() {
  const tempDir = path.join(__dirname, "locale/.temp");

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const manager = new LocaleManager();
  await manager.updateGeneratedTranslations("core");
  await manager.updateGeneratedTranslations("translations");
  await manager.updateGeneratedTranslations("accessibility");
  await manager.updateGeneratedTranslations("editor");
}

async function generateTypes() {
  const tempDir = path.join(__dirname, "locale/.temp");
  const outputFile = path.join(__dirname, "../src/types/generated-translations.d.ts");

  // Ensure generated files exist
  await ensureGeneratedFiles();

  // Read all generated JSON files
  const files = fs.readdirSync(tempDir).filter((file) => file.startsWith("generated-") && file.endsWith(".json"));

  let allTranslations: TranslationRow[] = [];

  // Combine all translations
  files.forEach((file) => {
    const content = JSON.parse(fs.readFileSync(path.join(tempDir, file), "utf-8"));
    allTranslations = allTranslations.concat(content);
  });

  // Get all flat keys
  const flatKeys = allTranslations.map((entry) => `"${entry.key}"\n`).join(" | ");

  // Generate the type definition file content
  const typeContent = `// This file is auto-generated. DO NOT EDIT.

// All translation keys as a union type
export type TranslationKeys =\n | ${flatKeys};

// Available languages
export type AvailableLanguages = "${Object.keys(allTranslations[0].translations).join('" | "')}";
`;

  // Write the type definition file
  fs.writeFileSync(outputFile, typeContent);
  console.log(`Generated types at: ${outputFile}`);
}

// Make the main function async
(async () => {
  try {
    await generateTypes();
  } catch (error) {
    console.error("Error generating types:", error);
    process.exit(1);
  }
})();
