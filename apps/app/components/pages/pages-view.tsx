import { useState } from "react";

// components
import { CreateUpdatePageModal, DeletePageModal, SinglePageListItem } from "components/pages";
// types
import { IPage } from "types";

type Props = {
  pages: IPage[] | undefined;
  viewType: "list" | "grid" | "masonry";
};

export const PagesView: React.FC<Props> = ({ pages, viewType }) => {
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  const [selectedPageToUpdate, setSelectedPageToUpdate] = useState<IPage | null>(null);

  const [deletePageModal, setDeletePageModal] = useState(false);
  const [selectedPageToDelete, setSelectedPageToDelete] = useState<IPage | null>(null);

  const handleEditPage = (page: IPage) => {
    setSelectedPageToUpdate(page);
    setCreateUpdatePageModal(true);
  };

  const handleDeletePage = (page: IPage) => {
    setSelectedPageToDelete(page);
    setDeletePageModal(true);
  };

  return (
    <>
      <CreateUpdatePageModal
        isOpen={createUpdatePageModal}
        handleClose={() => setCreateUpdatePageModal(false)}
        data={selectedPageToUpdate}
      />
      <DeletePageModal
        isOpen={deletePageModal}
        setIsOpen={setDeletePageModal}
        data={selectedPageToDelete}
      />
      {viewType === "list" ? (
        pages ? (
          pages.length > 0 ? (
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
          ) : null
        ) : (
          <p className="mt-4 text-center">No issues found</p>
        )
      ) : null}
    </>
  );
};
