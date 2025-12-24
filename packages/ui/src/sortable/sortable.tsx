// @ts-expect-error Due to live server dependencies
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/dist/cjs/entry-point/element/adapter.js";
import React, { Fragment, useEffect, useMemo } from "react";
import { Draggable } from "./draggable";

type TEnhancedData<T> = T & { __uuid__?: string };

type Props<T> = {
  data: TEnhancedData<T>[];
  render: (item: T, index: number) => React.ReactNode;
  onChange: (data: T[], movedItem?: T) => void;
  keyExtractor: (item: T, index: number) => string;
  containerClassName?: string;
  id?: string;
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

export function Sortable<T>({ data, render, onChange, keyExtractor, containerClassName, id }: Props<T>) {
  useEffect(() => {
    const unsubscribe = monitorForElements({
      // @ts-expect-error Due to live server dependencies
      onDrop({ source, location }) {
        const destination = location?.current?.dropTargets[0];
        if (!destination) return;
        const { newData, movedItem } = moveItem(
          data,
          source.data as TEnhancedData<T>,
          destination.data as TEnhancedData<T> & { closestEdge: string },
          keyExtractor
        );
        onChange(newData, movedItem);
      },
    });

    // Clean up the subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [data, keyExtractor, onChange]);

  const enhancedData = useMemo(() => {
    const uuid = id ? id : Math.random().toString(36).substring(7);
    return data.map((item) => ({ ...item, __uuid__: uuid }));
  }, [data, id]);

  return (
    <>
      {data.map((item, index) => (
        <Draggable
          key={keyExtractor(enhancedData[index], index)}
          data={enhancedData[index]}
          className={containerClassName}
        >
          <Fragment>{render(item, index)}</Fragment>
        </Draggable>
      ))}
    </>
  );
}

export default Sortable;
