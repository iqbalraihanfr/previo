import { expect, test, type Page } from "@playwright/test";

import {
  createProject,
  dismissWorkspaceOnboarding,
  openWorkspaceCommandMenu,
} from "./helpers/app";

test.describe.configure({ timeout: 90000 });

async function openWorkspaceNode(
  page: Page,
  nodeType: "summary",
  panelTestId: "summary-editor" = "summary-editor",
) {
  await dismissWorkspaceOnboarding(page);

  const fitViewButton = page.getByTestId("workspace-fit-view");
  if (await fitViewButton.isVisible().catch(() => false)) {
    await fitViewButton.click();
  }

  const node = page.getByTestId(`workspace-node-${nodeType}`).first();
  await node.waitFor({ state: "attached", timeout: 30000 });
  await node.click({ force: true });
  await expect(page.getByTestId(panelTestId)).toBeVisible({ timeout: 15000 });
}

test.describe("Previo accessibility smoke", () => {
  test("keeps dashboard create flow accessible by role and label", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });
    await expect(page.getByTestId("dashboard-screen")).toBeVisible();

    await expect(
      page.getByRole("button", { name: /create project|new project/i }).first(),
    ).toBeVisible();
    await page.getByTestId("dashboard-new-project").click();

    const dialog = page.getByTestId("create-project-dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: /create new project/i }),
    ).toBeVisible();
    await expect(dialog.getByLabel(/project name/i)).toBeVisible();
    await expect(dialog.getByTestId("create-project-step-basics")).toBeVisible();
    await expect(dialog.getByTestId("create-project-step-advanced")).toBeVisible();
    await expect(dialog.getByTestId("workflow-option-quick")).toHaveCount(0);
    await dialog.getByLabel(/project name/i).fill(`A11y ${Date.now()}`);
    await dialog.getByTestId("create-project-next").click();
    await expect(dialog.getByTestId("workflow-option-quick")).toBeVisible();
    await expect(dialog.getByTestId("workflow-option-full")).toBeVisible();
    await dialog.getByTestId("create-project-next").click();
    await dialog.getByTestId("create-project-next").click();
    await expect(dialog.getByTestId("project-domain-trigger")).toBeVisible();
    await expect(dialog.getByTestId("intensity-option-none")).toBeVisible();
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

    await openWorkspaceNode(page, "summary");

    const summaryEditor = page.getByTestId("summary-editor");
    await expect(summaryEditor).toBeVisible();
    await expect(summaryEditor.getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.getByTestId("node-source-manual-action")).toHaveCount(0);
    await expect(page.getByTestId("node-source-import")).toHaveCount(0);
  });
});
