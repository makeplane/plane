import { Command } from "cmdk";
import { Settings } from "lucide-react";
// plane types
import { TPowerKPageKeys } from "@plane/types";
// local components
import { PowerKCommandItem } from "../command-item";
import { PowerKChangeThemeMenu } from "./change-theme";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (value: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKPersonalizationMenu: React.FC<Props> = (props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;

  return (
    <>
      {!activePage && (
        <Command.Group heading="Personalization">
          <PowerKCommandItem
            icon={Settings}
            label="Change theme"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-theme");
            }}
          />
        </Command.Group>
      )}
      {/* theme change menu */}
      {activePage === "change-theme" && <PowerKChangeThemeMenu handleClose={handleClose} />}
    </>
  );
};
