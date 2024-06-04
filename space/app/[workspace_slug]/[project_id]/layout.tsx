type Props = {
  children: React.ReactNode;
  params: {
    workspace_slug: string;
    project_id: string;
  };
};

const ProjectIssuesLayout = async (props: Props) => {
  const { children } = props;

  return <>{children}</>;
};

export default ProjectIssuesLayout;
