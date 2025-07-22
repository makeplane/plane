export const hideFloatingBot = () => {
  const floatingBot = document.getElementById("floating-bot");
  if (floatingBot) {
    floatingBot.style.display = "none";
  }
};

export const showFloatingBot = () => {
  const floatingBot = document.getElementById("floating-bot");
  if (floatingBot) {
    floatingBot.style.display = "flex";
  }
};

const ALLOWED_PATHS = [
  "/projects/:projectId/cycles/:cycleId/",
  "/projects/:projectId/modules/:moduleId/",
  "/projects/:projectId/pages/",
  "/projects/:projectId/issues/",
  "/projects/:projectId/epics/",
  "/browse/:issueIdentifier/",
];

// Convert a path like "/projects/:projectId/pages/" to a regex
const pathToRegex = (path: string) =>
  new RegExp(
    "^" +
      path
        .replace(/:[^/]+/g, "[^/]+") // Replace :param with wildcard
        .replace(/\/$/, "") + // Remove trailing slash for matching consistency
      "/?$" // Allow optional trailing slash
  );

const regexList = ALLOWED_PATHS.map(pathToRegex);

export const isPiAllowed = (pathname: string): boolean => regexList.some((regex) => regex.test(pathname));
