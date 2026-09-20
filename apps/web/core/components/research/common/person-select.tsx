import { useId, useState } from "react";
import { Combobox } from "@headlessui/react";

export type PersonOption = {
  id: string;
  display_name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

const name = (person: PersonOption) =>
  person.display_name || `${person.first_name || ""} ${person.last_name || ""}`.trim() || person.email || person.id;

/** Names aid discovery; the selected value always remains an unambiguous user ID. */
export function ResearchPersonSelect({
  people,
  value,
  onChange,
  label,
  disabled = false,
}: {
  people: PersonOption[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const inputId = useId();
  const filtered = people.filter((person) =>
    `${name(person)} ${person.email || ""}`.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <Combobox
      as="div"
      className="relative min-w-56"
      value={value}
      disabled={disabled}
      onChange={(id: string | null) => {
        onChange(id ?? "");
        setQuery("");
      }}
    >
      <Combobox.Label htmlFor={inputId} className="block text-11 text-tertiary">
        {label}
      </Combobox.Label>
      <div className="flex rounded border border-subtle bg-surface-1">
        <Combobox.Input
          id={inputId}
          className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-12"
          placeholder="搜索姓名或邮箱"
          displayValue={(id: string) => {
            const person = people.find((item) => item.id === id);
            return person ? `${name(person)} · ${person.email || ""}` : "";
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) onChange("");
          }}
        />
        <Combobox.Button aria-label={`展开${label}`} className="px-2">
          ⌄
        </Combobox.Button>
      </div>
      <Combobox.Options className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded border border-subtle bg-surface-1 shadow-raised-200">
        {filtered.map((person) => (
          <Combobox.Option
            key={person.id}
            value={person.id}
            className={({ active }) => `cursor-pointer px-3 py-2 text-12 ${active ? "bg-surface-2" : ""}`}
          >
            <span className="block text-primary">{name(person)}</span>
            <span className="block text-11 text-tertiary">{person.email}</span>
          </Combobox.Option>
        ))}
        {!filtered.length && <li className="px-3 py-2 text-12 text-tertiary">没有匹配的有效成员</li>}
      </Combobox.Options>
    </Combobox>
  );
}
