import { RuleRegistry } from "../registries/rule-registry";

// Register standard rules
RuleRegistry.register({
  condition: "isDeletedAndInDocument",
  action: "removeNode",
  priority: 100, // Higher priority to handle deletions first
});

RuleRegistry.register({
  condition: "isNewPageAndNotInDocument",
  action: "addPageEmbed",
  priority: 10,
});

// Register rules for moved pages
RuleRegistry.register({
  condition: "isMovedPageButStillEmbed",
  action: "replacePageEmbedWithLink",
  priority: 90, // High priority but below deletions
});

// Register rule for nodes in document but not in backend
RuleRegistry.register({
  condition: "isInDocumentButNotInBackend",
  action: "removeNode",
  priority: 95, // High priority but below deletions
});
