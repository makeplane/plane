/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Tabs } from "@plane/propel/tabs";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IHelpArticle, THelpLocale } from "@plane/types";
import { useInstanceHelpCenter } from "@/hooks/store";
import { HELP_LOCALES } from "./constants";
import { TranslationLocaleEditor } from "./translation-locale-editor";

type Draft = { title: string; descriptionHtml: string; descriptionJson: object; editorKey: number };

const emptyDraft = (): Draft => ({ title: "", descriptionHtml: "<p></p>", descriptionJson: {}, editorKey: 0 });

const buildDrafts = (article: IHelpArticle): Record<THelpLocale, Draft> => {
  const drafts: Record<THelpLocale, Draft> = { vi: emptyDraft(), en: emptyDraft(), ko: emptyDraft() };
  article.translations.forEach((t) => {
    drafts[t.locale] = {
      title: t.title ?? "",
      descriptionHtml: t.description_html || "<p></p>",
      descriptionJson: t.description_json ?? {},
      editorKey: 0,
    };
  });
  return drafts;
};

type Props = {
  article: IHelpArticle;
  onDirtyChange?: (isDirty: boolean) => void;
};

export const TranslationTabs = observer(function TranslationTabs({ article, onDirtyChange }: Props) {
  const { upsertTranslation, uploadArticleImage } = useInstanceHelpCenter();
  const [drafts, setDrafts] = useState<Record<THelpLocale, Draft>>(() => buildDrafts(article));
  const [savingLocale, setSavingLocale] = useState<THelpLocale | null>(null);

  // Reset drafts only when switching to a different article (not on every store update),
  // so in-progress edits are never clobbered by a background refresh.
  useEffect(() => {
    setDrafts(buildDrafts(article));
  }, [article.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A draft is dirty when its title/body differs from the saved translation. The
  // editor never emits onChange on mount/content-sync (only real user edits), so
  // this stays false until the author actually types. Compared against the live
  // saved values so it clears the moment a locale is saved.
  const savedByLocale = Object.fromEntries(article.translations.map((t) => [t.locale, t]));
  const isDirty = HELP_LOCALES.some((l) => {
    const draft = drafts[l.value];
    const saved = savedByLocale[l.value];
    return draft.title !== (saved?.title ?? "") || draft.descriptionHtml !== (saved?.description_html || "<p></p>");
  });

  // Report dirty state up to the editor panel (drives the leave/back guard) and
  // always clear it on unmount so a closed/deleted article never blocks navigation.
  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const patchDraft = (locale: THelpLocale, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));

  const handleCopyFrom = (target: THelpLocale, source: THelpLocale) => {
    setDrafts((prev) => ({
      ...prev,
      [target]: {
        title: prev[source].title,
        descriptionHtml: prev[source].descriptionHtml,
        descriptionJson: prev[source].descriptionJson,
        editorKey: prev[target].editorKey + 1,
      },
    }));
  };

  const handleSave = async (locale: THelpLocale) => {
    const draft = drafts[locale];
    if (!draft.title.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Title is required for this language" });
      return;
    }
    setSavingLocale(locale);
    try {
      await upsertTranslation(article.id, locale, {
        title: draft.title.trim(),
        description_html: draft.descriptionHtml,
        description_json: draft.descriptionJson,
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: `Saved ${locale.toUpperCase()}` });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to save translation" });
    } finally {
      setSavingLocale(null);
    }
  };

  const filledLocales = (current: THelpLocale) =>
    HELP_LOCALES.filter((l) => l.value !== current && drafts[l.value].title.trim()).map((l) => ({
      locale: l.value,
      label: l.label,
    }));

  return (
    <Tabs defaultValue="vi">
      <Tabs.List>
        {HELP_LOCALES.map((l) => (
          <Tabs.Trigger key={l.value} value={l.value}>
            {l.label}
            {!drafts[l.value].title.trim() && <span className="ml-1 text-11 text-tertiary">(empty)</span>}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {HELP_LOCALES.map((l) => (
        <Tabs.Content key={l.value} value={l.value} className="pt-4">
          <TranslationLocaleEditor
            articleId={article.id}
            locale={l.value}
            editorKey={drafts[l.value].editorKey}
            title={drafts[l.value].title}
            descriptionHtml={drafts[l.value].descriptionHtml}
            isSaving={savingLocale === l.value}
            copyOptions={filledLocales(l.value)}
            uploadFile={(_blockId, file) => uploadArticleImage(article.id, file)}
            onTitleChange={(title) => patchDraft(l.value, { title })}
            onContentChange={(descriptionHtml, descriptionJson) =>
              patchDraft(l.value, { descriptionHtml, descriptionJson })
            }
            onCopyFrom={(source) => handleCopyFrom(l.value, source as THelpLocale)}
            onSave={() => void handleSave(l.value)}
          />
        </Tabs.Content>
      ))}
    </Tabs>
  );
});
