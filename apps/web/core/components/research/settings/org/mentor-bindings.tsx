/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TMentorBinding, TOrgUnit } from "@plane/types";
import { Input } from "@plane/ui";
// components
import { getResearchErrorKey } from "@/components/research/common/error-messages";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  unit: TOrgUnit;
};

/**
 * Direct advisor bindings: one research owner may have several advisors
 * (P0-ORG-06).
 */
export const ResearchMentorBindings = observer(function ResearchMentorBindings({ workspaceSlug, unit }: Props) {
  const { t } = useTranslation();
  const research = useResearch();
  const [bindings, setBindings] = useState<TMentorBinding[]>([]);
  const [menteeEmail, setMenteeEmail] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const results = await research.fetchMentorBindings(workspaceSlug, { org_unit: unit.id });
      setBindings(results);
      setErrorKey(null);
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [research, unit.id, workspaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(async () => {
    if (!menteeEmail.trim() || !mentorEmail.trim()) return;
    try {
      await research.createMentorBinding(workspaceSlug, {
        mentee: menteeEmail.trim(),
        mentor: mentorEmail.trim(),
        org_unit: unit.id,
      });
      setMenteeEmail("");
      setMentorEmail("");
      await load();
    } catch (error) {
      setErrorKey(getResearchErrorKey(error));
    }
  }, [load, menteeEmail, mentorEmail, research, unit.id, workspaceSlug]);

  const handleDelete = useCallback(
    async (bindingId: string) => {
      try {
        await research.deleteMentorBinding(workspaceSlug, bindingId);
        await load();
      } catch (error) {
        setErrorKey(getResearchErrorKey(error));
      }
    },
    [load, research, workspaceSlug]
  );

  return (
    <div className="flex flex-col gap-3">
      {errorKey && (
        <div className="rounded-md border border-danger-strong/40 bg-danger-subtle px-3 py-2 text-12 text-danger-primary">
          {t(errorKey)}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <Input
          className="!w-56"
          placeholder={t("research.org.mentee_email_placeholder")}
          value={menteeEmail}
          onChange={(event) => setMenteeEmail(event.target.value)}
        />
        <Input
          className="!w-56"
          placeholder={t("research.org.mentor_email_placeholder")}
          value={mentorEmail}
          onChange={(event) => setMentorEmail(event.target.value)}
        />
        <Button variant="primary" size="sm" onClick={() => void handleCreate()}>
          {t("research.org.bind_mentor")}
        </Button>
      </div>

      <table className="w-full text-12">
        <thead>
          <tr className="border-b border-subtle text-left text-tertiary">
            <th className="font-normal py-2">{t("research.org.columns.mentee")}</th>
            <th className="font-normal py-2">{t("research.org.columns.mentor")}</th>
            <th className="font-normal py-2">{t("research.org.columns.effective_from")}</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {bindings.map((binding) => (
            <tr key={binding.id} className="border-b border-subtle/60">
              <td className="py-2 text-secondary">
                {binding.mentee_detail?.display_name ?? binding.mentee_detail?.email ?? binding.mentee}
              </td>
              <td className="py-2 text-secondary">
                {binding.mentor_detail?.display_name ?? binding.mentor_detail?.email ?? binding.mentor}
              </td>
              <td className="py-2 text-tertiary">{binding.effective_from}</td>
              <td className="py-2 text-right">
                <Button variant="ghost" size="sm" onClick={() => void handleDelete(binding.id)}>
                  {t("research.common.remove")}
                </Button>
              </td>
            </tr>
          ))}
          {bindings.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-center text-tertiary">
                {t("research.org.no_mentor_bindings")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
});
