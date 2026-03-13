module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Prevent use of legacy color tokens (text-color-*, border-color-*, bg-color-*)",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    messages: {
      legacyToken: "Use '{{ fixed }}' instead of legacy '{{ original }}'",
    },
  },

  create(context) {
    const LEGACY_RE = /(?<!-)(?:text|border|bg)-color-\S+/g;

    function fixString(str) {
      return str
        .replace(/(?<!-)text-color-/g, "text-")
        .replace(/(?<!-)border-color-/g, "border-")
        .replace(/(?<!-)bg-color-/g, "bg-");
    }

    function checkLiteral(node) {
      // Only check string literals (not template literal quasis)
      if (typeof node.value !== "string") return;

      if (!LEGACY_RE.test(node.value)) return;

      // Reset lastIndex after test()
      LEGACY_RE.lastIndex = 0;

      // Find first legacy token for reporting
      const match = LEGACY_RE.exec(node.value);
      LEGACY_RE.lastIndex = 0;

      // Reconstruct original token name from the value for the message
      const firstLegacy = (node.value.match(/(?<!-)(text|border|bg)-color-\S+/)?.[0] ?? node.value).split(/\s/)[0];
      const firstFixed = fixString(firstLegacy);

      context.report({
        node,
        messageId: "legacyToken",
        data: { original: firstLegacy, fixed: firstFixed },
        fix(fixer) {
          // Rebuild the raw source: replace only the value content, keep quotes intact
          const raw = context.sourceCode.getText(node);
          const quote = raw[0]; // ' or " or `
          const fixedRaw = quote + fixString(node.value) + quote;
          return fixer.replaceText(node, fixedRaw);
        },
      });
    }

    return {
      Literal: checkLiteral,
      TemplateLiteral(node) {
        // Check quasis (static parts of template literals)
        for (const quasi of node.quasis) {
          const val = quasi.value.cooked ?? quasi.value.raw;
          if (!LEGACY_RE.test(val)) {
            LEGACY_RE.lastIndex = 0;
            continue;
          }
          LEGACY_RE.lastIndex = 0;

          const firstLegacy = (val.match(/(?<!-)(text|border|bg)-color-\S+/)?.[0] ?? val).split(/\s/)[0];
          const firstFixed = fixString(firstLegacy);

          context.report({
            node: quasi,
            messageId: "legacyToken",
            data: { original: firstLegacy, fixed: firstFixed },
            fix(fixer) {
              // Replace the quasi text in source
              const src = context.sourceCode.getText(quasi);
              const fixedSrc = src
                .replace(/(?<!-)text-color-/g, "text-")
                .replace(/(?<!-)border-color-/g, "border-")
                .replace(/(?<!-)bg-color-/g, "bg-");
              return fixer.replaceText(quasi, fixedSrc);
            },
          });
        }
      },
    };
  },
};
