/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import type { TBoardChanges, TBoardProduct } from "@plane/types";
// components
import { getProductErrorKey } from "@/components/products/helper";
// services
import { ProductBoardService } from "@/services/product-board.service";
import type { TBoardScope } from "@/services/product-board.service";

const boardService = new ProductBoardService();

type TFailure = { response?: { status?: number; data?: { product?: TBoardProduct } } };

/** Products of the board and the way to change them. */
export const useBoard = (workspaceSlug: string, scope: TBoardScope) => {
  const { t } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR(
    ["PRODUCT_BOARD", workspaceSlug, scope.include_closed, scope.include_old],
    () => boardService.list(workspaceSlug, scope),
    { keepPreviousData: true }
  );
  const { data: states } = useSWR(["PRODUCT_BOARD_STATES", workspaceSlug], () => boardService.states(workspaceSlug));

  /** Shows the change at once; a failure puts the product back. Resolves to whether it was saved. */
  const save = useCallback(
    async (product: TBoardProduct, changes: TBoardChanges, shown: Partial<TBoardProduct> = {}): Promise<boolean> => {
      const replace = (updated: TBoardProduct) =>
        mutate((rows) => rows?.map((row) => (row.id === updated.id ? updated : row)), { revalidate: false });
      const expected = Object.fromEntries(
        Object.keys(changes).map((key) => [key, product[key as keyof TBoardChanges] ?? null])
      );
      await replace({ ...product, ...changes, ...shown } as TBoardProduct);
      try {
        await replace(await boardService.update(workspaceSlug, product.id, changes, expected));
        return true;
      } catch (failure) {
        const { status, data: answer } = (failure as TFailure).response ?? {};
        await replace(status === 409 && answer?.product ? answer.product : product);
        const message =
          status === 409
            ? "product_board.conflict"
            : status === 403
              ? "product_board.no_access"
              : status === 404
                ? "product_board.gone"
                : getProductErrorKey(answer);
        setToast({ type: "error", title: t("toast.error"), message: t(message) });
        if (status === 404 || status === 403) await mutate();
        return false;
      }
    },
    [mutate, t, workspaceSlug]
  );

  return { products: data, error: error as TFailure | undefined, isLoading, states: states ?? {}, save };
};

export const useBoardProduct = (workspaceSlug: string, product: TBoardProduct | undefined) =>
  useSWR(product ? ["PRODUCT_BOARD_DETAIL", workspaceSlug, product.id] : null, () =>
    boardService.retrieve(workspaceSlug, product?.id ?? "")
  );
