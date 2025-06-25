import { FC } from "react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// plane imports
import { ChangelogConfig } from "@plane/constants";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// components
import { ProductUpdatesFooter } from "@/components/global";
// plane web components
import { ProductUpdatesHeader } from "@/plane-web/components/global";
// services
import { ChangelogService } from "@/services/changelog.service";
// local components
import { ChangeLogError } from "./error";
import { ChangeLogLoader } from "./loader";
import { ChangeLogContentRoot } from "./root";

export type ProductUpdatesModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

const changelogService = new ChangelogService();

export const ProductUpdatesModal: FC<ProductUpdatesModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;

  // useSWR
  const { data, isLoading, error } = useSWR(isOpen ? `CHANGE_LOG` : null, () =>
    changelogService.fetchChangelog(ChangelogConfig)
  );

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXXXL}>
      <ProductUpdatesHeader />
      <div className="flex flex-col h-[60vh] vertical-scrollbar scrollbar-xs overflow-hidden overflow-y-scroll px-6 mx-0.5">
        {isLoading ? <ChangeLogLoader /> : error ? <ChangeLogError /> : <ChangeLogContentRoot data={data} />}
      </div>
      <ProductUpdatesFooter />
    </ModalCore>
  );
});
