import { useRouter } from "next/router";

import useSWR from "swr";

// services
import pagesService from "services/pages.service";
// components
import { SinglePageListItem } from "components/pages";
// ui
import { Loader } from "components/ui";
// types
import { IPage } from "types";
// fetch-keys
import { OTHER_PAGES_LIST } from "constants/fetch-keys";

type TPagesListProps = {
  handleDeletePage: (page: IPage) => void;
  setCreateUpdatePageModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedPage: React.Dispatch<React.SetStateAction<any>>;
};

export const OtherPagesList: React.FC<TPagesListProps> = ({
  handleDeletePage,
  setCreateUpdatePageModal,
  setSelectedPage,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: pages } = useSWR(
    workspaceSlug && projectId ? OTHER_PAGES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => pagesService.getOtherPages(workspaceSlug as string, projectId as string)
      : null
  );

  const handleEditPage = (page: IPage) => {
    setSelectedPage({ ...page, actionType: "edit" });
    setCreateUpdatePageModal(true);
  };

  return (
    <>
      {pages ? (
        pages.length > 0 ? (
          <div className="mt-4 space-y-4">
            <ul role="list" className="divide-y">
              {pages.map((page) => (
                <SinglePageListItem
                  key={page.id}
                  page={page}
                  handleDeletePage={() => handleDeletePage(page)}
                  handleEditPage={() => handleEditPage(page)}
                />
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-center">No issues found</p>
        )
      ) : (
        <Loader className="mt-8 space-y-4">
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
          <Loader.Item height="40px" />
        </Loader>
      )}
    </>
  );
};
