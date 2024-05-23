import React, { Fragment, useEffect } from "react";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type Props<T> = {
  data: T[];
  render: (item: T, index: number) => React.ReactNode;
  onChange: (data: T[]) => void;
  keyExtractor: (item: T, index: number) => string;
};

const moveItems = <T,>(data: T[], source: T, destination: T): T[] => {
  const sourceIndex = data.indexOf(source);
  const destinationIndex = data.indexOf(destination);

  if (sourceIndex === -1 || destinationIndex === -1) return data;

  const newData = [...data];
  newData.splice(sourceIndex, 1);
  newData.splice(destinationIndex, 0, source);

  return newData;
};

const Sortable = <T,>({ data, render, onChange, keyExtractor }: Props<T>) => {
  useEffect(() => {
    const unsubscribe = monitorForElements({
      onDrop({ source, location }) {
        const destination = location?.current?.dropTargets[0];
        if (!destination) return;
        onChange(moveItems(data, source.data as T, destination.data as T));
      },
    });

    // Clean up the subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [data, onChange]);

  return (
    <>
      {data.map((item, index) => (
        <Fragment key={keyExtractor(item, index)}>{render(item, index)}</Fragment>
      ))}
    </>
  );
};

export { Sortable };
