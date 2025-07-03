import { GROUPED_PROFILE_SETTINGS, GROUPED_WORKSPACE_SETTINGS } from "@plane/constants";
import { PROJECT_SETTINGS_LINKS } from "@/plane-web/constants";

const hrefToLabelMap = (options: Record<string, Array<{ href: string; i18n_label: string; [key: string]: any }>>) =>
  Object.values(options)
    .flat()
    .reduce(
      (acc, setting) => {
        acc[setting.href] = setting.i18n_label;
        return acc;
      },
      {} as Record<string, string>
    );

const workspaceHrefToLabelMap = hrefToLabelMap(GROUPED_WORKSPACE_SETTINGS);

const profiletHrefToLabelMap = hrefToLabelMap(GROUPED_PROFILE_SETTINGS);

const projectHrefToLabelMap = PROJECT_SETTINGS_LINKS.reduce(
  (acc, setting) => {
    acc[setting.href] = setting.i18n_label;
    return acc;
  },
  {} as Record<string, string>
);

export const pathnameToAccessKey = (pathname: string) => {
  const pathArray = pathname.replace(/^\/|\/$/g, "").split("/"); // Regex removes leading and trailing slashes
  const workspaceSlug = pathArray[0];
  const accessKey = pathArray.slice(1, 3).join("/");
  return { workspaceSlug, accessKey: `/${accessKey}` || "" };
};

export const getWorkspaceActivePath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const settingsIndex = parts.indexOf("settings");
  if (settingsIndex === -1) return null;
  const subPath = "/" + parts.slice(settingsIndex, settingsIndex + 2).join("/");
  return workspaceHrefToLabelMap[subPath];
};

export const getProfileActivePath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const settingsIndex = parts.indexOf("settings");
  if (settingsIndex === -1) return null;
  const subPath = "/" + parts.slice(settingsIndex, settingsIndex + 3).join("/");
  return profiletHrefToLabelMap[subPath];
};

export const getProjectActivePath = (pathname: string) => {
  const parts = pathname.split("/").filter(Boolean);
  const settingsIndex = parts.indexOf("settings");
  if (settingsIndex === -1) return null;
  const subPath = parts.slice(settingsIndex + 3, settingsIndex + 4).join("/");
  return subPath ? projectHrefToLabelMap["/" + subPath] : projectHrefToLabelMap[subPath];
};
