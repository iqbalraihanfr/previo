import { test, expect, type Page } from "@playwright/test";

import { createProject, dismissWorkspaceOnboarding } from "./helpers/app";

async function openWorkspaceNode(
  page: Page,
  nodeType: "project_brief" | "requirements" | "use_cases" | "summary",
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
  page: Page,
  nodeType: "requirements",
  rawContent: string,
) {
  await openWorkspaceNode(page, nodeType);
  await page.getByTestId("node-source-import").click();
  await expect(page.getByTestId("source-import-dialog")).toBeVisible();
  await page.getByTestId("source-import-textarea").fill(rawContent);
  await page.getByTestId("source-import-parse").click();
  await page.getByTestId("source-import-apply").click();
  await expect(page.getByTestId("node-source-toolbar")).toContainText(
    "Imported source",
    { timeout: 15000 },
  );
  await expect(page.getByTestId("editor-panel-header")).toContainText("Saved", {
    timeout: 15000,
  });
}

test.describe("Previo editor UX", () => {
  test("keeps project brief manual-first while still offering import", async ({
    page,
  }) => {
    await createProject(page, {
      name: `Editor Brief ${Date.now()}`,
      template: "quick",
    });

    await openWorkspaceNode(page, "project_brief");
    await expect(page.getByTestId("editor-entry-state")).toBeVisible();
    await expect(page.getByTestId("node-source-import")).toBeVisible();
    await expect(page.getByTestId("node-source-manual-action")).toBeVisible();

    await page.getByTestId("node-source-manual-action").click();
    await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
      "data-editor-mode",
      "editing",
    );
    await expect(page.getByTestId("editor-section-nav")).toBeVisible();
  });

  test("keeps requirements import-first and preserves reference notes across mode switches", async ({
    page,
  }) => {
    await createProject(page, {
      name: `Editor Requirements ${Date.now()}`,
      template: "full",
    });

    await openWorkspaceNode(page, "requirements");
    await expect(page.getByTestId("editor-entry-state")).toBeVisible();
    await expect(page.getByTestId("node-source-import")).toBeVisible();
    await expect(page.getByTestId("node-source-manual-action")).toHaveCount(0);

    await page.getByTestId("node-source-import").click();
    await expect(page.getByTestId("source-import-dialog")).toBeVisible();
    await page
      .getByTestId("source-import-textarea")
      .fill("[FR] [Must] User can review imported requirements | Review | Imported scope");
    await page.getByTestId("source-import-parse").click();
    await page.getByTestId("source-import-apply").click();
    await expect(page.getByTestId("source-import-dialog")).toBeHidden({
      timeout: 15000,
    });
    await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
      "data-editor-mode",
      "review",
    );

    await page.getByTestId("editor-mode-editing").click();

    const referenceArea = page.getByTestId("editor-reference-area");
    await expect(referenceArea).not.toHaveAttribute("open", "");
    await page.getByTestId("editor-reference-toggle").click();
    await expect(referenceArea).toHaveAttribute("open", "");
    const notesTextarea = page.getByPlaceholder(
      "Additional context, assumptions, references, or working notes...",
    );
    await notesTextarea.fill("Reference notes should survive mode switches");

    await page.getByTestId("editor-mode-review").click();
    await expect(page.getByTestId("editor-review-panel")).toBeVisible();

    await page.getByTestId("editor-mode-editing").click();
    await expect(notesTextarea).toHaveValue(
      "Reference notes should survive mode switches",
    );

    await page.getByTestId("editor-status-trigger").click();
    await page.getByRole("option", { name: /^in progress$/i }).click();
    await expect(page.getByTestId("editor-panel-header")).toContainText(
      "In Progress",
    );
  });

  test("keeps derived-assisted nodes generate-first and shows provenance after import", async ({
    page,
  }) => {
    await createProject(page, {
      name: `Editor Derived ${Date.now()}`,
      template: "full",
    });

    await openWorkspaceNode(page, "use_cases");
    await expect(page.getByTestId("editor-entry-state")).toBeVisible();
    await expect(page.getByTestId("node-source-generate")).toBeVisible();
    await expect(page.getByTestId("node-source-manual-action")).toHaveCount(0);

    await page.getByTestId("node-source-generate").click();
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "State: Generated draft",
      { timeout: 15000 },
    );
    await expect(page.getByTestId("editor-review-panel")).toBeVisible();
    await page.getByTestId("editor-mode-editing").click();
    await expect(page.getByTestId("editor-edit-panel")).toBeVisible();

    await importStructuredNode(
      page,
      "requirements",
      "[FR] [Must] User can publish reports | Reporting | Publish flow",
    );
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "Source: Requirements doc",
    );
    await expect(page.getByTestId("node-source-toolbar")).toContainText(
      "State: Imported source",
    );
    await page.getByTestId("node-source-provenance-toggle").click();
    await expect(page.getByTestId("node-source-provenance-details")).toContainText(
      "Manual entry: review only",
    );
  });

  test("keeps summary read-only and skips manual/source entry actions", async ({
    page,
  }) => {
    await createProject(page, {
      name: `Editor Summary ${Date.now()}`,
      template: "quick",
    });

    await openWorkspaceNode(page, "summary", "summary-editor");
    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(page.getByTestId("editor-entry-state")).toHaveCount(0);
    await expect(page.getByTestId("node-source-import")).toHaveCount(0);
    await expect(page.getByTestId("node-source-manual-action")).toHaveCount(0);
    await expect(summaryEditor).toContainText("Blueprint Empty");
  });
});
