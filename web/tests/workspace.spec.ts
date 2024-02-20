import { Page, test } from "@playwright/test";
import { login } from "./helpers/user-helpers";
import { createWorkspace, deleteWorkspace } from "./helpers/workspace-helpers";

test.describe("verify creation and deletion of workspace", () => {
  let page: Page;
  let workspace: string | undefined;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await login(page);
  });

  test("create a workspace", async () => {
    workspace = await createWorkspace(page);
  });

  test("delete a workspace", async () => {
    if (!workspace) {
      test.fail();
      return;
    }
    await deleteWorkspace(page, workspace);
  });
});
