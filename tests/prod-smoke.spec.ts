import { readFile } from "node:fs/promises";
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
    "Requirements doc",
    { timeout: 15000 },
  );
  await expect(
    page.getByTestId("editor-panel-header").getByText("Saved", { exact: true }),
  ).toBeVisible({ timeout: 15000 });
}

test.describe("Previo production smoke", () => {
  test("creates a project, imports canonical data, and opens summary on production build", async ({
    page,
  }) => {
    test.setTimeout(60_000);
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

    await page.reload();
    await openWorkspaceNode(page, "requirements");
    await page.getByTestId("node-source-provenance-toggle").click();
    await expect(page.getByText("Imported source", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByTestId("editor-mode-editing").click();
    const definitions = page
      .getByTestId("node-editor-panel")
      .getByPlaceholder("State the requirement clearly and concisely...");
    await expect(definitions).toHaveCount(3);
    await expect(definitions.nth(0)).toHaveValue("User can import structured notes");
    await expect(definitions.nth(1)).toHaveValue("User can review normalized content");
    await expect(definitions.nth(2)).toHaveValue("User can export markdown snapshots");
    await page.getByRole("tab", { name: "Quality Attributes", exact: true }).click();
    await expect(definitions).toHaveCount(1);
    await expect(definitions.first()).toHaveValue("Summary loads in under target");
    await expect(page.getByPlaceholder("e.g. Latency, Uptime...")).toHaveValue("response time");
    await expect(page.getByPlaceholder("e.g. < 200ms, 99.9%...")).toHaveValue("200ms");

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
    const downloadPath = await markdownDownload.path();
    if (!downloadPath) throw new Error("Markdown download has no local path.");
    const markdown = await readFile(downloadPath, "utf8");
    for (const row of [
      "- [Must] User can import structured notes",
      "- [Should] User can review normalized content",
      "- [Could] User can export markdown snapshots",
      "- [Should] Summary loads in under target",
    ]) {
      expect(markdown).toContain(row);
    }
  });
});
