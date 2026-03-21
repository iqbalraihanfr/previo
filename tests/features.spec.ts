import { test, expect } from "@playwright/test";

import {
  createProject,
  dismissWorkspaceOnboarding,
  importNode,
  openNode,
  returnToDashboard,
} from "./helpers/app";

test.describe("Previo feature QA", () => {
  test("filters dashboard projects by search and project type", async ({ page }) => {
    test.setTimeout(90000);

    const quickName = `Quick QA ${Date.now()}`;
    const fullName = `Full QA ${Date.now() + 1}`;

    await createProject(page, { name: quickName, template: "quick" });
    await returnToDashboard(page);

    await createProject(page, { name: fullName, template: "full" });
    await returnToDashboard(page);

    const searchInput = page.getByPlaceholder("Search projects by name or description...");
    await searchInput.fill(fullName);
    await expect(page.locator(`[data-project-name="${fullName}"]`)).toBeVisible();
    await expect(page.locator(`[data-project-name="${quickName}"]`)).toBeHidden();

    await searchInput.fill("");
    await page.getByRole("button", { name: /^filter$/i }).click();
    await page
      .getByRole("menuitemradio", { name: /^full architecture$/i })
      .click({ force: true });
    await expect(page.locator(`[data-project-name="${fullName}"]`)).toBeVisible();
    await expect(page.locator(`[data-project-name="${quickName}"]`)).toBeHidden();
  });

  test("supports manual task addition and task-board search", async ({ page }) => {
    const projectName = `Task QA ${Date.now()}`;
    await createProject(page, { name: projectName, template: "full" });

    await importNode(
      page,
      "requirements",
      "[FR] [Must] User can review queued invoices | Billing | Invoice queue",
    );

    await openNode(page, "task_board", "task-board-editor");
    await expect(page.getByTestId("task-board-editor")).toBeVisible();

    await page.getByTestId("task-board-add-task").click();
    await expect(page.getByTestId("task-board-summary-total")).toContainText("1 manual");

    await page.getByTestId("task-board-search").fill("Manual");
    await expect(page.locator('input[value="New Manual Task"]')).toBeVisible();
  });

  test("shows summary empty state before documentation is completed", async ({ page }) => {
    const projectName = `Summary Empty ${Date.now()}`;
    await createProject(page, { name: projectName, template: "quick" });
    await dismissWorkspaceOnboarding(page);

    await openNode(page, "summary", "summary-editor");
    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(summaryEditor).toContainText("Blueprint Empty");
    await expect(summaryEditor).toContainText("No specifications found");
  });
});
