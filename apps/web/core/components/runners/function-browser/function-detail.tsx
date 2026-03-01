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

import { Check, CornerDownRight, Copy } from "lucide-react";
import type { ScriptFunction } from "@plane/types";
import { cn } from "@plane/ui";
import { useState } from "react";

type Props = {
  fn: ScriptFunction;
};

export function FunctionDetail({ fn }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!fn) return null;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(fn.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-h6-medium text-secondary">{fn.name}</h3>
          <span
            className={cn(
              "px-1.5 h-5 flex items-center justify-center text-caption-sm-medium rounded-md capitalize flex-shrink-0 bg-accent-primary/10 text-accent-primary"
            )}
          >
            {fn.category}
          </span>
        </div>
        <p className="text-caption-md-regular text-secondary">{fn.description}</p>
      </div>

      {/* Parameters */}
      {fn.parameters.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-body-xs-medium text-placeholder">Parameters</h4>
          <div className="space-y-1.5 px-6">
            {fn.parameters.map((param, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <code className="text-[12px] font-medium text-primary">{param.name}</code>
                  <span className="text-caption-md-regular text-secondary">{param.type}</span>
                  {param.required ? (
                    <span className="text-caption-sm-medium bg-danger-subtle rounded-sm text-danger-primary h-4 px-1 flex items-center justify-center">
                      Required
                    </span>
                  ) : (
                    <span className="text-caption-sm-medium bg-layer-3 rounded-sm text-tertiary">Optional</span>
                  )}
                </div>
                {param.description && <p className="text-caption-md-regular text-secondary">{param.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Type */}
      <div className="space-y-2">
        <h4 className="text-body-xs-medium text-placeholder">Returns</h4>
        <div className="flex items-center gap-1.5 px-6">
          <CornerDownRight className="size-3 text-tertiary flex-shrink-0" />
          <code className="text-caption-md-regular text-secondary break-all">{fn.return_type}</code>
        </div>
      </div>

      {/* Code */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-body-xs-medium text-placeholder">Function Code</h4>
          <button
            onClick={() => void handleCopyCode()}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-secondary hover:text-primary hover:bg-layer-2 rounded transition-colors"
          >
            {copiedCode ? <Check className="size-3" /> : <Copy className="size-3 text-secondary" />}
            <span className="text-caption-md-regular text-secondary">{copiedCode ? "Copied!" : "Copy"}</span>
          </button>
        </div>
        <div className="relative">
          <pre className="p-2 rounded-lg bg-layer-3 border border-subtle overflow-x-auto">
            <code className="text-caption-md-regular text-secondary ">{fn.code}</code>
          </pre>
        </div>
      </div>

      {/* Usage Example */}
      {fn.usage_example && (
        <div className="space-y-2">
          <h4 className="text-body-xs-medium text-placeholder">Example</h4>
          <div className="px-6 text-caption-md-medium text-primary font-code">{fn.usage_example}</div>
        </div>
      )}
    </div>
  );
}
