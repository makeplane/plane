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

import { lazy, Suspense, useRef } from "react";
// oxlint-disable-next-line import/default
import planeSDKTypes from "@makeplane/plane-node-sdk/dist/types.bundle.d.ts?raw";
// components
import { useTheme } from "@plane/react-theme";

type Props = {
  value: string;
  allowFunctionBrowser?: boolean;
  isFullScreen?: boolean;
  readOnly?: boolean;
  setShowFunctionBrowser: (show: boolean) => void;
  onChange: (value: string) => void;
};

const CodeEditor = lazy(function PlaneSDKCodeEditor() {
  return import("@plane/propel/code-editor").then((mod) => ({
    default: mod.CodeEditor,
  }));
});

export const LazyEditor = function LazyEditor(props: Props) {
  const {
    value,
    onChange,
    allowFunctionBrowser = false,
    setShowFunctionBrowser,
    isFullScreen = false,
    readOnly = false,
  } = props;
  const editorRef = useRef<{ editor: unknown; monaco: unknown } | null>(null);
  const { resolvedTheme } = useTheme();

  // Custom types including Functions namespace hint and automation event types
  const customTypes = `
    declare global {
      /** Payload containing entity data and previous state */
      interface PlaneEventPayload {
        data: Record<string, unknown>;
        previous_attributes: string | Record<string, unknown>;
      }

      /** Event published by Plane when entities change */
      interface PlaneEvent {
        timestamp: number;
        publisher: string;
        publisher_instance: string;
        version: string;
        source: string;
        outbox_id: number;
        event_id: string;
        event_type: string;
        entity_type: string;
        entity_id: string;
        payload: PlaneEventPayload;
        workspace_id: string;
        project_id: string;
        initiator_id: string;
        initiator_type: string;
      }

      /** Context about the automation execution */
      interface AutomationContext {
        automation_id: string;
        automation_run_id: string;
      }

      /** Input passed to the main function */
      interface AutomationEventInput {
        event: PlaneEvent;
        context: AutomationContext;
      }
      
      interface WorkflowTransitionContext {
        workflow_transition_id: string;
        rule_id: string;
      }

      interface WorkflowTransitionEventInput {
        event: PlaneEvent;
        context: WorkflowTransitionContext;
      }

      const Plane: PlaneClient;
      const workspaceSlug: string;
      /** Environment variables configured for the script */
      const ENV: Record<string, string>;
      /** Script variables configured in the UI */
      const Variables: Record<string, string>;
      /**
       * Functions library - reusable helper functions.
       * Press Cmd/Ctrl+Shift+F to browse available functions.
       */
      const Functions: {
        [key: string]: (params: Record<string, unknown>) => Promise<unknown>;
      };
    }
  `;

  return (
    <div className="relative">
      <Suspense fallback={<></>}>
        <CodeEditor
          value={value}
          readOnly={readOnly}
          onChange={(v) => onChange(v ?? "")}
          language="typescript"
          path="script.ts"
          height={isFullScreen ? "90vh" : 350}
          theme={resolvedTheme === "dark" ? "plane-dark" : "plane-light"}
          externalLibraries={[
            {
              name: "@makeplane/plane-node-sdk",
              content: planeSDKTypes,
            },
          ]}
          customTypes={customTypes}
          onMount={(editor, monacoInstance) => {
            editorRef.current = { editor, monaco: monacoInstance };

            // Register keyboard shortcut for function browser
            if (allowFunctionBrowser && monacoInstance) {
              const monaco = monacoInstance;
              editor.addAction({
                id: "open-function-browser",
                label: "Insert Function",
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF],
                run: () => {
                  setShowFunctionBrowser(true);
                },
              });
            }
          }}
        />
      </Suspense>
    </div>
  );
};
