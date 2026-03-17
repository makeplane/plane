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

import { useEffect, useState } from "react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/ui";

interface CursorSettingsFormProps {
  initialRepository: string;
  initialRef: string;
  hasApiKey: boolean;
  onSave: (payload: { apiKey?: string; repository: string; ref?: string }) => Promise<void>;
}

export const CursorSettingsForm = ({ initialRepository, initialRef, hasApiKey, onSave }: CursorSettingsFormProps) => {
  const [apiKey, setApiKey] = useState("");
  const [repository, setRepository] = useState(initialRepository);
  const [ref, setRef] = useState(initialRef);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRepository(initialRepository);
  }, [initialRepository]);

  useEffect(() => {
    setRef(initialRef);
  }, [initialRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        apiKey: apiKey || undefined,
        repository,
        ref: ref || undefined,
      });
      setApiKey("");
    } catch {
      // error toast is handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = !repository.trim() || isSaving;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 max-w-lg">
      <div className="flex flex-col gap-1">
        <label htmlFor="cursor-api-key" className="text-body-xs-medium text-secondary">
          API Key
        </label>
        <Input
          id="cursor-api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasApiKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : "Enter your Cursor API key"}
          className="w-full"
          autoComplete="off"
        />
        {hasApiKey && !apiKey && (
          <p className="text-body-xs-regular text-secondary">API key is saved. Leave blank to keep the current key.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cursor-repository" className="text-body-xs-medium text-secondary">
          Default repository
        </label>
        <Input
          id="cursor-repository"
          type="text"
          value={repository}
          onChange={(e) => setRepository(e.target.value)}
          placeholder="owner/repo"
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cursor-ref" className="text-body-xs-medium text-secondary">
          Branch
        </label>
        <Input
          id="cursor-ref"
          type="text"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="main"
          className="w-full"
        />
      </div>

      <div className="pt-1">
        <Button type="submit" loading={isSaving} disabled={isDisabled}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
};
