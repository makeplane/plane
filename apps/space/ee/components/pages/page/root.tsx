import React, { useEffect, useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { EditorRefApi } from "@plane/editor";
import { Loader, ArchiveIcon, Logo } from "@plane/ui";
// helpers
// plane web store
import { usePage, usePagesList } from "@/plane-web/hooks/store";
// components
export const getPageName = (name: string | undefined) => {
  if (name === undefined) return "Untitled";
  if (!name || name.trim() === "") return "Untitled";
  return name;
};

export const ArchivedBadge: React.FC = () => (
  <Badge text="Archived" icon={<ArchiveIcon className="size-2.5 text-custom-text-300" />} />
);

export const Badge = ({ text, icon }: { text: string; icon?: React.ReactNode }) => (
  <div className="py-0 px-2 text-xs rounded text-custom-text-300 bg-custom-background-80/70 flex items-center gap-1">
    {icon}
    {text}
  </div>
);

type Props = {
  pageId: string;

  editorRef?: React.RefObject<EditorRefApi>;
};

type PageDisplayState = {
  logo?: React.ReactNode;
  badge?: React.ReactNode;
  text: string;
  modalTitle?: string;
  modalDescription?: string;
  modalIcon?: React.ReactNode;
  bgColor?: string;
};

export const PageEmbedCardRoot: React.FC<Props> = observer((props) => {
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const { pageId } = props;
  // params
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const page = usePage(pageId);
  const { fetchPageDetails } = usePagesList();

  // derived values
  const { logo_props, name, archived_at } = page ?? {};

  const [displayState, setDisplayState] = useState<PageDisplayState>({
    text: getPageName(name),
  });

  useEffect(() => {
    if (!pageId || !workspaceSlug) return;
    const getPage = async () => {
      await fetchPageDetails(pageId, false);
    };
    if (!page) {
      getPage();
    }
  }, [pageId, projectId, workspaceSlug, page, fetchPageDetails]);

  useEffect(() => {
    const getDisplayState = (): PageDisplayState => {
      if (archived_at) {
        return {
          text: getPageName(name),
          badge: <ArchivedBadge />,
        };
      }
      return {
        logo: <FileText size={16} type="lucide" />,
        text: getPageName(name),
      };
    };

    setDisplayState(getDisplayState());
  }, [name, archived_at, page?.id]);

  // Function to determine the appropriate logo to display
  const getPageLogo = () => {
    if (logo_props?.in_use) {
      return <Logo logo={logo_props} size={16} type="lucide" />;
    }
    if (displayState.logo) {
      return displayState.logo;
    }
    return <FileText size={16} type="lucide" />;
  };

  // Clean up the timer when the component unmounts
  useEffect(
    () => () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    },
    []
  );

  if (page?.name === null) {
    return (
      <Loader className="not-prose relative h-10 page-embed cursor-pointer rounded-md py-2 px-2 my-1.5 transition-colors flex items-center gap-1.5 !no-underline hover:bg-custom-background-80 w-full bg-custom-background-80">
        <Loader.Item className="h-9" />
      </Loader>
    );
  }

  // Get the logo using our helper function
  const pageEmbedLogo = getPageLogo();
  const redirectLink = `/pages/${page?.anchor}`;

  return (
    <>
      <div
        role="button"
        className={`not-prose relative page-embed cursor-pointer rounded-md py-2 px-2 my-1.5 transition-colors flex items-center gap-1.5 !no-underline hover:bg-custom-background-90 ${displayState.bgColor}`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (e.metaKey && page?.anchor) {
            window.open(redirectLink, "_blank");
          } else {
            if (redirectLink && page?.anchor) {
              router.push(redirectLink);
            }
          }
        }}
      >
        {pageEmbedLogo}
        <div className="flex-shrink-0 flex items-center gap-3">
          <p className="not-prose text-base font-medium break-words truncate underline decoration-custom-text-300 underline-offset-4">
            {displayState.text}
          </p>
          {displayState?.badge}
        </div>
      </div>
    </>
  );
});
