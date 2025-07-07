import { observer } from "mobx-react";
// hooks
import { TSelectionHelper, useMultipleSelect } from "@/hooks/use-multiple-select";

type Props = {
  children: (helpers: TSelectionHelper) => React.ReactNode;
  containerRef: React.MutableRefObject<HTMLElement | null>;
  disabled?: boolean;
  entities: Record<string, string[]>; // { groupID: entityIds[] }
};

export const MultipleSelectGroup: React.FC<Props> = observer((props) => {
  const { children, containerRef, disabled = false, entities } = props;

  const helpers = useMultipleSelect({
    containerRef,
    disabled,
    entities,
  });

  return <>{children(helpers)}</>;
});

MultipleSelectGroup.displayName = "MultipleSelectGroup";
