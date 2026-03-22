import { expect, test, type Page } from "@playwright/test";

import {
  createProject,
  markCurrentNodeDone,
  openWorkspaceCommandMenu,
  openWorkspaceNode,
} from "./helpers/app";

async function importStructuredNode(
  page: Page,
  nodeType: "requirements" | "user_stories",
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
    "Imported source",
    { timeout: 15000 },
  );
}

test.describe("Previo release readiness", () => {
  test.describe("mobile usability", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("keeps the workspace usable on mobile for a core documentation flow", async ({
      page,
    }) => {
      const projectName = `Mobile QA ${Date.now()}`;
      await createProject(page, {
        name: projectName,
        template: "quick",
      });

      await expect(page.getByTestId("workspace-header")).toContainText(projectName);
      await openWorkspaceNode(page, "project_brief");
      await page.getByTestId("node-source-manual-action").click();
      await expect(page.getByTestId("node-editor-panel")).toHaveAttribute(
        "data-editor-mode",
        "editing",
      );

      await page
        .getByPlaceholder(
          "Why does this project exist? What terminal problem are we solving?",
        )
        .fill("Mobile flow should stay readable and operable.");
      await expect(page.getByTestId("editor-panel-header")).toContainText(
        "Saved",
        {
          timeout: 15000,
        },
      );

      await openWorkspaceCommandMenu(page);
      await page.getByTestId("workspace-command-search").fill("summary");
      await page.getByTestId("workspace-command-node-summary").click();
      await expect(page.getByTestId("summary-editor")).toBeVisible();
    });
  });

  test.describe("desktop synthesis loop", () => {
    test("covers a pre-release synthesis loop from import to summary", async ({
      page,
    }) => {
        await createProject(page, {
          name: `Release Loop ${Date.now()}`,
          template: "full",
        });

        await importStructuredNode(
          page,
          "requirements",
          "[FR] [Must] User can publish reports | Reporting | Publish flow",
        );
        await markCurrentNodeDone(page);

        await importStructuredNode(
          page,
          "user_stories",
          "As an analyst, I want to publish a report, so that stakeholders can review findings",
        );
        await markCurrentNodeDone(page);

        await openWorkspaceNode(page, "summary", "summary-editor");
        await expect(page.getByTestId("summary-editor")).toContainText(
          "Documentation Incomplete",
          {
            timeout: 15000,
          },
        );
        await expect(page.getByTestId("summary-editor")).toContainText("Imported nodes");
        await expect(page.getByTestId("summary-editor")).toContainText("Requirements");
      },
    );
  });
});
