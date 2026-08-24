/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, it, expect } from "vitest";
import { applyTransform } from "@hypermod/utils";
import * as transformer from "../headlessui-v2-default-tags";

const apply = (source: string) =>
  applyTransform(transformer, source, { parser: "tsx" });

describe("headlessui-v2-default-tags", () => {
  it("pins a bare <Transition> to the v1 div default", async () => {
    const result = await apply(`
      import { Transition } from "@headlessui/react";

      export const Panel = () => (
        <Transition show={open} className="grid">
          <div>body</div>
        </Transition>
      );
    `);

    expect(result).toContain(
      `<Transition as="div" show={open} className="grid">`
    );
  });

  it("pins Combobox.Options to ul and Combobox.Option to li", async () => {
    const result = await apply(`
      import { Combobox } from "@headlessui/react";

      export const Select = () => (
        <Combobox.Options className="list">
          <Combobox.Option value="a">A</Combobox.Option>
        </Combobox.Options>
      );
    `);

    expect(result).toContain(`<Combobox.Options as="ul" className="list">`);
    expect(result).toContain(`<Combobox.Option as="li" value="a">`);
  });

  it("pins Listbox.Options to ul and Listbox.Option to li", async () => {
    const result = await apply(`
      import { Listbox } from "@headlessui/react";

      export const Select = () => (
        <Listbox.Options>
          <Listbox.Option value="a">A</Listbox.Option>
        </Listbox.Options>
      );
    `);

    expect(result).toContain(`<Listbox.Options as="ul">`);
    expect(result).toContain(`<Listbox.Option as="li" value="a">`);
  });

  it("pins Tab.Group to Fragment and imports Fragment", async () => {
    const result = await apply(`
      import { useState } from "react";
      import { Tab } from "@headlessui/react";

      export const Tabs = () => (
        <Tab.Group>
          <Tab.List>
            <Tab>One</Tab>
          </Tab.List>
        </Tab.Group>
      );
    `);

    expect(result).toContain("<Tab.Group as={Fragment}>");
    expect(result).toMatch(/import \{ useState, Fragment \} from "react"/);
    // Tab.List and Tab are unchanged between v1 and v2.
    expect(result).toContain("<Tab.List>");
    expect(result).toContain("<Tab>One</Tab>");
  });

  it("adds a value Fragment import alongside an existing type-only one", async () => {
    const result = await apply(`
      import type { Fragment } from "react";
      import { Tab } from "@headlessui/react";

      export const Tabs = () => <Tab.Group><Tab.List /></Tab.Group>;
    `);

    expect(result).toContain("<Tab.Group as={Fragment}>");
    // The type-only specifier binds no runtime value, so a real value import must appear.
    expect(result).toMatch(/import \{ Fragment \} from "react"/);
  });

  it("does not mistake an aliased Fragment import for a local Fragment binding", async () => {
    const result = await apply(`
      import { Fragment as ReactFragment } from "react";
      import { Tab } from "@headlessui/react";

      export const Tabs = () => <Tab.Group><Tab.List /></Tab.Group>;
    `);

    expect(result).toContain("<Tab.Group as={Fragment}>");
    expect(result).toMatch(
      /import \{ Fragment as ReactFragment, Fragment \} from "react"/
    );
  });

  it("adds a react import when the file has none", async () => {
    const result = await apply(`
      import { Tab } from "@headlessui/react";

      export const Tabs = () => <Tab.Group><Tab.List /></Tab.Group>;
    `);

    expect(result).toMatch(/import \{ Fragment \} from "react"/);
  });

  it("leaves an existing explicit as= alone", async () => {
    const result = await apply(`
      import { Transition, Combobox } from "@headlessui/react";

      export const Panel = () => (
        <Transition
          as={Fragment}
          show={open}
        >
          <Combobox.Options as="div">x</Combobox.Options>
        </Transition>
      );
    `);

    expect(result).toContain("as={Fragment}");
    expect(result).not.toContain(`as="div" as={Fragment}`);
    expect(result).toContain(`<Combobox.Options as="div">`);
    // exactly one `as` per element
    expect(result.match(/as=/g)).toHaveLength(2);
  });

  it("skips elements carrying a spread that could supply as", async () => {
    const result = await apply(`
      import { Transition } from "@headlessui/react";

      export const Panel = (props) => <Transition {...props}>x</Transition>;
    `);

    expect(result).not.toContain("as=");
  });

  it("ignores same-named components not imported from Headless UI", async () => {
    const result = await apply(`
      import { Transition } from "@/components/transition";

      export const Panel = () => <Transition show>x</Transition>;
    `);

    expect(result).not.toContain("as=");
  });

  it("does not touch Menu, Dialog, Disclosure or Popover subcomponents", async () => {
    const result = await apply(`
      import { Menu, Dialog, Disclosure, Popover } from "@headlessui/react";

      export const All = () => (
        <>
          <Menu.Items><Menu.Item>a</Menu.Item></Menu.Items>
          <Dialog.Panel><Dialog.Title>t</Dialog.Title></Dialog.Panel>
          <Disclosure.Button /><Disclosure.Panel />
          <Popover.Button /><Popover.Panel />
        </>
      );
    `);

    expect(result).not.toContain("as=");
  });

  it("resolves aliased Headless UI imports by their imported name", async () => {
    const result = await apply(`
      import { Transition as HeadlessTransition } from "@headlessui/react";

      export const Panel = () => <HeadlessTransition show>x</HeadlessTransition>;
    `);

    expect(result).toContain(`<HeadlessTransition as="div" show>`);
  });

  it("resolves aliased member expressions too", async () => {
    const result = await apply(`
      import { Combobox as HeadlessCombobox } from "@headlessui/react";

      export const Select = () => (
        <HeadlessCombobox.Options>
          <HeadlessCombobox.Option value="a">A</HeadlessCombobox.Option>
        </HeadlessCombobox.Options>
      );
    `);

    expect(result).toContain(`<HeadlessCombobox.Options as="ul">`);
    expect(result).toContain(`<HeadlessCombobox.Option as="li" value="a">`);
  });
});
