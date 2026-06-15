/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@plane/utils";

export const MAIL_LABEL_COLORS = [
  "#3F6CC4",
  "#3C9568",
  "#B5832C",
  "#845AC0",
  "#C24E2C",
  "#2C8C9C",
  "#C24E7A",
  "#6E675B",
];

export function MailToggle(props: { value: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  const { value, onChange, disabled } = props;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        "relative h-6 w-[42px] flex-shrink-0 rounded-full transition-colors",
        value ? "bg-[var(--mail-accent)]" : "bg-[var(--mail-border)]",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-all",
          value ? "left-[21px]" : "left-[3px]"
        )}
      />
    </button>
  );
}

export function SettingsHeader(props: { title: string; description?: string; action?: ReactNode }) {
  const { title, description, action } = props;
  return (
    <div className="mb-4 flex items-start gap-4">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-[var(--mail-ink)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--mail-muted)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="mb-3 mt-7 text-base font-semibold text-[var(--mail-ink)]">{children}</div>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-[var(--mail-border)] bg-white", className)}>{children}</div>
  );
}

export function CardRow({ children, last }: { children: ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4 px-5 py-4", !last && "border-b border-[var(--mail-border)]")}>
      {children}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-sm font-medium text-[var(--mail-ink)]">{children}</div>;
}

export function TextField(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--mail-border)] bg-white px-3 text-sm text-[var(--mail-ink)] outline-none focus:border-[var(--mail-accent)]",
        className
      )}
      {...rest}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={cn(
        "w-full rounded-lg border border-[var(--mail-border)] bg-white px-3 py-2.5 text-sm text-[var(--mail-ink)] outline-none focus:border-[var(--mail-accent)]",
        className
      )}
      {...rest}
    />
  );
}

export function SelectField(props: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const { className, children, ...rest } = props;
  return (
    <select
      className={cn(
        "h-10 rounded-lg border border-[var(--mail-border)] bg-white px-3 text-sm text-[var(--mail-ink)] outline-none focus:border-[var(--mail-accent)]",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

export function PrimaryButton(props: { onClick?: () => void; disabled?: boolean; children: ReactNode; type?: "button" | "submit" }) {
  const { onClick, disabled, children, type = "button" } = props;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--mail-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--mail-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function SecondaryButton(props: { onClick?: () => void; disabled?: boolean; children: ReactNode }) {
  const { onClick, disabled, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--mail-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--mail-ink)] transition-colors hover:border-[var(--mail-accent)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--mail-border)] bg-white px-5 py-10 text-center text-sm text-[var(--mail-muted)]">
      {children}
    </div>
  );
}
