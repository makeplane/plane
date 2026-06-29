/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type {
  TMailAccountCreatePayload,
  TMailAccountLoginPayload,
  TMailComposePayload,
  TMailFilterRule,
  TMailFolder,
  TMailForwarding,
  TMailLabel,
  TMailMeConfig,
  TMailMessageDetail,
  TMailMessageSummary,
  TMailPreference,
  TMailSavedSearch,
  TMailSignature,
  TMailTemplate,
  TMailUploadedAttachment,
} from "@plane/types";
import { MailService } from "@/services/mail.service";

export interface IMailStore {
  loader: boolean;
  messageLoader: boolean;
  actionLoader: boolean;
  loadingMore: boolean;
  me: TMailMeConfig | null;
  folders: TMailFolder[];
  messagesByFolder: Record<string, TMailMessageSummary[]>;
  messagesMeta: Record<string, { page: number; perPage: number; total: number }>;
  selectedMessage: TMailMessageDetail | null;
  searchResults: TMailMessageSummary[];
  composeOpen: boolean;
  composeDraft: TMailComposePayload;
  signatures: TMailSignature[];
  templates: TMailTemplate[];
  filters: TMailFilterRule[];
  labels: TMailLabel[];
  savedSearches: TMailSavedSearch[];
  forwarding: TMailForwarding | null;
  preferences: TMailPreference | null;
  accountError: string | null;
  hasMailbox: boolean;
  mailboxEmail: string;
  mailDomain: string;
  webmailUrl: string;
  getFolderByKey: (folderKey: string) => TMailFolder | undefined;
  hasMoreMessages: (folderKey: string) => boolean;
  loadMoreMessages: (folderKey: string) => Promise<void>;
  fetchMe: () => Promise<TMailMeConfig>;
  createAccount: (payload: TMailAccountCreatePayload) => Promise<TMailMeConfig>;
  loginAccount: (payload: TMailAccountLoginPayload) => Promise<TMailMeConfig>;
  fetchFolders: () => Promise<TMailFolder[]>;
  fetchMessages: (folderKey: string, params?: Record<string, unknown>) => Promise<TMailMessageSummary[]>;
  fetchMessage: (folderKey: string, uid: string) => Promise<TMailMessageDetail>;
  clearSelectedMessage: () => void;
  setFlags: (folderKey: string, uid: string, data: { read?: boolean; starred?: boolean }) => Promise<void>;
  moveMessages: (srcFolder: string, dstFolder: string, uids: string[]) => Promise<void>;
  deleteMessages: (srcFolder: string, uids: string[], permanent?: boolean) => Promise<void>;
  search: (params: Record<string, unknown>) => Promise<TMailMessageSummary[]>;
  openCompose: (draft?: Partial<TMailComposePayload>) => void;
  closeCompose: () => void;
  updateComposeDraft: (draft: Partial<TMailComposePayload>) => void;
  sendCompose: () => Promise<void>;
  saveDraft: () => Promise<void>;
  uploadAttachment: (file: File) => Promise<TMailUploadedAttachment>;
  fetchSettings: () => Promise<void>;
  patchPreferences: (data: Partial<TMailPreference>) => Promise<TMailPreference>;
  createSignature: (data: Partial<TMailSignature>) => Promise<TMailSignature>;
  updateSignature: (id: string, data: Partial<TMailSignature>) => Promise<TMailSignature>;
  deleteSignature: (id: string) => Promise<void>;
  createTemplate: (data: Partial<TMailTemplate>) => Promise<TMailTemplate>;
  updateTemplate: (id: string, data: Partial<TMailTemplate>) => Promise<TMailTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  createFilter: (data: Partial<TMailFilterRule>) => Promise<TMailFilterRule>;
  updateFilter: (id: string, data: Partial<TMailFilterRule>) => Promise<TMailFilterRule>;
  deleteFilter: (id: string) => Promise<void>;
  createLabel: (data: Partial<TMailLabel>) => Promise<TMailLabel>;
  updateLabel: (id: string, data: Partial<TMailLabel>) => Promise<TMailLabel>;
  deleteLabel: (id: string) => Promise<void>;
  updateForwarding: (data: Partial<TMailForwarding>) => Promise<TMailForwarding>;
}

const EMPTY_COMPOSE: TMailComposePayload = {
  to: [],
  cc: [],
  bcc: [],
  subject: "",
  body_html: "",
  body_text: "",
  uploaded_attachments: [],
};

const getMailErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (!error || typeof error !== "object") return "Unable to update mailbox.";

  const payload = error as Record<string, unknown>;
  const firstFieldError = Object.values(payload).find((value) => Array.isArray(value) && value.length > 0);

  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.detail === "string") return payload.detail;
  if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === "string") return firstFieldError[0];

  return "Unable to update mailbox.";
};

export class MailStore implements IMailStore {
  loader = false;
  messageLoader = false;
  actionLoader = false;
  loadingMore = false;
  me: TMailMeConfig | null = null;
  folders: TMailFolder[] = [];
  messagesByFolder: Record<string, TMailMessageSummary[]> = {};
  messagesMeta: Record<string, { page: number; perPage: number; total: number }> = {};
  selectedMessage: TMailMessageDetail | null = null;
  searchResults: TMailMessageSummary[] = [];
  composeOpen = false;
  composeDraft: TMailComposePayload = { ...EMPTY_COMPOSE };
  signatures: TMailSignature[] = [];
  templates: TMailTemplate[] = [];
  filters: TMailFilterRule[] = [];
  labels: TMailLabel[] = [];
  savedSearches: TMailSavedSearch[] = [];
  forwarding: TMailForwarding | null = null;
  preferences: TMailPreference | null = null;
  accountError: string | null = null;
  service: MailService;

  constructor() {
    makeObservable(this, {
      loader: observable,
      messageLoader: observable,
      actionLoader: observable,
      loadingMore: observable,
      me: observable,
      folders: observable,
      messagesByFolder: observable,
      messagesMeta: observable,
      selectedMessage: observable,
      searchResults: observable,
      composeOpen: observable,
      composeDraft: observable,
      signatures: observable,
      templates: observable,
      filters: observable,
      labels: observable,
      savedSearches: observable,
      forwarding: observable,
      preferences: observable,
      accountError: observable,
      hasMailbox: computed,
      mailboxEmail: computed,
      mailDomain: computed,
      webmailUrl: computed,
      fetchMe: action,
      createAccount: action,
      loginAccount: action,
      fetchFolders: action,
      fetchMessages: action,
      loadMoreMessages: action,
      fetchMessage: action,
      clearSelectedMessage: action,
      setFlags: action,
      moveMessages: action,
      deleteMessages: action,
      search: action,
      openCompose: action,
      closeCompose: action,
      updateComposeDraft: action,
      sendCompose: action,
      saveDraft: action,
      fetchSettings: action,
      patchPreferences: action,
      createSignature: action,
      updateSignature: action,
      deleteSignature: action,
      createTemplate: action,
      updateTemplate: action,
      deleteTemplate: action,
      createFilter: action,
      updateFilter: action,
      deleteFilter: action,
      createLabel: action,
      updateLabel: action,
      deleteLabel: action,
      updateForwarding: action,
    });
    this.service = new MailService();
  }

  get hasMailbox() {
    return Boolean(this.me?.has_mailbox);
  }

  get mailboxEmail() {
    return this.me?.mailbox?.email ?? "";
  }

  get mailDomain() {
    return this.me?.mail_domain ?? this.me?.mailbox?.domain ?? "mail.local";
  }

  get webmailUrl() {
    return this.me?.webmail_url ?? "";
  }

  getFolderByKey = computedFn((folderKey: string) => this.folders.find((folder) => folder.key === folderKey));

  hasMoreMessages = computedFn((folderKey: string) => {
    const meta = this.messagesMeta[folderKey];
    const loaded = this.messagesByFolder[folderKey]?.length ?? 0;
    return !!meta && loaded < meta.total;
  });

  fetchMe = async () => {
    this.loader = true;
    try {
      const response = await this.service.me();
      runInAction(() => {
        this.me = response;
        this.loader = false;
        this.accountError = null;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.accountError = getMailErrorMessage(error);
      });
      throw error;
    }
  };

  createAccount = async (payload: TMailAccountCreatePayload) => {
    this.actionLoader = true;
    this.accountError = null;
    try {
      const response = await this.service.createAccount(payload);
      runInAction(() => {
        this.me = response;
        this.actionLoader = false;
      });
      return response;
    } catch (error) {
      const message = getMailErrorMessage(error);
      runInAction(() => {
        this.accountError = message;
        this.actionLoader = false;
      });
      throw error;
    }
  };

  loginAccount = async (payload: TMailAccountLoginPayload) => {
    this.actionLoader = true;
    this.accountError = null;
    try {
      const response = await this.service.loginAccount(payload);
      runInAction(() => {
        this.me = response;
        this.actionLoader = false;
      });
      return response;
    } catch (error) {
      const message = getMailErrorMessage(error);
      runInAction(() => {
        this.accountError = message;
        this.actionLoader = false;
      });
      throw error;
    }
  };

  fetchFolders = async () => {
    const response = await this.service.folders();
    runInAction(() => {
      this.folders = response;
    });
    return response;
  };

  fetchMessages = async (folderKey: string, params: Record<string, unknown> = {}) => {
    this.loader = true;
    try {
      const response = await this.service.messages(folderKey, params);
      runInAction(() => {
        this.messagesByFolder[folderKey] = response.results;
        this.messagesMeta[folderKey] = {
          page: response.page,
          perPage: response.per_page,
          total: response.total,
        };
        this.loader = false;
      });
      return response.results;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  loadMoreMessages = async (folderKey: string) => {
    const meta = this.messagesMeta[folderKey];
    if (!meta || this.loadingMore) return;
    this.loadingMore = true;
    try {
      const response = await this.service.messages(folderKey, {
        page: meta.page + 1,
        per_page: meta.perPage,
      });
      runInAction(() => {
        const existing = this.messagesByFolder[folderKey] ?? [];
        const seen = new Set(existing.map((message) => message.uid));
        this.messagesByFolder[folderKey] = [
          ...existing,
          ...response.results.filter((message) => !seen.has(message.uid)),
        ];
        this.messagesMeta[folderKey] = {
          page: response.page,
          perPage: response.per_page,
          total: response.total,
        };
        this.loadingMore = false;
      });
    } catch {
      runInAction(() => {
        this.loadingMore = false;
      });
    }
  };

  fetchMessage = async (folderKey: string, uid: string) => {
    this.messageLoader = true;
    try {
      const response = await this.service.message(folderKey, uid);
      runInAction(() => {
        this.selectedMessage = response;
        this.messageLoader = false;
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.messageLoader = false;
      });
      throw error;
    }
  };

  clearSelectedMessage = () => {
    this.selectedMessage = null;
  };

  setFlags = async (folderKey: string, uid: string, data: { read?: boolean; starred?: boolean }) => {
    const current = this.messagesByFolder[folderKey]?.find((message) => message.uid === uid);
    const previousCurrent = current ? { is_read: current.is_read, is_starred: current.is_starred } : null;
    const previousSelected =
      this.selectedMessage?.uid === uid
        ? { is_read: this.selectedMessage.is_read, is_starred: this.selectedMessage.is_starred }
        : null;
    runInAction(() => {
      if (current) {
        if (data.read !== undefined) current.is_read = data.read;
        if (data.starred !== undefined) current.is_starred = data.starred;
      }
      if (this.selectedMessage?.uid === uid) {
        if (data.read !== undefined) this.selectedMessage.is_read = data.read;
        if (data.starred !== undefined) this.selectedMessage.is_starred = data.starred;
      }
    });
    try {
      await this.service.setFlags(folderKey, uid, data);
      await this.fetchFolders().catch(() => undefined);
    } catch (error) {
      runInAction(() => {
        if (current && previousCurrent) {
          current.is_read = previousCurrent.is_read;
          current.is_starred = previousCurrent.is_starred;
        }
        if (this.selectedMessage?.uid === uid && previousSelected) {
          this.selectedMessage.is_read = previousSelected.is_read;
          this.selectedMessage.is_starred = previousSelected.is_starred;
        }
      });
      throw error;
    }
  };

  moveMessages = async (srcFolder: string, dstFolder: string, uids: string[]) => {
    this.actionLoader = true;
    try {
      await this.service.move(srcFolder, dstFolder, uids);
      runInAction(() => {
        this.messagesByFolder[srcFolder] = (this.messagesByFolder[srcFolder] ?? []).filter(
          (message) => !uids.includes(message.uid)
        );
        if (this.selectedMessage && uids.includes(this.selectedMessage.uid)) this.selectedMessage = null;
        this.actionLoader = false;
      });
      await this.fetchFolders().catch(() => undefined);
    } catch (error) {
      runInAction(() => {
        this.actionLoader = false;
      });
      throw error;
    }
  };

  deleteMessages = async (srcFolder: string, uids: string[], permanent = false) => {
    this.actionLoader = true;
    try {
      await this.service.deleteMessages(srcFolder, uids, permanent);
      runInAction(() => {
        this.messagesByFolder[srcFolder] = (this.messagesByFolder[srcFolder] ?? []).filter(
          (message) => !uids.includes(message.uid)
        );
        if (this.selectedMessage && uids.includes(this.selectedMessage.uid)) this.selectedMessage = null;
        this.actionLoader = false;
      });
      await this.fetchFolders().catch(() => undefined);
    } catch (error) {
      runInAction(() => {
        this.actionLoader = false;
      });
      throw error;
    }
  };

  search = async (params: Record<string, unknown>) => {
    this.loader = true;
    try {
      const response = await this.service.search(params);
      runInAction(() => {
        this.searchResults = response.results;
        this.loader = false;
      });
      return response.results;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  openCompose = (draft: Partial<TMailComposePayload> = {}) => {
    this.composeDraft = { ...EMPTY_COMPOSE, ...draft };
    this.composeOpen = true;
  };

  closeCompose = () => {
    this.composeOpen = false;
  };

  updateComposeDraft = (draft: Partial<TMailComposePayload>) => {
    this.composeDraft = { ...this.composeDraft, ...draft };
  };

  sendCompose = async () => {
    this.actionLoader = true;
    try {
      await this.service.send(this.composeDraft);
      runInAction(() => {
        this.composeOpen = false;
        this.composeDraft = { ...EMPTY_COMPOSE };
        this.actionLoader = false;
      });
      await this.fetchFolders().catch(() => undefined);
    } catch (error) {
      runInAction(() => {
        this.actionLoader = false;
      });
      throw error;
    }
  };

  saveDraft = async () => {
    this.actionLoader = true;
    try {
      await this.service.saveDraft(this.composeDraft);
      runInAction(() => {
        this.composeOpen = false;
        this.actionLoader = false;
      });
      await this.fetchFolders().catch(() => undefined);
    } catch (error) {
      runInAction(() => {
        this.actionLoader = false;
      });
      throw error;
    }
  };

  uploadAttachment = async (file: File) => {
    const attachment = await this.service.uploadAttachment(file);
    runInAction(() => {
      this.composeDraft.uploaded_attachments = [...(this.composeDraft.uploaded_attachments ?? []), attachment];
    });
    return attachment;
  };

  fetchSettings = async () => {
    const [signatures, templates, filters, labels, savedSearches, forwarding, preferences] = await Promise.all([
      this.service.signatures(),
      this.service.templates(),
      this.service.filters(),
      this.service.labels(),
      this.service.savedSearches(),
      this.service.forwarding(),
      this.service.preferences(),
    ]);
    runInAction(() => {
      this.signatures = signatures;
      this.templates = templates;
      this.filters = filters;
      this.labels = labels;
      this.savedSearches = savedSearches;
      this.forwarding = forwarding;
      this.preferences = preferences;
    });
  };

  patchPreferences = async (data: Partial<TMailPreference>) => {
    const response = await this.service.patchPreferences(data);
    runInAction(() => {
      this.preferences = response;
    });
    return response;
  };

  createSignature = async (data: Partial<TMailSignature>) => {
    const response = await this.service.createSignature(data);
    runInAction(() => {
      this.signatures = [...this.signatures, response];
    });
    return response;
  };

  updateSignature = async (id: string, data: Partial<TMailSignature>) => {
    const response = await this.service.updateSignature(id, data);
    runInAction(() => {
      this.signatures = this.signatures.map((item) => (item.id === id ? response : item));
    });
    return response;
  };

  deleteSignature = async (id: string) => {
    await this.service.deleteSignature(id);
    runInAction(() => {
      this.signatures = this.signatures.filter((item) => item.id !== id);
    });
  };

  createTemplate = async (data: Partial<TMailTemplate>) => {
    const response = await this.service.createTemplate(data);
    runInAction(() => {
      this.templates = [...this.templates, response];
    });
    return response;
  };

  updateTemplate = async (id: string, data: Partial<TMailTemplate>) => {
    const response = await this.service.updateTemplate(id, data);
    runInAction(() => {
      this.templates = this.templates.map((item) => (item.id === id ? response : item));
    });
    return response;
  };

  deleteTemplate = async (id: string) => {
    await this.service.deleteTemplate(id);
    runInAction(() => {
      this.templates = this.templates.filter((item) => item.id !== id);
    });
  };

  createFilter = async (data: Partial<TMailFilterRule>) => {
    const response = await this.service.createFilter(data);
    runInAction(() => {
      this.filters = [...this.filters, response];
    });
    return response;
  };

  updateFilter = async (id: string, data: Partial<TMailFilterRule>) => {
    const response = await this.service.updateFilter(id, data);
    runInAction(() => {
      this.filters = this.filters.map((item) => (item.id === id ? response : item));
    });
    return response;
  };

  deleteFilter = async (id: string) => {
    await this.service.deleteFilter(id);
    runInAction(() => {
      this.filters = this.filters.filter((item) => item.id !== id);
    });
  };

  createLabel = async (data: Partial<TMailLabel>) => {
    const response = await this.service.createLabel(data);
    runInAction(() => {
      this.labels = [...this.labels, response];
    });
    return response;
  };

  updateLabel = async (id: string, data: Partial<TMailLabel>) => {
    const response = await this.service.updateLabel(id, data);
    runInAction(() => {
      this.labels = this.labels.map((item) => (item.id === id ? response : item));
    });
    return response;
  };

  deleteLabel = async (id: string) => {
    await this.service.deleteLabel(id);
    runInAction(() => {
      this.labels = this.labels.filter((item) => item.id !== id);
    });
  };

  updateForwarding = async (data: Partial<TMailForwarding>) => {
    const response = await this.service.patchForwarding(data);
    runInAction(() => {
      this.forwarding = response;
    });
    return response;
  };
}
