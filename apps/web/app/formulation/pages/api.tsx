/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
import { useOutletContext, useSearchParams } from "react-router";
import { ApiExplorer } from "@/app/testhub/components/api-docs/api-explorer";
import { TesthubSplitBody } from "@/app/testhub/components/page-shell";
import { FormulationRegisteredAssets } from "../components/registered-assets";
import type { TFormulationOutletContext } from "../layout";

function ApiPage() {
  const ctx = useOutletContext<TFormulationOutletContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedFile = searchParams.get("api") ?? "";
  const apiObjects = ctx.testhub?.snapshot?.payload?.components?.api_objects ?? [];

  const setApi = useCallback(
    (file: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("api", file);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  return (
    <FormulationRegisteredAssets {...ctx}>
      <TesthubSplitBody>
        <ApiExplorer apis={apiObjects} selectedFile={selectedFile} onSelect={setApi} />
      </TesthubSplitBody>
    </FormulationRegisteredAssets>
  );
}

export default observer(ApiPage);
