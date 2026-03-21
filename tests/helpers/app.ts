import { expect, type Page } from "@playwright/test";
import type { ProjectDomain, StarterContentIntensity } from "@/lib/db";

export async function dismissWorkspaceOnboarding(page: Page) {
  const onboarding = page.getByTestId("workspace-onboarding");
  const dismissButton = page.getByTestId("dismiss-workspace-onboarding");
  const onboardingVisible = await onboarding
    .waitFor({ state: "visible", timeout: 4000 })
    .then(() => true)
    .catch(() => false);

  if (onboardingVisible && (await dismissButton.isVisible().catch(() => false))) {
    await dismissButton.click();
    await onboarding.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
  }
}

export async function openWorkspaceCommandMenu(page: Page) {
  const commandMenu = page.getByTestId("workspace-command-menu");

  await page.keyboard.press("Control+K").catch(() => {});
  const openedWithControl = await commandMenu
    .waitFor({ state: "visible", timeout: 2000 })
    .then(() => true)
    .catch(() => false);

  if (openedWithControl) {
    return;
  }

  await page.keyboard.press("Meta+K").catch(() => {});
  const openedWithMeta = await commandMenu
    .waitFor({ state: "visible", timeout: 2000 })
    .then(() => true)
    .catch(() => false);

  if (openedWithMeta) {
    return;
  }

  await page.getByTestId("workspace-command-dialog").click();
  await expect(commandMenu).toBeVisible({ timeout: 5000 });
}

export async function returnToDashboard(page: Page) {
  await page.goto("/", { waitUntil: "load" });
  await expect(page).toHaveURL(/\/$/, { timeout: 15000 });
  await expect(page.getByTestId("dashboard-screen")).toBeVisible({
    timeout: 15000,
  });
}

export async function createProject(
  page: Page,
  params: {
    name: string;
    template?: "quick" | "full";
    deliveryMode?: "agile" | "waterfall" | "hybrid";
    domain?: ProjectDomain;
    starterContentIntensity?: StarterContentIntensity;
  },
) {
  let dashboardReady = false;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto("/", { waitUntil: "load" });
      await expect(page.getByTestId("dashboard-screen")).toBeVisible({
        timeout: 15000,
      });
      dashboardReady = true;
      break;
    } catch (error) {
      if (attempt === 2) {
        throw error;
      }
      await page.waitForTimeout(1000);
    }
  }

  expect(dashboardReady).toBeTruthy();

  const createDialog = page.getByTestId("create-project-dialog");
  const openDialogTriggers = [
    page.getByRole("button", { name: /^create project$/i }),
    page.getByRole("button", { name: /^new project$/i }),
    page.getByTestId("dashboard-empty-new-project"),
    page.getByTestId("dashboard-new-project"),
  ];

  let dialogOpened = false;
  for (let attempt = 0; attempt < 2 && !dialogOpened; attempt += 1) {
    for (const trigger of openDialogTriggers) {
      if (!(await trigger.isVisible().catch(() => false))) {
        continue;
      }

      await trigger.click({ timeout: 2000 }).catch(async () => {
        if (page.isClosed()) return;
        await trigger.click({ force: true, timeout: 1000 }).catch(() => {});
      });
      const isVisible = await createDialog
        .waitFor({ state: "visible", timeout: 4000 })
        .then(() => true)
        .catch(() => false);

      if (isVisible) {
        dialogOpened = true;
        break;
      }
    }
  }

  expect(dialogOpened).toBeTruthy();
  await expect(createDialog).toBeVisible({ timeout: 15000 });

  await createDialog.getByLabel(/project name/i).fill(params.name);
  await createDialog.getByTestId("create-project-next").click();

  const workflow = params.template ?? "quick";
  await expect(createDialog.getByTestId(`workflow-option-${workflow}`)).toBeVisible();
  if (workflow !== "quick") {
    await createDialog.getByTestId(`workflow-option-${workflow}`).click();
  }

  await createDialog.getByTestId("create-project-next").click();

  if (params.deliveryMode && params.deliveryMode !== "agile") {
    await createDialog.getByTestId("delivery-mode-trigger").click();
    await page
      .getByRole("option", {
        name:
          params.deliveryMode === "waterfall"
            ? /^waterfall$/i
            : /^hybrid$/i,
      })
      .click();
  }

  await createDialog.getByTestId("create-project-next").click();

  const domain = params.domain ?? "general";
  if (domain !== "general") {
    await createDialog.getByTestId("project-domain-trigger").click();
    await page
      .getByRole("option", {
        name:
          domain === "saas"
            ? /^saas$/i
            : domain === "ecommerce"
              ? /^ecommerce$/i
              : domain === "mobile_web"
                ? /^mobile web$/i
                : domain === "internal_tool"
                  ? /^internal tool$/i
                  : domain === "marketplace"
                    ? /^marketplace$/i
                    : /^content platform$/i,
      })
      .click();
  }

  const starterContentIntensity = params.starterContentIntensity ?? "none";
  if (starterContentIntensity !== "none") {
    await createDialog
      .getByTestId(`intensity-option-${starterContentIntensity}`)
      .click();
  }

  await createDialog.getByTestId("create-workspace-submit").click();
  const workspaceHeader = page.getByTestId("workspace-header");
  const workspaceScreen = page.getByTestId("workspace-screen");
  const dashboardScreen = page.getByTestId("dashboard-screen");
  const reachedWorkspace = await Promise.any([
    page.waitForURL(/\/workspace\//, { timeout: 10000 }).then(() => true),
    workspaceHeader.waitFor({ state: "visible", timeout: 10000 }).then(() => true),
    workspaceScreen.waitFor({ state: "visible", timeout: 10000 }).then(() => true),
  ]).catch(() => false);

  const isWorkspaceReady =
    reachedWorkspace ||
    /\/workspace\//.test(page.url()) ||
    (await workspaceHeader.isVisible().catch(() => false)) ||
    (await workspaceScreen.isVisible().catch(() => false));

  if (!isWorkspaceReady) {
    const stillOnDashboard = await dashboardScreen
      .waitFor({ state: "visible", timeout: 10000 })
      .then(() => true)
      .catch(() => false);

    if (stillOnDashboard) {
      const projectCard = page.locator(
        `[data-project-name="${params.name}"]`,
      ).first();
      const recentContinue = page.getByTestId("recent-project-continue");

      const openedFromCard = await projectCard
        .waitFor({ state: "visible", timeout: 30000 })
        .then(async () => {
          const continueButton = projectCard.getByRole("button", {
            name: /continue/i,
          });

          if (await continueButton.isVisible().catch(() => false)) {
            await continueButton.click();
          } else {
            await projectCard.click();
          }

          return true;
        })
        .catch(() => false);

      if (!openedFromCard && (await recentContinue.isVisible().catch(() => false))) {
        await recentContinue.click();
      }
    }
  }

  await expect(page).toHaveURL(/\/workspace\//, { timeout: 30000 });

  try {
    await expect(page.getByTestId("workspace-screen")).toBeVisible({
      timeout: 10000,
    });
  } catch {
    await expect(page.getByTestId("workspace-header")).toBeVisible({
      timeout: 10000,
    });
  }
  await expect(page.getByTestId("workspace-header")).toContainText(params.name);

  await dismissWorkspaceOnboarding(page);
}

export async function openNode(
  page: Page,
  nodeType: string,
  panelTestId = "node-editor-panel",
) {
  await dismissWorkspaceOnboarding(page);

  const openEditorPanel = page.getByTestId("node-editor-panel");
  const currentEditorType = await openEditorPanel
    .getAttribute("data-node-type")
    .catch(() => null);

  if (currentEditorType && currentEditorType !== nodeType) {
    const closeButton = page.getByTestId("editor-close-panel");
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
      await openEditorPanel.waitFor({ state: "hidden", timeout: 10000 }).catch(() => {});
    }
  }

  const fitViewButton = page.getByTestId("workspace-fit-view");
  if (await fitViewButton.isVisible().catch(() => false)) {
    await fitViewButton.click();
    await page.waitForTimeout(250);
  }

  await Promise.any([
    page.getByTestId("workspace-header").waitFor({ state: "visible", timeout: 15000 }),
    page.getByTestId("workspace-canvas").waitFor({ state: "visible", timeout: 15000 }),
  ]);
  const node = page.getByTestId(`workspace-node-${nodeType}`).first();
  await node.waitFor({ state: "attached", timeout: 30000 });
  await node.scrollIntoViewIfNeeded().catch(() => {});
  const panel = page.getByTestId(panelTestId);
  const assertPanel = async (timeout: number) => {
    if (panelTestId === "node-editor-panel") {
      await expect(panel).toHaveAttribute("data-node-type", nodeType, {
        timeout,
      });
      return;
    }

    await expect(panel).toBeVisible({ timeout });
  };

  const openAttempts = [
    async () => {
      await node.click({ position: { x: 160, y: 40 } });
    },
    async () => {
      await node.click({ position: { x: 120, y: 72 }, force: true });
    },
    async () => {
      await node.dblclick({ position: { x: 160, y: 40 } });
    },
    async () => {
      await node.evaluate((element) => {
        (element as HTMLElement).click();
      });
    },
  ];

  let opened = false;
  for (const attempt of openAttempts) {
    try {
      await attempt();
      await assertPanel(3000);
      opened = true;
      break;
    } catch {
      // Try the next interaction pattern.
    }
  }

  if (!opened) {
    await assertPanel(10000);
  }
}

export async function importNode(page: Page, nodeType: string, rawContent: string) {
  await openNode(page, nodeType);
  await page.getByTestId("node-source-import").click();
  await expect(page.getByTestId("source-import-dialog")).toBeVisible();
  await page.getByTestId("source-import-textarea").fill(rawContent);
  await page.getByTestId("source-import-parse").click();
  await expect(page.getByTestId("source-import-apply")).toBeVisible({
    timeout: 15000,
  });
  await page.getByTestId("source-import-apply").click();
  await expect(page.getByTestId("source-import-dialog")).toBeHidden();
  await expect(page.getByTestId("node-source-toolbar")).toContainText(
    "Imported source",
    { timeout: 15000 },
  );
}

export async function openProjectNotes(page: Page) {
  await page.getByTestId("workspace-project-notes").click();
  await expect(page.getByTestId("project-notes-panel")).toBeVisible({
    timeout: 15000,
  });
}

export async function markCurrentNodeDone(page: Page) {
  const statusTrigger = page.getByTestId("editor-status-trigger");
  await statusTrigger.scrollIntoViewIfNeeded().catch(() => {});
  await statusTrigger.click({ timeout: 3000 }).catch(async () => {
    if (page.isClosed()) return;
    await statusTrigger.click({ force: true, timeout: 1000 }).catch(() => {});
  });
  await page.getByRole("option", { name: /^done$/i }).click();
  await expect(page.getByTestId("editor-panel-header")).toContainText("Done");
}
