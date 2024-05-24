import { observer } from "mobx-react";
// hooks
import { TSelectionHelper, useMultipleSelect } from "@/hooks/use-multiple-select";

type Props = {
  children: (helpers: TSelectionHelper) => React.ReactNode;
  containerRef: React.MutableRefObject<HTMLElement | null>;
  entities: Record<string, string[]>; // { groupID: entityIds[] }
};

export const MultipleSelectGroup: React.FC<Props> = observer((props) => {
  const { children, containerRef, entities } = props;

  const helpers = useMultipleSelect({
    containerRef,
    entities,
  });

  return <>{children(helpers)}</>;
});

MultipleSelectGroup.displayName = "MultipleSelectGroup";
