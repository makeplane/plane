type TUseViewsProps = {};

export const useViews = (issueId: string | undefined): TUseViewsProps => {
  console.log("issueId", issueId);

  return {
    issueId,
  };
};
