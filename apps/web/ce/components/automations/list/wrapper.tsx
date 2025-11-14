type Props = {
  projectId: string;
  workspaceSlug: string;
  children: React.ReactNode;
};

export const AutomationsListWrapper: React.FC<Props> = (props) => <>{props.children}</>;
