import { observer } from "mobx-react";
// helpers
import { calculateTimeAgoShort } from "@/helpers/date-time.helper";
// store types
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageEditInformationPopover: React.FC<Props> = observer((props) => {
  const { page } = props;

  return (
    <div className="flex-shrink-0 whitespace-nowrap">
      <span className="text-sm text-custom-text-300">Edited {calculateTimeAgoShort(page.updated_at ?? "")} ago</span>
    </div>
  );
});
