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

import React, { useCallback, useMemo, useRef, useSyncExternalStore, useState } from "react";
import { createRoot } from "react-dom/client";

type TabBarTab = {
  id: string;
  path: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
};

type TabBarState = {
  tabs: TabBarTab[];
  activeTabId: string | undefined;
  canGoBack: boolean;
  canGoForward: boolean;
  platform: NodeJS.Platform;
};

type TabBarAPI = {
  onStateUpdated: (callback: (state: TabBarState) => void) => () => void;
  createTab: () => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  goBack: () => void;
  goForward: () => void;
};

const initialState: TabBarState = {
  tabs: [],
  activeTabId: undefined,
  canGoBack: false,
  canGoForward: false,
  platform: "darwin",
};

const SPINNER_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <path d="M14 8a6 6 0 1 1-4.146-5.707" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CLOSE_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <path d="M12 4L4 12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 4l8 8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLUS_SVG = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor">
    <path d="M3 8h10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 3v10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PLANE_LOGO_SVG = (
  <svg viewBox="0 0 580 362" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M0.582031 21.3454C0.582031 6.03817 16.6812 -3.9163 30.3772 2.92484L148.547 62.0099V200.676C148.547 220.162 159.567 237.995 176.991 246.707L283.636 300.03V340.708C283.636 356.015 267.537 365.97 253.841 359.115L29.0253 246.707C11.6016 237.995 0.582031 220.175 0.582031 200.676V21.3454ZM148.547 21.3454C148.547 6.03817 164.647 -3.9163 178.342 2.93849L296.513 62.0236V200.69C296.513 220.175 307.532 238.009 324.956 246.721L431.601 300.043V340.722C431.601 356.029 415.502 365.983 401.806 359.129L283.636 300.043V161.377C283.636 141.878 272.616 124.058 255.193 115.346L148.547 62.0236V21.3454ZM296.499 21.3454C296.499 6.03817 312.598 -3.9163 326.294 2.93849L551.11 115.346C568.547 124.058 579.553 141.878 579.553 161.377V340.722C579.553 356.029 563.454 365.983 549.758 359.129L431.588 300.043V161.377C431.588 141.878 420.568 124.058 403.144 115.346L296.499 62.0236V21.3454Z"
      fill="currentColor"
    />
  </svg>
);

const getTabBarAPI = (): TabBarAPI | undefined => (window as typeof window & { tabBarAPI?: TabBarAPI }).tabBarAPI;

const shouldShowDivider = (tabs: TabBarTab[], index: number, activeTabId: string | undefined): boolean => {
  const currentTab = tabs[index];
  if (!currentTab) return false;

  if (index === 0) {
    return currentTab.id !== activeTabId;
  }

  const previousTab = tabs[index - 1];
  if (!previousTab) return false;

  return currentTab.id !== activeTabId && previousTab.id !== activeTabId;
};

type TabBarAppProps = {
  subscribe: TabBarAPI["onStateUpdated"];
  createTab: TabBarAPI["createTab"];
  closeTab: TabBarAPI["closeTab"];
  switchTab: TabBarAPI["switchTab"];
  goBack: TabBarAPI["goBack"];
  goForward: TabBarAPI["goForward"];
};

export const TabBarApp = ({ subscribe, createTab, closeTab, switchTab, goBack, goForward }: TabBarAppProps) => {
  const stateRef = useRef<TabBarState>(initialState);
  const [brokenFavicons, setBrokenFavicons] = useState<Record<string, string>>({});

  const state = useSyncExternalStore(
    (onStoreChange) => {
      return subscribe((nextState) => {
        stateRef.current = { ...stateRef.current, ...nextState };
        onStoreChange();
      });
    },
    () => stateRef.current,
    () => stateRef.current
  );

  const canClose = state.tabs.length > 1;

  const handleFaviconError = useCallback((tabId: string, favicon: string | undefined) => {
    if (!favicon) {
      return;
    }
    setBrokenFavicons((prev) => {
      if (prev[tabId] === favicon) {
        return prev;
      }
      return { ...prev, [tabId]: favicon };
    });
  }, []);

  const tabsMarkup = useMemo(() => {
    return state.tabs.map((tab, index) => {
      const showDivider = shouldShowDivider(state.tabs, index, state.activeTabId);
      const isActive = tab.id === state.activeTabId;
      const showFavicon = tab.favicon && brokenFavicons[tab.id] !== tab.favicon;

      return (
        <React.Fragment key={tab.id}>
          <div className={showDivider ? "tab-divider" : "tab-divider tab-divider-hidden"} />
          <div
            className={`tab${isActive ? " active" : ""}`}
            role="tab"
            tabIndex={0}
            aria-selected={isActive}
            data-tab-id={tab.id}
            onClick={() => switchTab(tab.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                switchTab(tab.id);
              }
            }}
          >
            {tab.isLoading ? (
              <div className="tab-spinner">{SPINNER_SVG}</div>
            ) : showFavicon ? (
              <div className="tab-icon">
                <img src={tab.favicon} alt="" onError={() => handleFaviconError(tab.id, tab.favicon)} />
              </div>
            ) : (
              <div className="tab-icon">{PLANE_LOGO_SVG}</div>
            )}

            <span className="tab-title">{tab.title || "New Tab"}</span>

            {canClose ? (
              <button
                className="tab-close"
                aria-label="Close tab"
                onClick={(event) => {
                  event.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                {CLOSE_SVG}
              </button>
            ) : null}
          </div>
        </React.Fragment>
      );
    });
  }, [brokenFavicons, canClose, state.activeTabId, state.tabs, handleFaviconError, switchTab, closeTab]);

  return (
    <div className="tab-bar" id="tab-bar">
      <div
        className="traffic-light-spacer"
        id="traffic-light-spacer"
        style={{ display: state.platform === "darwin" ? "block" : "none" }}
      />

      <div className="nav-buttons">
        <button
          className="nav-button"
          id="back-button"
          disabled={!state.canGoBack}
          aria-label="Go back"
          onClick={() => goBack()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.55757 3.55806C6.80165 3.31398 7.19826 3.31398 7.44234 3.55806C7.68641 3.80214 7.68641 4.19875 7.44234 4.44282L4.50972 7.37544H13.6669C14.012 7.37562 14.2919 7.65537 14.2919 8.00044C14.2919 8.34551 14.012 8.62527 13.6669 8.62544H4.50972L7.44234 11.5581C7.68641 11.8021 7.68641 12.1987 7.44234 12.4428C7.19826 12.6869 6.80165 12.6869 6.55757 12.4428L2.55757 8.44282C2.31349 8.19875 2.31349 7.80214 2.55757 7.55806L6.55757 3.55806Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          className="nav-button"
          id="forward-button"
          disabled={!state.canGoForward}
          aria-label="Go forward"
          onClick={() => goForward()}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.89111 3.55684C9.1351 3.31303 9.53085 3.31314 9.7749 3.55684L13.7749 7.55684C14.019 7.80092 14.019 8.19753 13.7749 8.4416L9.7749 12.4416C9.53085 12.6853 9.1351 12.6854 8.89111 12.4416C8.64704 12.1975 8.64704 11.8009 8.89111 11.5568L11.8237 8.62422H2.6665C2.32133 8.62422 2.0415 8.3444 2.0415 7.99922C2.0415 7.65404 2.32133 7.37422 2.6665 7.37422H11.8237L8.89111 4.4416C8.64704 4.19753 8.64704 3.80092 8.89111 3.55684Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      <div className="tabs-wrapper">
        <div className="tabs-scroll-container" id="tabs-scroll-container">
          <div className="tabs-container" id="tabs-container" role="tablist">
            {tabsMarkup}
          </div>
          <div className="new-tab-container" id="new-tab-container">
            <button className="icon-button" aria-label="New tab" onClick={() => createTab()}>
              {PLUS_SVG}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const rootEl = document.getElementById("root");
const api = getTabBarAPI();
if (!rootEl || !api) {
  throw new Error("Tab bar root or API unavailable.");
}

createRoot(rootEl).render(
  <TabBarApp
    subscribe={api.onStateUpdated}
    createTab={api.createTab}
    closeTab={api.closeTab}
    switchTab={api.switchTab}
    goBack={api.goBack}
    goForward={api.goForward}
  />
);
