type Props = {
  projectId: string;
  workspaceSlug: string;
  children: React.ReactNode;
};

export function AutomationsListWrapper(props: Props) {
  return <>{props.children}</>;
}
