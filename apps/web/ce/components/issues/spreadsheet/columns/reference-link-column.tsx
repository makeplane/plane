import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { TIssue, TIssueLink } from "@plane/types";
import { Row } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  issue: TIssue;
  onClose: () => void;
  onChange: (issue: TIssue, data: Partial<TIssue>, updates: Record<string, unknown>) => void;
  disabled: boolean;
};

export const SpreadsheetReferenceLinkColumn = observer(function SpreadsheetReferenceLinkColumn({ issue }: Props) {
  const { workspaceSlug } = useParams();
  const issueDetail = useIssueDetail();
  const containerRef = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<TIssueLink[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded) {
          setLoaded(true);
          void (async () => {
            try {
              if (workspaceSlug && issue.project_id && issue.id) {
                const fetched = await issueDetail.link.fetchLinks(workspaceSlug.toString(), issue.project_id, issue.id);
                setLinks(fetched);
              }
            } catch {
              // ignore
            }
          })();
        }
      },
      { threshold: 0.5 }
    );

    intersectionObserver.observe(containerRef.current);

    return () => {
      intersectionObserver.disconnect();
    };
  }, [workspaceSlug, issue.project_id, issue.id, loaded, issueDetail]);

  return (
    <Row
      ref={containerRef}
      className="flex h-11 w-full cursor-default items-center border-b-[0.5px] border-subtle px-2 text-11 hover:bg-layer-1 group-[.selected-issue-row]:bg-accent-primary/5 group-[.selected-issue-row]:hover:bg-accent-primary/10"
    >
      <span className="text-secondary">{links.length === 0 ? "—" : `${links.length}`}</span>
    </Row>
  );
});
