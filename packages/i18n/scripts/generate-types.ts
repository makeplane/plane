import fs from "fs";
import path from "path";

interface TranslationEntry {
  id: string;
  key: string;
  fullPath: string;
  translations: Record<
    string,
    {
      status: string;
      value: string;
    }
  >;
}

function generateTypes() {
  const tempDir = path.join(__dirname, "locale/.temp");
  const outputFile = path.join(__dirname, "../src/types/generated-translations.d.ts");

  // Read all generated JSON files
  const files = fs.readdirSync(tempDir).filter((file) => file.startsWith("generated-") && file.endsWith(".json"));

  let allTranslations: TranslationEntry[] = [];

  // Combine all translations
  files.forEach((file) => {
    const content = JSON.parse(fs.readFileSync(path.join(tempDir, file), "utf-8"));
    allTranslations = allTranslations.concat(content);
  });

  // Get all flat keys
  const flatKeys = allTranslations.map((entry) => `"${entry.key}"`).join(" | ");

  // Generate the type definition file content
  const typeContent = `// This file is auto-generated. DO NOT EDIT.

// All translation keys as a union type
export type TranslationKeys = ${flatKeys};


// Available languages
export type AvailableLanguages = "${Object.keys(allTranslations[0].translations).join('" | "')}";
`;

  // Write the type definition file
  fs.writeFileSync(outputFile, typeContent);
  console.log(`Generated types at: ${outputFile}`);
}

generateTypes();
