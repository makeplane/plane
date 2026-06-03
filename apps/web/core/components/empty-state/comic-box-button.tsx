/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Ref } from "react";
import { Fragment, useState } from "react";
import { usePopper } from "react-popper";
import { Popover } from "@headlessui/react";
// plane imports
import { Button } from "@plane/propel/button";

type Props = {
  label: string;
  icon?: any;
  title: string | undefined;
  description: string | undefined;
  onClick?: () => void;
  disabled?: boolean;
};

export function ComicBoxButton(props: Props) {
  const { label, icon, title, description, onClick, disabled = false } = props;
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-end",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 10],
        },
      },
    ],
  });

  return (
    <Popover as="div" className="relative">
      <Popover.Button as={Fragment}>
        <Button variant="primary" size="lg" ref={setReferenceElement} onClick={onClick} disabled={disabled}>
          {icon}
          <span className="leading-4">{label}</span>
          <span className="relative h-2 w-2">
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className={`bg-blue-300 absolute right-0 z-10 h-2.5 w-2.5 animate-ping rounded-full`}
            />
            <div className={`bg-blue-400/40 absolute right-0 mt-0.5 mr-0.5 h-1.5 w-1.5 rounded-full`} />
          </span>
        </Button>
      </Popover.Button>
      {isHovered && (
        <Popover.Panel className="fixed z-10" static>
          <div
            className="relative flex w-52 flex-col overflow-hidden rounded-sm rounded-xl border border-subtle bg-layer-1 p-5 hover:bg-layer-1-hover lg:w-60 xl:w-80"
            ref={setPopperElement as Ref<HTMLDivElement>}
            style={styles.popper}
            {...attributes.popper}
          >
            <div className="rounded-lb-sm absolute bottom-2 -left-[5px] h-2 w-2 rotate-45 transform border border-t-0 border-r-0 border-subtle bg-surface-1" />
            <h3 className="w-full text-16 font-semibold">{title}</h3>
            <h4 className="mt-1 text-13">{description}</h4>
          </div>
        </Popover.Panel>
      )}
    </Popover>
  );
}
