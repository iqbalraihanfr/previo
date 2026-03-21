import { expect, test } from "@playwright/test";

import {
  createProject,
  dismissWorkspaceOnboarding,
  openWorkspaceCommandMenu,
} from "./helpers/app";

async function openWorkspaceNode(
  page: import("@playwright/test").Page,
  nodeType: "requirements" | "summary",
  panelTestId: "node-editor-panel" | "summary-editor" = "node-editor-panel",
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

async function importStructuredNode(
  page: import("@playwright/test").Page,
  nodeType: "requirements",
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

test.describe("Previo production smoke", () => {
  test("creates a project, imports canonical data, and opens summary on production build", async ({
    page,
  }) => {
    const projectName = `Prod Smoke ${Date.now()}`;
    await createProject(page, { name: projectName, template: "quick" });

    await importStructuredNode(
      page,
      "requirements",
      [
        "[FR] [Must] User can import structured notes | Import | Project brief upload",
        "[FR] [Should] User can review normalized content | Review | Workspace review",
        "[FR] [Could] User can export markdown snapshots | Export | Handoff bundle",
        "[NFR] [Should] Summary loads in under target | Performance | | response time | 200ms",
      ].join("\n"),
    );

    await openWorkspaceCommandMenu(page);
    await page.getByTestId("workspace-command-search").fill("summary");
    await page.getByTestId("workspace-command-node-summary").click();
    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(summaryEditor).toContainText(
      /Delivery framing|Blueprint Empty/,
    );

    await page.getByTestId("workspace-export-trigger").click();
    const [markdownDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("workspace-export-markdown").click(),
    ]);

    expect(markdownDownload.suggestedFilename()).toBe(
      `${projectName}-Documentation.md`,
    );
  });
});
