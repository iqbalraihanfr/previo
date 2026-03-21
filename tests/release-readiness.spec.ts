import { expect, test } from "@playwright/test";

import {
  createProject,
  importNode,
  markCurrentNodeDone,
  openNode,
  openWorkspaceCommandMenu,
} from "./helpers/app";

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
      await openNode(page, "project_brief");
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

        await importNode(
          page,
          "requirements",
          "[FR] [Must] User can publish reports | Reporting | Publish flow",
        );
        await markCurrentNodeDone(page);

        await importNode(
          page,
          "user_stories",
          "As an analyst, I want to publish a report, so that stakeholders can review findings",
        );
        await markCurrentNodeDone(page);

        await openNode(page, "summary", "summary-editor");
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
