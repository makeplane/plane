import { useRouter } from "next/router";
import { ArrowRightAlt, CloseFullscreen, East, OpenInFull } from "@mui/icons-material";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Icon } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// store
import { IPeekMode } from "store/issue_details";
import { RootStore } from "store/root";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IIssue } from "types";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue;
};

const peekModes: {
  key: IPeekMode;
  icon: string;
  label: string;
}[] = [
  { key: "side", icon: "side_navigation", label: "Side Peek" },
  {
    key: "modal",
    icon: "dialogs",
    label: "Modal Peek",
  },
  {
    key: "full",
    icon: "nearby",
    label: "Full Screen Peek",
  },
];

export const PeekOverviewHeader: React.FC<Props> = (props) => {
  const { issueDetails, handleClose } = props;

  const { issueDetails: issueDetailStore }: RootStore = useMobxStore();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { setToastAlert } = useToast();

  const handleCopyLink = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${issueDetails.project}/`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link copied!",
        message: "Issue link copied to clipboard",
      });
    });
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {issueDetailStore.peekMode === "side" && (
          <button
            type="button"
            onClick={() => {
              handleClose();
            }}
          >
            <East
              sx={{
                fontSize: "14px",
              }}
            />
          </button>
        )}
        {issueDetailStore.peekMode === "modal" || issueDetailStore.peekMode === "full" ? (
          <button type="button" onClick={() => issueDetailStore.setPeekMode("side")}>
            <CloseFullscreen
              sx={{
                fontSize: "14px",
              }}
            />
          </button>
        ) : (
          <button type="button" onClick={() => issueDetailStore.setPeekMode("modal")}>
            <OpenInFull
              sx={{
                fontSize: "14px",
              }}
            />
          </button>
        )}
        <button
          type="button"
          className={`grid place-items-center ${issueDetailStore.peekMode === "full" ? "rotate-45" : ""}`}
        >
          <Icon iconName={peekModes.find((m) => m.key === issueDetailStore.peekMode)?.icon ?? ""} />
        </button>
      </div>
      {(issueDetailStore.peekMode === "side" || issueDetailStore.peekMode === "modal") && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCopyLink} className="-rotate-45">
            <Icon iconName="link" />
          </button>
        </div>
      )}
    </div>
  );
};
