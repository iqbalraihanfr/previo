import { expect, test } from "@playwright/test";

import { createProject, importNode, openNode } from "./helpers/app";

test.describe("Previo phase 3 workspace QA", () => {
  test("supports command menu actions and node search/jump", async ({ page }) => {
    await createProject(page, {
      name: `Command QA ${Date.now()}`,
      template: "full",
    });

    await page.getByTestId("workspace-command-dialog").click();
    await expect(page.getByTestId("workspace-command-menu")).toBeVisible();

    const commandSearch = page.getByTestId("workspace-command-search");
    await commandSearch.fill("validation");
    await page.getByTestId("workspace-command-action-validation").click();
    await expect(page.getByTestId("validation-summary-panel")).toBeVisible();

    await page.getByLabel("Close validation panel").click();
    await expect(page.getByTestId("validation-summary-panel")).toBeHidden();

    await page.getByTestId("workspace-command-dialog").click();
    await expect(page.getByTestId("workspace-command-menu")).toBeVisible();
    await commandSearch.fill("project brief");
    await page.getByTestId("workspace-command-node-project_brief").click();
    await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
      "data-node-type",
      "project_brief",
    );
  });

  test("filters validation issues and navigates back to the affected node", async ({
    page,
  }) => {
    await createProject(page, {
      name: `Validation QA ${Date.now()}`,
      template: "quick",
    });

    await openNode(page, "project_brief");
    await page.getByTestId("node-source-manual-action").click();
    await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
      "data-editor-mode",
      "editing",
    );
    await expect(page.getByTestId("editor-section-nav")).toBeVisible();
    await page
      .getByPlaceholder(
        "Why does this project exist? What terminal problem are we solving?",
      )
      .fill("Create enough context to trigger cross-node validation.");
    await expect(page.getByTestId("editor-panel-header")).toContainText("Saved", {
      timeout: 15000,
    });

    await page.getByTestId("workspace-validation").click();
    const validationPanel = page.getByTestId("validation-summary-panel");
    await expect(validationPanel).toBeVisible();
    await expect(validationPanel).toContainText(
      "No requirements have been defined for the project.",
    );

    await page.getByTestId("validation-filter-toggle").click();
    await page.getByTestId("validation-filter-severity-error").click();
    await expect(page.getByTestId("validation-issue-error")).toHaveCount(1);

    await page.getByTestId("validation-search").fill("REQ-EMPTY");
    await expect(validationPanel).toContainText("Rule: REQ-EMPTY");
    await page.getByRole("button", { name: /open requirements/i }).click();
    await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
      "data-node-type",
      "requirements",
    );
  });

  test("exports project artifacts and task board artifacts", async ({ page }) => {
    const projectName = `Export QA ${Date.now()}`;
    await createProject(page, {
      name: projectName,
      template: "quick",
    });

    await page.getByTestId("workspace-export-trigger").click();
    const [markdownDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("workspace-export-markdown").click(),
    ]);
    await expect(markdownDownload.suggestedFilename()).toBe(
      `${projectName}-Documentation.md`,
    );

    await page.getByTestId("workspace-export-trigger").click();
    const [pdfDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("workspace-export-pdf").click(),
    ]);
    await expect(pdfDownload.suggestedFilename()).toBe(
      `${projectName}-Documentation.pdf`,
    );

    await openNode(page, "task_board", "task-board-editor");
    await page.getByTestId("task-board-add-task").click();
    await page.getByTestId("task-board-export-trigger").click();
    const [jsonDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("task-board-export-json").click(),
    ]);
    await expect(jsonDownload.suggestedFilename()).toBe("Previo-tasks.json");
  });

  test("shows structured traceability links and imported provenance", async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.route("**/api/ai/import-document", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          fields: {
            name: "Traceable Workspace",
            background: "Imported brief for traceability.",
            target_users: ["Customer"],
            scope_in: ["Self-service signup"],
            objectives: ["Launch a traced workflow"],
          },
        },
      });
    });

    await createProject(page, {
      name: `Traceability QA ${Date.now()}`,
      template: "quick",
    });

    await importNode(
      page,
      "project_brief",
      "Traceability fixture for the workspace panel.",
    );

    await importNode(
      page,
      "requirements",
      "[FR] [Must] Allow sign up via email | Authentication | Self-service signup",
    );

    await page.getByTestId("workspace-traceability").click();
    const traceabilityPanel = page.getByTestId("workspace-traceability-panel");
    await expect(traceabilityPanel).toBeVisible();
    await expect(traceabilityPanel).toContainText("Brief to requirements");
    await expect(traceabilityPanel).toContainText("Self-service signup");
    await expect(traceabilityPanel).toContainText("Allow sign up via email");
    await expect(traceabilityPanel).toContainText("Imported brief");
    await expect(traceabilityPanel).toContainText("Brief document");
  });
});
