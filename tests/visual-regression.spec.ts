import { expect, test } from "@playwright/test";

import {
  createProject,
  openWorkspaceCommandMenu,
  openWorkspaceNode,
} from "./helpers/app";

test.describe("Previo visual regression", () => {
  test("matches the project brief entry-state card", async ({ page }) => {
    await createProject(page, {
      name: `Visual Brief ${Date.now()}`,
      template: "quick",
    });

    await openWorkspaceNode(page, "project_brief");
    await expect(page.getByTestId("editor-entry-state")).toHaveScreenshot(
      "project-brief-entry-state.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 20,
      },
    );
  });

  test("matches the requirements import-first entry-state card", async ({
    page,
  }) => {
    await createProject(page, {
      name: `Visual Requirements ${Date.now()}`,
      template: "full",
    });

    await openWorkspaceCommandMenu(page);
    await page.getByTestId("workspace-command-search").fill("requirements");
    await page.getByTestId("workspace-command-node-requirements").click();
    await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
      "data-node-type",
      "requirements",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("editor-entry-state")).toHaveScreenshot(
      "requirements-entry-state.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 20,
      },
    );
  });

  test("matches the empty summary review surface", async ({ page }) => {
    await createProject(page, {
      name: `Visual Summary ${Date.now()}`,
      template: "quick",
    });

    await openWorkspaceCommandMenu(page);
    await page.getByTestId("workspace-command-search").fill("summary");
    await page.getByTestId("workspace-command-node-summary").click();
    await expect(page.getByTestId("summary-editor")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("summary-empty-state")).toHaveScreenshot(
      "summary-empty-state.png",
      {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 20,
      },
    );
  });
});
