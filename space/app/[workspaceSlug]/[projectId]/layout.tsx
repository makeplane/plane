type Props = {
  children: React.ReactNode;
  params: {
    workspaceSlug: string;
    projectId: string;
  };
};

const ProjectIssuesLayout = async (props: Props) => {
  const { children } = props;

  return <>{children}</>;
};

export default ProjectIssuesLayout;
