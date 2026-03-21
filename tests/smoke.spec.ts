import { test, expect, type Page } from "@playwright/test";

import {
  createProject,
  dismissWorkspaceOnboarding,
  openWorkspaceCommandMenu,
  returnToDashboard,
} from "./helpers/app";

async function openWorkspaceNode(
  page: Page,
  nodeType:
    | "requirements"
    | "user_stories"
    | "use_cases"
    | "erd"
    | "task_board"
    | "summary",
  panelTestId: "node-editor-panel" | "task-board-editor" | "summary-editor" =
    "node-editor-panel",
) {
  await dismissWorkspaceOnboarding(page);

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

  if (panelTestId === "task-board-editor" || panelTestId === "summary-editor") {
    await expect(page.getByTestId(panelTestId)).toBeVisible({ timeout: 15000 });
    return;
  }

  await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
    "data-node-type",
    nodeType,
    { timeout: 15000 },
  );
}

async function importStructuredNode(
  page: Page,
  nodeType: "requirements" | "user_stories" | "erd",
  rawContent: string,
) {
  await openWorkspaceNode(page, nodeType);
  await page.getByTestId("node-source-import").click();
  await expect(page.getByTestId("source-import-dialog")).toBeVisible();
  await page.getByTestId("source-import-textarea").fill(rawContent);
  await page.getByTestId("source-import-parse").click({ force: true });
  await page.getByTestId("source-import-apply").click();
  await expect(page.getByTestId("source-import-dialog")).toBeHidden({
    timeout: 15000,
  });
  await expect(page.getByTestId("editor-panel-header")).toContainText("Saved", {
    timeout: 15000,
  });
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

    await importStructuredNode(
      page,
      "requirements",
      [
        "[FR] [Must] User can generate monthly reports | Reporting | Monthly reporting",
        "[NFR] [Should] Response time below target | Performance | | p95 latency | 200ms",
      ].join("\n"),
    );

    await importStructuredNode(
      page,
      "user_stories",
      [
        "id,story,acceptance_criteria,related_requirement",
        'US-1,"As a finance admin, I want generate monthly reports, so that close-out is faster","Given there is accounting data||When I request a report||Then the report is generated",req-1',
      ].join("\n"),
    );

    await openWorkspaceNode(page, "use_cases");
    await page.getByTestId("node-source-generate").click();
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "Generated draft",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("node-editor-panel")).toContainText(
      "finance admin",
    );

    await importStructuredNode(
      page,
      "erd",
      [
        "Table reports {",
        "  id uuid [pk]",
        "  owner_id uuid",
        "}",
        "",
        "Table users {",
        "  id uuid [pk]",
        "}",
        "",
        "Ref: reports.owner_id > users.id",
      ].join("\n"),
    );
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "DBML schema",
    );

    await openWorkspaceCommandMenu(page);
    await page.getByTestId("workspace-command-search").fill("task board");
    await page.getByTestId("workspace-command-node-task_board").click();
    await expect(page.getByTestId("task-board-editor")).toBeVisible();
    await expect(page.getByTestId("task-board-summary-total")).toContainText(
      /[1-9]\d*/,
      { timeout: 15000 },
    );

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
