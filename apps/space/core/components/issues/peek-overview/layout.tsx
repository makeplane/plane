import { Fragment, useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
// local imports
import { FullScreenPeekView } from "./full-screen-peek-view";
import { SidePeekView } from "./side-peek-view";

type TIssuePeekOverview = {
  anchor: string;
  peekId: string;
  handlePeekClose?: () => void;
};

export const IssuePeekOverview = observer(function IssuePeekOverview(props: TIssuePeekOverview) {
  const { anchor, peekId, handlePeekClose } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // store
  const { peekMode, setPeekId, getIssueById, fetchIssueDetails } = useIssueDetails();
  // derived values
  const issueDetails = peekId ? getIssueById(peekId.toString()) : undefined;
  // state
  const isSidePeekOpen = !!peekId && peekMode === "side";
  const isModalPeekOpen = !!peekId && (peekMode === "modal" || peekMode === "full");

  useEffect(() => {
    if (anchor && peekId) {
      fetchIssueDetails(anchor, peekId.toString());
    }
  }, [anchor, fetchIssueDetails, peekId]);

  const handleClose = () => {
    // if close logic is passed down, call that instead of the below logic
    if (handlePeekClose) {
      handlePeekClose();
      return;
    }

    setPeekId(null);
    let queryParams: any = {
      board,
    };
    if (priority && priority.length > 0) queryParams = { ...queryParams, priority: priority };
    if (state && state.length > 0) queryParams = { ...queryParams, state: state };
    if (labels && labels.length > 0) queryParams = { ...queryParams, labels: labels };
    queryParams = new URLSearchParams(queryParams).toString();
    router.push(`/issues/${anchor}?${queryParams}`);
  };

  return (
    <>
      <Transition.Root appear show={isSidePeekOpen} as={Fragment}>
        <Dialog as="div" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="fixed right-0 top-0 z-20 h-full w-1/2 bg-surface-1 shadow-raised-200 border-l border-subtle-1">
              <SidePeekView anchor={anchor} handleClose={handleClose} issueDetails={issueDetails} />
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
      <Transition.Root appear show={isModalPeekOpen} as={Fragment}>
        <Dialog as="div" onClose={handleClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-20 bg-backdrop transition-opacity" />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Panel>
              <div
                className={`fixed left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface-1 transition-all duration-300 ${
                  peekMode === "modal" ? "h-[70%] w-3/5" : "size-[95%]"
                }`}
              >
                {peekMode === "modal" && (
                  <SidePeekView anchor={anchor} handleClose={handleClose} issueDetails={issueDetails} />
                )}
                {peekMode === "full" && (
                  <FullScreenPeekView anchor={anchor} handleClose={handleClose} issueDetails={issueDetails} />
                )}
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition.Root>
    </>
  );
});
