import { expect, test } from "@playwright/test";

import {
  createProject,
  dismissWorkspaceOnboarding,
  openNode,
  openWorkspaceCommandMenu,
} from "./helpers/app";

test.describe("Previo accessibility smoke", () => {
  test("keeps dashboard create flow accessible by role and label", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    await expect(page.getByTestId("dashboard-screen")).toBeVisible();

    const createProjectButton = page.getByRole("button", {
      name: /create project|new project/i,
    });
    await expect(createProjectButton.first()).toBeVisible();
    await createProjectButton.first().click();

    const dialog = page.getByTestId("create-project-dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /create new project/i }),
    ).toBeVisible();
    await expect(dialog.getByLabel(/project name/i)).toBeVisible();
    await expect(dialog.getByTestId("template-option-quick")).toBeVisible();
    await expect(dialog.getByTestId("template-option-full")).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /create workspace/i }),
    ).toBeVisible();
  });

  test("opens command menu from keyboard and preserves searchable focus", async ({
    page,
  }) => {
    await createProject(page, {
      name: `A11y Command ${Date.now()}`,
      template: "full",
    });

    await openWorkspaceCommandMenu(page);
    const commandSearch = page.getByTestId("workspace-command-search");
    await expect(commandSearch).toBeFocused();
    await commandSearch.fill("validation");
    await expect(
      page.getByTestId("workspace-command-action-validation"),
    ).toBeVisible();
    await page.getByTestId("workspace-command-action-validation").click();
    await expect(page.getByTestId("validation-summary-panel")).toBeVisible();
  });

  test("renders summary as a review surface without manual-only actions", async ({
    page,
  }) => {
    await createProject(page, {
      name: `A11y Summary ${Date.now()}`,
      template: "quick",
    });

    await dismissWorkspaceOnboarding(page);
    await openNode(page, "summary", "summary-editor");

    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(summaryEditor.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.getByTestId("node-source-manual-action")).toHaveCount(0);
    await expect(page.getByTestId("node-source-import")).toHaveCount(0);
  });
});
