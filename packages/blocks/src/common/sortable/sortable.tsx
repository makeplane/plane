/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Same entry point as `./draggable`: a monitor only sees drags registered on its own adapter instance.
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import React, { Fragment, useEffect, useEffectEvent, useId, useMemo } from "react";
import { Draggable } from "./draggable";

type TEnhancedData<T> = T & { __uuid__?: string };

type Props<T> = {
  data: TEnhancedData<T>[];
  render: (item: T, index: number) => React.ReactNode;
  onChange: (data: T[], movedItem?: T) => void;
  keyExtractor: (item: T, index: number) => string;
  containerClassName?: string;
  id?: string;
  allowExternalDrop?: boolean;
  onExternalAdd?: (externalData: any, targetItem: T, position: "top" | "bottom") => void;
};

const moveItem = <T,>(
  data: TEnhancedData<T>[],
  source: TEnhancedData<T>,
  destination: TEnhancedData<T> & Record<symbol, string>,
  keyExtractor: (item: T, index: number) => string
): {
  newData: T[];
  movedItem: T | undefined;
} => {
  const sourceIndex = data.findIndex((item, index) => keyExtractor(item, index) === keyExtractor(source, 0));
  if (sourceIndex === -1) return { newData: data, movedItem: undefined };

  const destinationIndex = data.findIndex((item, index) => keyExtractor(item, index) === keyExtractor(destination, 0));

  if (destinationIndex === -1) return { newData: data, movedItem: undefined };

  const symbolKey = Reflect.ownKeys(destination).find((key) => key.toString() === "Symbol(closestEdge)");
  const position = symbolKey ? destination[symbolKey as symbol] : "bottom"; // Add 'as symbol' to cast symbolKey to symbol

  // Calculate final position before removing source item
  const finalIndex = position === "bottom" ? destinationIndex + 1 : destinationIndex;

  // Adjust for the fact that we're removing the source item first
  // If source is before destination, removing it shifts everything back by 1
  const adjustedDestinationIndex = finalIndex > sourceIndex ? finalIndex - 1 : finalIndex;

  const newData = [...data];
  const [movedItem] = newData.splice(sourceIndex, 1);

  // Insert at the calculated position (bounds check is implicit in splice)
  newData.splice(adjustedDestinationIndex, 0, movedItem);

  const { __uuid__: movedItemId, ...movedItemData } = movedItem;
  return {
    newData: newData.map((item) => {
      const { __uuid__: uuid, ...rest } = item;
      return rest as T;
    }),
    movedItem: movedItemData as T,
  };
};

export function Sortable<T>({
  data,
  render,
  onChange,
  keyExtractor,
  containerClassName,
  id,
  allowExternalDrop,
  onExternalAdd,
}: Props<T>) {
  // Identifies this Sortable instance so `Draggable`'s `canDrop` can reject items dragged in from another list.
  const instanceId = useId();
  const listId = id ? id : instanceId;

  // Callers pass `keyExtractor` and `onChange` inline; the effect event reads the latest ones (and `data`) at drop time,
  // so the monitor is registered once per list instead of on every render.
  const handleDrop = useEffectEvent(
    (source: TEnhancedData<T>, destination: TEnhancedData<T> & Record<symbol, string>) => {
      const { newData, movedItem } = moveItem(data, source, destination, keyExtractor);
      onChange(newData, movedItem);
    }
  );

  useEffect(() => {
    const unsubscribe = monitorForElements({
      // Only drags that started in this list; the shared adapter also reports every other element drag in the app.
      canMonitor: ({ source }) => source.data.__uuid__ === listId,
      onDrop({ source, location }) {
        const destination = location?.current?.dropTargets[0];
        if (!destination) return;

        // Skip if external drop (handled by Draggable's onExternalDrop)
        if (source.data.isExternal) {
          return;
        }

        handleDrop(source.data as TEnhancedData<T>, destination.data as TEnhancedData<T> & Record<symbol, string>);
      },
    });

    // Clean up the subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [listId]);

  const enhancedData = useMemo(() => data.map((item) => ({ ...item, __uuid__: listId })), [data, listId]);

  return (
    <>
      {data.map((item, index) => (
        <Draggable
          // oxlint-disable-next-line react/no-array-index-key -- the key comes from the caller's keyExtractor; index is only its fallback argument
          key={keyExtractor(enhancedData[index], index)}
          data={enhancedData[index]}
          className={containerClassName}
          allowExternalDrop={allowExternalDrop}
          onExternalDrop={(externalData, position) => {
            if (onExternalAdd) {
              onExternalAdd(externalData, item, position);
            }
          }}
        >
          <Fragment>{render(item, index)}</Fragment>
        </Draggable>
      ))}
    </>
  );
}

export default Sortable;
