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
import { IIssue } from "types/issue";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue | undefined;
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
  const { handleClose, issueDetails } = props;

  const { issueDetails: issueDetailStore }: RootStore = useMobxStore();

  const router = useRouter();
  const { workspace_slug } = router.query;

  const { setToastAlert } = useToast();

  const handleCopyLink = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspace_slug}/projects/${issueDetails?.project}/`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link copied!",
        message: "Issue link copied to clipboard",
      });
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {issueDetailStore.peekMode === "side" && (
            <button type="button" onClick={handleClose}>
              <East
                sx={{
                  fontSize: "14px",
                }}
              />
            </button>
          )}
          {/* <Link href={`/${workspaceSlug}/projects/${issue?.project}/issues/${issue?.id}`}>
            <a>
              <OpenInFull
                sx={{
                  fontSize: "14px",
                }}
              />
            </a>
          </Link> */}
          {/* <CustomSelect
            value={mode}
            onChange={(val: TPeekOverviewModes) => setMode(val)}
            customButton={
              <button type="button" className={`grid place-items-center ${mode === "full" ? "rotate-45" : ""}`}>
                <Icon iconName={peekModes.find((m) => m.key === mode)?.icon ?? ""} />
              </button>
            }
            position="left"
          >
            {peekModes.map((mode) => (
              <CustomSelect.Option key={mode.key} value={mode.key}>
                <div className="flex items-center gap-1.5">
                  <Icon
                    iconName={mode.icon}
                    className={`!text-base flex-shrink-0 -my-1 ${mode.key === "full" ? "rotate-45" : ""}`}
                  />
                  {mode.label}
                </div>
              </CustomSelect.Option>
            ))}
          </CustomSelect> */}
        </div>
        {(issueDetailStore.peekMode === "side" || issueDetailStore.peekMode === "modal") && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={handleCopyLink} className="-rotate-45">
              <Icon iconName="link" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
