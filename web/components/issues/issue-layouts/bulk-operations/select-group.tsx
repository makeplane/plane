import { TSelectionHelper, TSelectionSnapshot, useEntitySelection } from "@/hooks/use-entity-selection";

type Props = {
  children: (helpers: TSelectionHelper, snapshot: TSelectionSnapshot) => React.ReactNode;
  groups: string[];
};

export const BulkOperationsSelectGroup: React.FC<Props> = (props) => {
  const { children, groups } = props;

  const { helpers, snapshot } = useEntitySelection({
    groups,
  });

  return <>{children(helpers, snapshot)}</>;
};
