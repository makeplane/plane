import { test, expect } from "../fixtures/test-fixtures";
import { env } from "../fixtures/env";

test.describe("work item modal duration", () => {
  test("accepts and submits duration input after selecting a start date from the suffix area", async ({
    page,
    api,
  }, testInfo) => {
    const issueName = `e2e-duration-modal-${testInfo.title.replace(/\s+/g, "-").slice(0, 40)}-${Date.now()}`;
    let issueId: string | undefined;

    try {
      await page.goto(`/${env.workspaceSlug}/projects/${env.projectId}/issues/`);

      await page
        .getByRole("button", { name: /add work item|new work item|create your first work item/i })
        .first()
        .click();
      await page.getByPlaceholder("Title").fill(issueName);
      await page
        .getByRole("button", { name: /^Start date$/ })
        .last()
        .click();
      await page.getByRole("button", { name: /Today,/ }).click();

      await page.getByText("working days").click();
      await page.keyboard.type("3");

      await expect(page.getByLabel("Enter days")).toHaveValue("3");

      const createResponsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/api/workspaces/${env.workspaceSlug}/projects/${env.projectId}/issues/`) &&
          response.request().method() === "POST"
      );
      await page.getByRole("button", { name: "Save" }).click();
      const response = await createResponsePromise;
      expect(response.status()).toBe(201);
      expect(response.request().postDataJSON()).toMatchObject({
        name: issueName,
        planned_duration_working_days: 3,
      });

      const body = await response.json();
      issueId = body.id;
      expect(body.planned_duration_working_days).toBe(3);
    } finally {
      if (issueId) await api.deleteIssue(issueId);
    }
  });
});
