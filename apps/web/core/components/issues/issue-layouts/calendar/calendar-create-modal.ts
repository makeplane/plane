import type { TIssue } from "@plane/types";

export const openCalendarCreateModal = (
  prePopulatedData: Partial<TIssue> | undefined,
  setModalData: (data: Partial<TIssue>) => void,
  onOpen?: () => void
) => {
  setModalData({ ...(prePopulatedData ?? {}) });
  onOpen?.();
};
