import { expect, test, type Page } from "@playwright/test";

import {
  createProject,
  dismissWorkspaceOnboarding,
  openWorkspaceCommandMenu,
} from "./helpers/app";

async function openWorkspaceNode(
  page: Page,
  nodeType: "project_brief" | "requirements" | "summary",
  panelTestId: "node-editor-panel" | "summary-editor" = "node-editor-panel",
) {
  await dismissWorkspaceOnboarding(page);

  const fitViewButton = page.getByTestId("workspace-fit-view");
  if (await fitViewButton.isVisible().catch(() => false)) {
    await fitViewButton.click();
  }

  const node = page.getByTestId(`workspace-node-${nodeType}`).first();
  await node.waitFor({ state: "attached", timeout: 30000 });
  await node.click({ force: true });

  if (panelTestId === "summary-editor") {
    await expect(page.getByTestId(panelTestId)).toBeVisible({ timeout: 15000 });
    return;
  }

  await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
    "data-node-type",
    nodeType,
    { timeout: 15000 },
  );
}

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
    await expect(page.getByTestId("summary-editor")).toHaveScreenshot(
      "summary-empty-state.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });
});
