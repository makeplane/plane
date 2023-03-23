import { useState } from "react";
// components
import { DeletePageModal } from "components/pages";
import { Loader } from "components/ui";
// types
import { IPage } from "types";
import { SinglePageListItem } from "./single-page-list-item";
type TPagesListProps = {
  pages: IPage[] | undefined;
  setCreateUpdatePageModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedPage: React.Dispatch<React.SetStateAction<any>>;
};

export const PagesList: React.FC<TPagesListProps> = ({
  pages,
  setCreateUpdatePageModal,
  setSelectedPage,
}) => {
  const [pageDeleteModal, setPageDeleteModal] = useState(false);
  const [selectedPageForDelete, setSelectedPageForDelete] = useState<any>();

  const handleDeletePage = (page: IPage) => {
    setSelectedPageForDelete({ ...page, actionType: "delete" });
    setPageDeleteModal(true);
  };

  const handleEditPage = (page: IPage) => {
    setSelectedPage({ ...page, actionType: "edit" });
    setCreateUpdatePageModal(true);
  };

  return (
    <>
      <DeletePageModal
        isOpen={
          pageDeleteModal &&
          !!selectedPageForDelete &&
          selectedPageForDelete.actionType === "delete"
        }
        setIsOpen={setPageDeleteModal}
        data={selectedPageForDelete}
      />
      {pages ? (
        pages.length > 0 ? (
          <div className="border border-gray-200 bg-white sm:rounded-[10px] ">
            <ul role="list" className="divide-y divide-gray-200">
              {pages.map((page) => (
                <SinglePageListItem
                  page={page}
                  key={page.id}
                  handleDeletePage={() => handleDeletePage(page)}
                  handleEditPage={() => handleEditPage(page)}
                />
              ))}
            </ul>
          </div>
        ) : (
          "No Pages found"
        )
      ) : (
        <Loader className="grid grid-cols-1 gap-9 md:grid-cols-2 lg:grid-cols-3">
          <Loader.Item height="200px" />
        </Loader>
      )}
    </>
  );
};
