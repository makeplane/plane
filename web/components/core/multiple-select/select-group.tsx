import { TSelectionHelper, TSelectionSnapshot, useMultipleSelect } from "@/hooks/use-multiple-select";

type Props = {
  children: (helpers: TSelectionHelper, snapshot: TSelectionSnapshot) => React.ReactNode;
  groups: string[];
};

export const MultipleSelectGroup: React.FC<Props> = (props) => {
  const { children, groups } = props;

  const { helpers, snapshot } = useMultipleSelect({
    groups,
  });

  return <>{children(helpers, snapshot)}</>;
};
