// components
import { Loader } from "components/ui";
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import { IPage, RecentPagesResponse } from "types";
import { PagesView } from "./pages-view";
import { SinglePageListItem } from "./single-page-list-item";

type TPagesListProps = {
  pages: RecentPagesResponse | undefined;
  handleDeletePage: (page: IPage) => void;
  setCreateUpdatePageModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedPage: React.Dispatch<React.SetStateAction<any>>;
  viewType: "list" | "grid" | "masonry";
};

export const RecentPagesList: React.FC<TPagesListProps> = ({
  pages,
  handleDeletePage,
  setCreateUpdatePageModal,
  setSelectedPage,
  viewType,
}) => {
  const handleEditPage = (page: IPage) => {
    setSelectedPage({ ...page, actionType: "edit" });
    setCreateUpdatePageModal(true);
  };

  return (
    <>
      {pages ? (
        Object.keys(pages).length > 0 ? (
          <div className="mt-8 space-y-4">
            {Object.keys(pages).map((key) => (
              <>
                <h2 className="text-xl font-medium capitalize">
                  {replaceUnderscoreIfSnakeCase(key)}
                </h2>
                <PagesView pages={pages[key as keyof RecentPagesResponse]} viewType={viewType} />
              </>
            ))}
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
