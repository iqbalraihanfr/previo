import { test, expect, type Page } from "@playwright/test";

import {
  createProject,
  openWorkspaceNode,
  openWorkspaceCommandMenu,
  returnToDashboard,
} from "./helpers/app";

async function importStructuredNode(
  page: Page,
  nodeType: "requirements" | "user_stories" | "erd",
  rawContent: string,
) {
  const expectedTitles = {
    requirements: "Requirements",
    user_stories: "User Stories",
    erd: "ERD",
  } as const;

  await openWorkspaceNode(page, nodeType);
  await page.getByTestId("node-source-import").click();
  await expect(page.getByTestId("source-import-dialog")).toBeVisible();
  await page.getByTestId("source-import-textarea").fill(rawContent);
  await expect(page.getByTestId("source-import-parse")).toBeEnabled({
    timeout: 15000,
  });
  await page.getByTestId("source-import-parse").click({ force: true });
  await expect(page.getByTestId("source-import-apply")).toBeVisible({
    timeout: 15000,
  });
  await page.getByTestId("source-import-apply").click({ force: true });
  await expect(page.getByTestId("source-import-dialog")).toBeHidden({
    timeout: 15000,
  });
  await expect(page.getByTestId("node-source-toolbar")).toContainText(
    "Imported source",
    {
      timeout: 15000,
    },
  );
  await expect(page.getByTestId("editor-panel-header")).toContainText(
    expectedTitles[nodeType],
    {
      timeout: 15000,
    },
  );
}

async function importBriefNode(page: Page, rawContent: string) {
  await openWorkspaceNode(page, "project_brief");
  await page.getByTestId("node-source-import").click();
  await expect(page.getByTestId("source-import-dialog")).toBeVisible();
  await page.getByTestId("source-import-textarea").fill(rawContent);
  await expect(page.getByTestId("source-import-parse")).toBeEnabled({
    timeout: 15000,
  });
  await page.getByTestId("source-import-parse").click({ force: true });
  await expect(page.getByTestId("source-import-apply")).toBeVisible({
    timeout: 15000,
  });
  await page.getByTestId("import-review-brief-name").fill("Monthly Reporting Workspace");
  await page
    .getByTestId("import-review-brief-background")
    .fill("A client-facing reporting flow for finance teams.");
  await page.getByTestId("import-review-brief-target-users").fill("Finance admin");
  await page
    .getByTestId("import-review-brief-objectives")
    .fill("Ship monthly reports");
  await page.getByTestId("source-import-apply").click({ force: true });
  await expect(page.getByTestId("source-import-dialog")).toBeHidden({
    timeout: 15000,
  });
  await expect(page.getByTestId("node-source-toolbar")).toContainText(
    "Imported source",
    {
      timeout: 15000,
    },
  );
  await expect(page.getByTestId("editor-panel-header")).toContainText(
    "Project Brief",
    {
      timeout: 15000,
    },
  );
}

test.describe("Previo app flows", () => {
  test("creates a project and opens the workspace shell", async ({ page }) => {
    const projectName = `Workspace Shell ${Date.now()}`;
    await createProject(page, { name: projectName, template: "quick" });

    await expect(page.getByTestId("workspace-header")).toContainText("Agile");
    await expect(page.getByTestId("workspace-canvas")).toBeVisible();
    await expect(
      page.getByTestId("workspace-node-project_brief").first(),
    ).toBeVisible();

    await page.getByTestId("workspace-next-node").click();
    await expect(page.getByTestId("node-editor-panel")).toBeVisible();
    await expect(page.getByTestId("editor-panel-header")).toContainText(
      "Project Brief",
    );

    await page.getByTestId("editor-close-panel").click();
    await expect(page.getByTestId("node-editor-panel")).toBeHidden();
  });

  test("supports import-first documentation, task reconciliation, and summary provenance", async ({
    page,
  }) => {
    const projectName = `Import Flow ${Date.now()}`;
    await createProject(page, { name: projectName, template: "full" });

    await importBriefNode(
      page,
      [
        "# Monthly reporting workspace",
        "",
        "## Background",
        "A client-facing reporting flow for finance teams.",
        "",
        "## Scope",
        "- Monthly reporting",
      ].join("\n"),
    );

    await importStructuredNode(
      page,
      "requirements",
      [
        "[FR] [Must] User can generate monthly reports | Reporting | Monthly reporting",
        "[NFR] [Should] Response time below target | Performance | | p95 latency | 200ms",
      ].join("\n"),
    );

    await openWorkspaceCommandMenu(page);
    await page.getByTestId("workspace-command-search").fill("task board");
    await page.getByTestId("workspace-command-node-task_board").click();
    await expect(page.getByTestId("task-board-editor")).toBeVisible();

    await page.getByTestId("task-board-import").click();
    await expect(page.getByTestId("task-backlog-import-dialog")).toBeVisible();
    await page
      .getByTestId("task-backlog-textarea")
      .fill(
        [
          "id,title,description,priority,status",
          'JIRA-22,"Backfill analytics export","Import legacy analytics export into backlog",Low,Todo',
        ].join("\n"),
      );
    await page.getByTestId("task-backlog-parse").click();
    await page.getByTestId("task-backlog-apply").click();
    await expect(page.getByTestId("task-backlog-import-dialog")).toBeHidden();
    await expect(page.getByTestId("task-board-summary-imported")).toContainText(
      "1",
    );

    await openWorkspaceCommandMenu(page);
    await page.getByTestId("workspace-command-search").fill("summary");
    await page.getByTestId("workspace-command-node-summary").click();
    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(summaryEditor).toContainText(/Blueprint Empty|Imported nodes/);
  });

  test("returns to dashboard and deletes a project", async ({ page }) => {
    const projectName = `Delete Me ${Date.now()}`;
    await createProject(page, { name: projectName, template: "quick" });

    await returnToDashboard(page);

    const projectCard = page.locator(`[data-project-name="${projectName}"]`).first();
    await expect(projectCard).toBeVisible();
    await projectCard.getByRole("button", { name: new RegExp(`Delete ${projectName}`) }).click();

    await page.getByRole("button", { name: /^delete project$/i }).click();
    await expect(projectCard).toBeHidden({ timeout: 15000 });
  });
});
