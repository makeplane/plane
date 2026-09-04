/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { TAIAccount } from "@plane/types";
// local imports
import { AIAccountsListItem } from "./ai-accounts-list-item";

type Props = {
  accounts: TAIAccount[];
  workspaceSlug: string;
};

export function AIAccountsList(props: Props) {
  const { accounts, workspaceSlug } = props;

  return (
    <div className="flex flex-col gap-2">
      {accounts.map((account) => (
        <AIAccountsListItem key={account.id} account={account} workspaceSlug={workspaceSlug} />
      ))}
    </div>
  );
}
