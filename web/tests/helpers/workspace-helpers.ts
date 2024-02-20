import { Page, expect } from "@playwright/test";
import { randomUUID } from "crypto";

export const createWorkspace = async (page: Page) => {
  await page.locator(".t-workspace-menu").click();
  await page.getByRole("link", { name: "Create workspace" }).click();
  await page.getByPlaceholder("Enter workspace name...").click();

  const uniqueWorkspaceName = randomUUID();
  await page.getByPlaceholder("Enter workspace name...").fill(uniqueWorkspaceName);
  await page.getByRole("button", { name: "Select organization size" }).click();
  await page.getByRole("option", { name: "2-10" }).locator("div").first().click();
  await page.getByRole("button", { name: "Create Workspace" }).click();

  await assertToast(page, "Success!", "Workspace created successfully.");

  await expect(page.getByRole("button", { name: uniqueWorkspaceName })).toBeVisible();

  return uniqueWorkspaceName;
};

export const deleteWorkspace = async (page: Page, workspace: string) => {
  await page.locator(".t-workspace-menu").click();
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("button", { name: "Delete Workspace" }).click();
  await page.getByRole("button", { name: "Delete my workspace" }).click();
  await page.getByPlaceholder("Workspace name").click();
  await page.getByPlaceholder("Workspace name").fill(workspace);
  await page.getByPlaceholder("Enter 'delete my workspace'").click();
  await page.getByPlaceholder("Enter 'delete my workspace'").fill("delete my workspace");
  await page.getByRole("button", { name: "Delete Workspace" }).click();

  await assertToast(page, "Success!", "Workspace deleted successfully.");
};

export const assertToast = async (page: Page, title?: string, message?: string) => {
  await expect(page.locator(".t-toast-alert")).toBeVisible();

  if (title) {
    await expect(page.locator(".t-toast-alert-title")).toContainText(title);
  }

  if (message) {
    await expect(page.locator(".t-toast-alert-message ")).toContainText(message);
  }
};
