import { test, expect } from "@playwright/test";

import {
  createProject,
  importNode,
  markCurrentNodeDone,
  openNode,
  returnToDashboard,
} from "./helpers/app";

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

    await importNode(
      page,
      "requirements",
      [
        "[FR] [Must] User can generate monthly reports | Reporting | Monthly reporting",
        "[NFR] [Should] Response time below target | Performance | | p95 latency | 200ms",
      ].join("\n"),
    );
    await markCurrentNodeDone(page);

    await importNode(
      page,
      "user_stories",
      [
        "id,story,acceptance_criteria,related_requirement",
        'US-1,"As a finance admin, I want generate monthly reports, so that close-out is faster","Given there is accounting data||When I request a report||Then the report is generated",req-1',
      ].join("\n"),
    );
    await markCurrentNodeDone(page);

    await openNode(page, "use_cases");
    await page.getByTestId("node-source-generate").click();
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "Generated draft",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("node-editor-panel")).toContainText(
      "finance admin",
    );
    await markCurrentNodeDone(page);

    await importNode(
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
    await markCurrentNodeDone(page);

    await openNode(page, "task_board", "task-board-editor");
    await expect(page.getByTestId("task-board-editor")).toBeVisible();
    await expect
      .poll(
        async () => {
          const totalTaskSummary =
            (await page.getByTestId("task-board-summary-total").textContent()) ??
            "";
          return Number(totalTaskSummary.match(/Total tasks\s*(\d+)/i)?.[1] ?? "0");
        },
        { timeout: 15000 },
      )
      .toBeGreaterThan(0);

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

    await openNode(page, "summary", "summary-editor");
    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(summaryEditor).toContainText("Delivery framing");
    await expect(summaryEditor).toContainText("Agile");
    await expect(summaryEditor).toContainText("Imported nodes");
    await expect(summaryEditor).toContainText("Generated nodes");
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
