import { expect, test } from "@playwright/test";

import { createProject, importNode, markCurrentNodeDone, openNode } from "./helpers/app";

test.describe("Previo production smoke", () => {
  test("creates a project, imports canonical data, and opens summary on production build", async ({
    page,
  }) => {
    const projectName = `Prod Smoke ${Date.now()}`;
    await createProject(page, { name: projectName, template: "quick" });

    await importNode(
      page,
      "requirements",
      [
        "[FR] [Must] User can import structured notes | Import | Project brief upload",
        "[FR] [Should] User can review normalized content | Review | Workspace review",
        "[FR] [Could] User can export markdown snapshots | Export | Handoff bundle",
        "[NFR] [Should] Summary loads in under target | Performance | | response time | 200ms",
      ].join("\n"),
    );
    await markCurrentNodeDone(page);

    await openNode(page, "summary", "summary-editor");
    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(summaryEditor).toContainText("Delivery framing");

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
