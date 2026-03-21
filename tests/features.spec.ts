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
    await page.getByTestId("project-filter-trigger").click({ force: true });
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

    const closeButton = page.getByTestId("editor-close-panel");
    const fitViewButton = page.getByTestId("workspace-fit-view");
    const openWorkspaceNode = async (
      nodeType: "requirements" | "task_board",
      panelTestId: "node-editor-panel" | "task-board-editor" = "node-editor-panel",
    ) => {
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }

      if (await fitViewButton.isVisible().catch(() => false)) {
        await fitViewButton.click();
      }

      const node = page.getByTestId(`workspace-node-${nodeType}`).first();
      await node.waitFor({ state: "attached", timeout: 30000 });
      await node.click({ force: true });

      if (panelTestId === "node-editor-panel") {
        await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
          "data-node-type",
          nodeType,
          { timeout: 15000 },
        );
        return;
      }

      await expect(page.getByTestId(panelTestId)).toBeVisible({ timeout: 15000 });
    };

    await openWorkspaceNode("requirements");
    await page.getByTestId("node-source-import").click();
    await expect(page.getByTestId("source-import-dialog")).toBeVisible();
    await page
      .getByTestId("source-import-textarea")
      .fill("[FR] [Must] User can review queued invoices | Billing | Invoice queue");
    await page.getByTestId("source-import-parse").click();
    await page.getByTestId("source-import-apply").click();
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "Imported source",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("editor-panel-header")).toContainText("Saved", {
      timeout: 15000,
    });

    await openWorkspaceNode("task_board", "task-board-editor");
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

    const fitViewButton = page.getByTestId("workspace-fit-view");
    if (await fitViewButton.isVisible().catch(() => false)) {
      await fitViewButton.click();
    }
    const summaryNode = page.getByTestId("workspace-node-summary").first();
    await summaryNode.waitFor({ state: "attached", timeout: 30000 });
    await summaryNode.click({ force: true });
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

  test("reviews unresolved imports before save and regenerates tasks from canonical data", async ({
    page,
  }) => {
    test.setTimeout(180000);

    const openWorkspaceNode = async (
      nodeType: "project_brief" | "requirements" | "task_board",
      panelTestId: "node-editor-panel" | "task-board-editor" = "node-editor-panel",
    ) => {
      const closeButton = page.getByTestId("editor-close-panel");
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
      }

      const fitViewButton = page.getByTestId("workspace-fit-view");
      if (await fitViewButton.isVisible().catch(() => false)) {
        await fitViewButton.click();
      }

      const node = page.getByTestId(`workspace-node-${nodeType}`).first();
      await node.waitFor({ state: "attached", timeout: 30000 });
      await node.click({ force: true });

      if (panelTestId === "node-editor-panel") {
        await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
          "data-node-type",
          nodeType,
          { timeout: 15000 },
        );
        return;
      }

      await expect(page.getByTestId(panelTestId)).toBeVisible({ timeout: 15000 });
    };

    await page.route("**/api/ai/import-document", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          fields: {
            name: "",
            background: "",
            target_users: [],
            scope_in: ["Self-service signup"],
            objectives: [],
            constraints: [],
          },
        },
      });
    });

    await createProject(page, {
      name: `USP QA ${Date.now()}`,
      template: "quick",
    });

    await dismissWorkspaceOnboarding(page);
    await openWorkspaceNode("project_brief");
    await page.getByTestId("node-source-import").click();
    await page.getByTestId("source-import-textarea").fill("Client brief");
    await page.getByTestId("source-import-parse").click();
    await expect(page.getByTestId("source-import-issues")).toContainText(
      "Project name is still missing",
    );
    await page.getByTestId("import-review-brief-name").fill("Signup Workspace");
    await page
      .getByTestId("import-review-brief-background")
      .fill("A client-facing signup workflow.");
    await page
      .getByTestId("import-review-brief-target-users")
      .fill("Customer");
    await page
      .getByTestId("import-review-brief-objectives")
      .fill("Launch self-service signup");
    await page.getByTestId("source-import-apply").click();
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "Imported source",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("editor-panel-header")).toContainText("Saved", {
      timeout: 15000,
    });

    await openWorkspaceNode("requirements");
    await page.getByTestId("node-source-import").click();
    await page
      .getByTestId("source-import-textarea")
      .fill("[FR] [Must] Allow sign up via email |  | ");
    await page.getByTestId("source-import-parse").click();
    await expect(page.getByTestId("source-import-issues")).toContainText(
      "not linked to any brief scope item",
    );
    await page
      .getByTestId("import-review-requirement-category-0")
      .fill("Authentication");
    await page
      .getByTestId("import-review-requirement-scope-0")
      .fill("Self-service signup");
    await page.getByTestId("source-import-apply").click();
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "Imported source",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("editor-panel-header")).toContainText("Saved", {
      timeout: 15000,
    });

    await openWorkspaceNode("task_board", "task-board-editor");
    await page.getByRole("button", { name: /^regenerate$/i }).click();
    await page.getByRole("button", { name: /^regenerate now$/i }).click();
    await expect(page.getByTestId("task-board-summary-total")).toContainText(
      /[1-9]\d* generated/i,
      { timeout: 15000 },
    );
  });
});
