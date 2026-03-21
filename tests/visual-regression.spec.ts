import { expect, test } from "@playwright/test";

import { createProject, openNode } from "./helpers/app";

test.describe("Previo visual regression", () => {
  test("matches the project brief entry-state card", async ({ page }) => {
    await createProject(page, {
      name: `Visual Brief ${Date.now()}`,
      template: "quick",
    });

    await openNode(page, "project_brief");
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

    await openNode(page, "requirements");
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

    await openNode(page, "summary", "summary-editor");
    await expect(page.getByTestId("summary-editor")).toHaveScreenshot(
      "summary-empty-state.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });
});
