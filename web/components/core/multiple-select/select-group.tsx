import { observer } from "mobx-react";
// hooks
import { TSelectionHelper, TSelectionSnapshot, useMultipleSelect } from "@/hooks/use-multiple-select";

type Props = {
  children: (helpers: TSelectionHelper, snapshot: TSelectionSnapshot) => React.ReactNode;
  containerRef: React.MutableRefObject<HTMLElement | null>;
  entities: Record<string, string[]>; // { groupID: entityIds[] }
};

export const MultipleSelectGroup: React.FC<Props> = observer((props) => {
  const { children, containerRef, entities } = props;

  const { helpers, snapshot } = useMultipleSelect({
    containerRef,
    entities,
  });

  return <>{children(helpers, snapshot)}</>;
});
