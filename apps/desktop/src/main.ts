import { app, BrowserWindow, dialog, globalShortcut, Menu, session, shell, WebContents } from "electron";
import { randomUUID } from "crypto";
import todesktop from "@todesktop/runtime";
import Store from "electron-store";
import path from "path";

import { TabStore } from "./stores/tab-store";
import { NavigationStore } from "./stores/navigation-store";
import { InstanceStore } from "./stores/instance-store";
import { ViewManager } from "./managers/view-manager";
import { IPCBridge } from "./ipc/ipc-bridge";
import type { PersistedWindow, StoreSchema } from "./stores/types";
import { STORE_SCHEMA_VERSION } from "./stores/migrations";

todesktop.init();

// Set app metadata
app.setName("Plane");
app.setAboutPanelOptions({
  applicationName: "Plane",
  applicationVersion: app.getVersion(),
  version: process.versions.electron,
  copyright: "Copyright 2023-present Plane Software, Inc.",
  website: "https://plane.so",
  iconPath: path.join(__dirname, "..", "icon.png"),
});

const persistStore = new Store<StoreSchema>({
  defaults: {
    instanceUrl: undefined,
    windows: [],
    closedWindows: [],
    closedTabs: {},
    schemaVersion: STORE_SCHEMA_VERSION,
  },
});

// Create stores
const instanceStore = new InstanceStore(persistStore);
const tabStore = new TabStore(persistStore);

interface WindowContext {
  windowId: string;
  window: BrowserWindow;
  viewManager: ViewManager;
}

const windows = new Map<number, WindowContext>();
let ipcBridge: IPCBridge | undefined = undefined;
let pendingDeepLinkUrl: string | undefined = undefined;

function getWindowContextByWebContents(sender: WebContents): WindowContext | undefined {
  const window = BrowserWindow.fromWebContents(sender);
  if (!window) {
    return undefined;
  }

  return windows.get(window.id);
}

function getFocusedWindowContext(): WindowContext | undefined {
  const focused = BrowserWindow.getFocusedWindow();
  if (focused) {
    return windows.get(focused.id);
  }

  return windows.values().next().value;
}

function forEachWindowContext(callback: (context: WindowContext) => void): void {
  for (const context of windows.values()) {
    callback(context);
  }
}

function withFocusedViewManager(action: (viewManager: ViewManager) => void): void {
  const context = getFocusedWindowContext();
  if (!context) {
    return;
  }

  action(context.viewManager);
}

let downloadHandlerRegistered = false;
function registerDownloadHandler(): void {
  if (downloadHandlerRegistered) {
    return;
  }

  downloadHandlerRegistered = true;

  session.defaultSession.on("will-download", (_event, item) => {
    const sourceContents = (item as { getWebContents?: () => WebContents }).getWebContents?.();
    const sourceWindow = sourceContents ? BrowserWindow.fromWebContents(sourceContents) : undefined;
    const targetWindow = sourceWindow ?? getFocusedWindowContext()?.window;
    if (!targetWindow) {
      return;
    }

    const defaultPath = path.join(app.getPath("downloads"), item.getFilename());
    const savePath = dialog.showSaveDialogSync(targetWindow, {
      defaultPath,
      filters: [{ name: "All Files", extensions: ["*"] }],
    });

    if (!savePath) {
      item.cancel();
      return;
    }

    item.setSavePath(savePath);
  });
}

function clearStoredData(): void {
  const options = {
    type: "warning" as const,
    buttons: ["Cancel", "Clear"],
    defaultId: 1,
    cancelId: 0,
    title: "Clear Stored Data",
    message: "Clear local Plane desktop data?",
    detail: "This will remove saved instance settings, windows, and tabs. The app will restart.",
  };

  const targetWindow = getFocusedWindowContext()?.window;
  const result = targetWindow ? dialog.showMessageBoxSync(targetWindow, options) : dialog.showMessageBoxSync(options);

  if (result !== 1) {
    return;
  }

  persistStore.clear();
  app.relaunch();
  app.exit(0);
}

function restoreLastClosedWindow(): boolean {
  const closedWindow = tabStore.popClosedWindow();
  if (!closedWindow) {
    return false;
  }

  createMainWindow(randomUUID(), closedWindow);
  return true;
}

function handleInstanceUrlChanged(): void {
  const activeContext = getFocusedWindowContext();
  if (!activeContext) {
    return;
  }

  tabStore.setSuppressClosedWindowCapture(true);
  forEachWindowContext((context) => {
    if (context.window.id === activeContext.window.id) {
      return;
    }

    context.window.close();
  });
  tabStore.setSuppressClosedWindowCapture(false);

  tabStore.clearAllWindows();
  tabStore.registerWindow(activeContext.windowId);

  activeContext.viewManager.handleInstanceUrlChanged();
  activeContext.window.focus();
}

function createMainWindow(windowId: string = randomUUID(), windowState?: PersistedWindow): WindowContext {
  if (windowState) {
    tabStore.restoreWindow(windowId, windowState);
  } else {
    tabStore.registerWindow(windowId);
  }

  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition: { x: 16, y: 16 },
  });

  const navigationStore = new NavigationStore();
  const viewManager = new ViewManager(windowId, tabStore, navigationStore, instanceStore, restoreLastClosedWindow);

  viewManager.initialize(window);

  // Ensure menu bar is visible after leaving fullscreen.
  // On Linux with tiling WMs (e.g., Hyprland), the WM may exit fullscreen
  // externally, leaving Electron's menu bar in a hidden state.
  if (process.platform === "linux") {
    window.on("leave-full-screen", () => {
      window.setMenuBarVisibility(true);
      window.autoHideMenuBar = false;
    });
  }

  // Handle window close - destroy views BEFORE the window closes
  window.on("close", () => {
    tabStore.captureClosedWindow(windowId);
    viewManager.destroy();
    tabStore.unregisterWindow(windowId);
    windows.delete(window.id);
  });

  // After window is fully closed, clear the reference
  window.on("closed", () => {
    windows.delete(window.id);
  });

  const context: WindowContext = { windowId, window, viewManager };
  windows.set(window.id, context);
  return context;
}

function buildMenu(): void {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    // File menu
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CommandOrControl+N",
          click: () => {
            createMainWindow();
          },
        },
        { type: "separator" },
        {
          label: "Change Instance...",
          click: () => {
            instanceStore.setInstanceUrl(undefined);
            handleInstanceUrlChanged();
          },
        },
        {
          label: "Clear Stored Data...",
          click: () => {
            clearStoredData();
          },
        },
        { type: "separator" },
        ...(isMac ? [] : [{ role: "quit" as const }]),
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac ? [{ role: "pasteAndMatchStyle" as const }] : []),
        { role: "delete" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Actual Size",
          accelerator: "CommandOrControl+0",
          click: () => {
            withFocusedViewManager((manager) => {
              const view = manager.getActiveView();
              if (!view) {
                return;
              }

              view.webContents.setZoomLevel(0);
            });
          },
        },
        {
          label: "Zoom In",
          accelerator: "CommandOrControl+Plus",
          click: () => {
            withFocusedViewManager((manager) => {
              const view = manager.getActiveView();
              if (!view) {
                return;
              }

              const currentZoom = view.webContents.getZoomLevel();
              view.webContents.setZoomLevel(currentZoom + 0.5);
            });
          },
        },
        {
          label: "Zoom Out",
          accelerator: "CommandOrControl+-",
          click: () => {
            withFocusedViewManager((manager) => {
              const view = manager.getActiveView();
              if (!view) {
                return;
              }

              const currentZoom = view.webContents.getZoomLevel();
              view.webContents.setZoomLevel(currentZoom - 0.5);
            });
          },
        },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        {
          label: "Toggle Developer Tools",
          accelerator: isMac ? "Alt+Command+I" : "Ctrl+Shift+I",
          click: () => {
            withFocusedViewManager((manager) => {
              const view = manager.getActiveView();
              if (!view) {
                return;
              }

              view.webContents.toggleDevTools();
            });
          },
        },
      ],
    },
    {
      label: "Tab",
      submenu: [
        {
          label: "New Tab",
          accelerator: "CommandOrControl+T",
          click: () => {
            withFocusedViewManager((manager) => {
              manager.createTab("/");
            });
          },
        },
        {
          label: "Close Tab",
          accelerator: "CommandOrControl+W",
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const activeTabId = tabStore.getActiveTabId(context.windowId);
            if (!activeTabId) {
              return;
            }

            context.viewManager.closeTab(activeTabId);
          },
        },
        {
          label: "Close Other Tabs",
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const activeTabId = tabStore.getActiveTabId(context.windowId);
            if (!activeTabId) {
              return;
            }

            context.viewManager.closeOtherTabs(activeTabId);
          },
        },
        {
          label: "Close All Tabs",
          click: () => {
            withFocusedViewManager((manager) => {
              manager.closeAllTabs();
            });
          },
        },
        {
          label: "Reopen Closed Tab",
          accelerator: "CommandOrControl+Shift+T",
          click: () => {
            withFocusedViewManager((manager) => {
              manager.restoreLastClosedTab();
            });
          },
        },
        { type: "separator" },
        {
          label: "Reload Tab",
          accelerator: "CommandOrControl+R",
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const activeTabId = tabStore.getActiveTabId(context.windowId);
            if (!activeTabId) {
              return;
            }

            context.viewManager.reloadTab(activeTabId);
          },
        },
        {
          label: "Force Reload Tab",
          accelerator: "CommandOrControl+Shift+R",
          click: () => {
            withFocusedViewManager((manager) => {
              const view = manager.getActiveView();
              if (!view) {
                return;
              }

              view.webContents.reloadIgnoringCache();
            });
          },
        },
        {
          label: "Copy Link",
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const activeTabId = tabStore.getActiveTabId(context.windowId);
            if (!activeTabId) {
              return;
            }

            context.viewManager.copyTabLink(activeTabId);
          },
        },
        { type: "separator" },
        {
          label: "Next Tab",
          accelerator: "Control+Tab",
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const nextId = tabStore.getNextTabId(context.windowId);
            if (!nextId) {
              return;
            }

            context.viewManager.switchTab(nextId);
          },
        },
        {
          label: "Previous Tab",
          accelerator: "Control+Shift+Tab",
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const prevId = tabStore.getPreviousTabId(context.windowId);
            if (!prevId) {
              return;
            }

            context.viewManager.switchTab(prevId);
          },
        },
        { type: "separator" },
        ...Array.from({ length: 8 }, (_, i) => ({
          label: `Tab ${i + 1}`,
          accelerator: `CommandOrControl+${i + 1}`,
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const tabId = tabStore.getTabIdByIndex(context.windowId, i);
            if (!tabId) {
              return;
            }

            context.viewManager.switchTab(tabId);
          },
        })),
        {
          label: "Last Tab",
          accelerator: "CommandOrControl+9",
          click: () => {
            const context = getFocusedWindowContext();
            if (!context) {
              return;
            }

            const tabs = tabStore.getTabs(context.windowId);
            const lastIndex = tabs.length - 1;
            if (lastIndex < 0) {
              return;
            }

            const tabId = tabStore.getTabIdByIndex(context.windowId, lastIndex);
            if (!tabId) {
              return;
            }

            context.viewManager.switchTab(tabId);
          },
        },
      ],
    },
    {
      label: "Window",
      submenu: isMac
        ? [{ role: "minimize" }, { role: "zoom" }, { type: "separator" }, { role: "close" }]
        : [{ role: "minimize" }, { role: "close" }],
    },
    // Help menu
    {
      label: "Help",
      submenu: [
        {
          label: "Learn More",
          click: () => {
            void shell.openExternal("https://plane.so");
          },
        },
        {
          label: "Documentation",
          click: () => {
            void shell.openExternal("https://docs.plane.so");
          },
        },
        ...(!isMac
          ? [
              { type: "separator" as const },
              {
                label: "About",
                click: () => {
                  void app.showAboutPanel();
                },
              },
            ]
          : []),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app
  .whenReady()
  .then(() => {
    buildMenu();
    registerDownloadHandler();
    ipcBridge = new IPCBridge(
      instanceStore,
      (sender) => getWindowContextByWebContents(sender)?.viewManager,
      handleInstanceUrlChanged
    );
    const persistedWindowIds = tabStore.getWindowIds();
    if (persistedWindowIds.length > 0) {
      for (const windowId of persistedWindowIds) {
        createMainWindow(windowId);
      }
    } else {
      createMainWindow();
    }

    // Add Ctrl+Shift+L shortcut to clear session
    globalShortcut.register("CommandOrControl+Shift+L", () => {
      const context = getFocusedWindowContext();
      if (!context) {
        return;
      }

      void (async () => {
        const activeView = context.viewManager.getActiveView();
        if (!activeView) {
          return;
        }

        await activeView.webContents.session.clearStorageData();
        activeView.webContents.reload();
      })();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        if (!restoreLastClosedWindow()) {
          createMainWindow();
        }
      }
    });

    // Process any deep link that arrived before the app was ready
    if (pendingDeepLinkUrl) {
      handleDeepLink(pendingDeepLinkUrl);
      pendingDeepLinkUrl = undefined;
    }

    return undefined;
  })
  .catch(console.error);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  if (app.isReady()) {
    globalShortcut.unregisterAll();
  }
  if (ipcBridge) {
    ipcBridge.destroy();
    ipcBridge = undefined;
  }
});

// Handle deep links (plane:// protocol)
app.setAsDefaultProtocolClient("plane");

// On Linux/Windows, a cold-launch deep link arrives as a command-line argument
// (macOS uses the 'open-url' event instead). Check process.argv so the first
// launch from a plane:// URL in the browser is not silently lost.
const argDeepLink = process.argv.find((arg) => arg.startsWith("plane://"));
if (argDeepLink) {
  pendingDeepLinkUrl = argDeepLink;
}

const handleDeepLink = (url: string): void => {
  if (!app.isReady()) {
    pendingDeepLinkUrl = url;
    return;
  }

  const context = getFocusedWindowContext() ?? createMainWindow();

  try {
    const parsed = new URL(url);
    // plane://host/path -> navigate to path on current instance
    const planePath = parsed.host + parsed.pathname + parsed.search + parsed.hash;
    context.viewManager.navigateToPath(planePath);
    context.window.focus();
  } catch {
    // Invalid URL, ignore
  }
};

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Handle deep links on Windows/Linux (second-instance)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const url = commandLine.find((arg) => arg.startsWith("plane://"));
    if (url) {
      handleDeepLink(url);
    }
    const context = getFocusedWindowContext();
    if (!context) {
      return;
    }

    if (context.window.isMinimized()) {
      context.window.restore();
    }

    context.window.focus();
  });
}
