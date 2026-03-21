import { test, expect } from "@playwright/test";

import {
  createProject,
  dismissWorkspaceOnboarding,
  importNode,
  openProjectNotes,
  openNode,
  returnToDashboard,
} from "./helpers/app";

test.describe.configure({ timeout: 90000 });

test.describe("Previo feature QA", () => {
  test("stages project creation and replaces starter content templates with intensity", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("dashboard-new-project").click();

    const dialog = page.getByTestId("create-project-dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByTestId("create-project-panel-basics")).toBeVisible();
    await expect(dialog.getByTestId("create-project-step-basics")).toBeVisible();
    await dialog.getByLabel(/project name/i).fill(`Stage QA ${Date.now()}`);

    await dialog.getByTestId("create-project-next").click();
    await expect(dialog.getByTestId("create-project-panel-workflow")).toBeVisible();
    await expect(dialog.getByTestId("workflow-option-quick")).toBeVisible();
    await expect(dialog.getByTestId("workflow-option-full")).toBeVisible();
    await expect(dialog.getByTestId("template-option-blank")).toHaveCount(0);

    await dialog.getByTestId("create-project-next").click();
    await dialog.getByTestId("create-project-next").click();
    await expect(dialog.getByTestId("create-project-panel-advanced")).toBeVisible();
    await expect(dialog.getByTestId("project-domain-trigger")).toBeVisible();
    await expect(dialog.getByTestId("intensity-option-none")).toBeVisible();
  });

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

  test("keeps the dashboard hero compact while preserving recent project and stats", async ({
    page,
  }) => {
    const projectName = `Hero QA ${Date.now()}`;
    await createProject(page, { name: projectName, template: "quick" });

    await returnToDashboard(page);

    const hero = page.getByTestId("dashboard-hero");
    await expect(hero).toBeVisible();
    await expect(hero).toContainText(projectName);
    await expect(hero).toContainText("Projects");
    await expect(hero).toContainText("Nodes");
    await expect(hero).toContainText("Completed");
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

  test("uses a fixed workflow map and keeps project notes outside canonical compilation", async ({
    page,
  }) => {
    const projectName = `Notes QA ${Date.now()}`;
    await createProject(page, { name: projectName, template: "quick" });

    await expect(page.getByText("Add Node")).toHaveCount(0);
    await openProjectNotes(page);
    await expect(page.getByTestId("project-notes-panel")).toContainText(
      "do not affect validation, tasks, summary, or readiness",
    );

    const notesTextarea = page.getByTestId("project-notes-textarea");
    await notesTextarea.fill("Private scratch note");
    await expect(page.getByTestId("project-notes-save-state")).toContainText(
      /saving|saved/i,
    );

    await page.getByTestId("project-notes-close").click();
    await openProjectNotes(page);
    await expect(notesTextarea).toHaveValue("Private scratch note");
  });
});
