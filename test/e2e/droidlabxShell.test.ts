import { describe, test, expect } from "./baseFixture"

describe("droidlabx shell", ["--disable-workspace-trust"], {}, () => {
  test("hides the file drawer on a phone-sized viewport", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await expect(page.locator(".monaco-workbench.dlx-compact")).toBeVisible({ timeout: 30_000 })
    await expect(page.locator(".part.sidebar")).toBeHidden()
    await expect(page.locator(".part.activitybar")).toBeHidden()
    await expect(page.locator(".dlx-drawer-toggle")).toBeVisible()
  })

  test("phone drawer exposes Menu and Exit", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await expect(page.locator(".dlx-drawer-toggle")).toBeVisible({ timeout: 30_000 })
    const editorBefore = await page.locator(".part.editor").boundingBox()
    await page.locator(".dlx-drawer-toggle").click()
    await expect(page.locator(".monaco-workbench.dlx-drawer-open")).toBeVisible()
    await expect(page.locator(".part.activitybar")).toBeVisible()
    await expect(page.locator(".dlx-exit")).toBeVisible()
    await expect(page.locator(".dlx-drawer-scrim")).toBeVisible()
    await expect(page.locator(".activitybar .action-item:has(.codicon-source-control-view-icon)")).toBeHidden()
    await expect(page.locator(".activitybar .action-item:has(.codicon-settings-view-bar-icon)")).toBeHidden()
    const sidebar = await page.locator(".part.sidebar").boundingBox()
    expect(sidebar?.width ?? 0).toBeGreaterThan(180)
    expect(sidebar?.height ?? 0).toBeGreaterThan(300)
    await expect(page.locator(".part.sidebar .content")).toBeVisible()
    await page.locator(".activitybar .action-item[aria-label*='Explorer' i]").click()
    await expect(page.locator(".explorer-folders-view, .explorer-viewlet, [id='workbench.view.explorer']").first()).toBeVisible()
    const fileAction = await page.locator(".part.sidebar .title-actions .action-label").first().boundingBox()
    expect(fileAction?.width ?? 0).toBeGreaterThanOrEqual(40)
    expect(fileAction?.height ?? 0).toBeGreaterThanOrEqual(40)
    await expect(page.locator(".part.sidebar .title-actions .codicon-toolbar-more")).toBeHidden()
    const explorerIcon = await page.locator(".explorer-folders-view .monaco-icon-label").first().evaluate((el) => {
      const before = getComputedStyle(el, "::before")
      return {
        alignItems: getComputedStyle(el).alignItems,
        beforeWidth: before.width,
        beforeHeight: before.height,
        beforeBgSize: before.backgroundSize,
      }
    })
    expect(explorerIcon.alignItems).toBe("center")
    expect(explorerIcon.beforeWidth).toBe("22px")
    expect(explorerIcon.beforeHeight).toBe("22px")
    expect(explorerIcon.beforeBgSize).toMatch(/22px/)
    await page.locator(".activitybar .action-label[aria-label*='Search' i]").click()
    const searchInput = page.locator(".search-view textarea").first()
    await expect(searchInput).toBeVisible()
    const searchBox = await searchInput.boundingBox()
    expect(searchBox?.height ?? 0).toBeGreaterThanOrEqual(40)
    const searchToggle = await page.locator(".search-view .monaco-custom-toggle").first().boundingBox()
    expect(searchToggle?.width ?? 0).toBeGreaterThanOrEqual(40)
    expect(searchToggle?.height ?? 0).toBeGreaterThanOrEqual(40)
    const editorAfter = await page.locator(".part.editor").boundingBox()
    expect(editorAfter?.width ?? 0).toBeGreaterThan(300)
    expect(Math.abs((editorAfter?.width ?? 0) - (editorBefore?.width ?? 0))).toBeLessThan(8)
  })

  test("command palette is a full-screen sheet with a close control", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await expect(page.locator(".monaco-workbench.dlx-compact")).toBeVisible({ timeout: 30_000 })
    await page.keyboard.press("F1")
    await expect(page.locator(".quick-input-widget.dlx-sheet")).toBeVisible()
    await expect(page.locator(".quick-input-widget .dlx-overlay-close")).toBeVisible()
    await expect(page.locator(".quick-input-widget .quick-input-titlebar")).toBeHidden()
    const input = await page.locator(".quick-input-widget .monaco-inputbox").boundingBox()
    expect(input?.height ?? 0).toBeGreaterThanOrEqual(44)
    const close = await page.locator(".quick-input-widget .dlx-overlay-close").boundingBox()
    expect(close?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(close?.x ?? 0).toBeGreaterThan((input?.x ?? 0) + (input?.width ?? 0) - 4)
    const row = page.locator(".quick-input-list .monaco-list-row:has(.quick-input-list-entry:not(.quick-input-list-separator-as-item))").first()
    await expect(row).toBeVisible()
    const rowBox = await row.boundingBox()
    expect(rowBox?.height ?? 0).toBeGreaterThanOrEqual(68)
    await page.locator(".quick-input-widget .dlx-overlay-close").click()
    await expect(page.locator(".quick-input-widget.dlx-sheet")).toBeHidden()
  })

  test("About dialog is a full-screen sheet with close", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.keyboard.press("F1")
    await page.keyboard.type("Help: About")
    await page.keyboard.press("Enter")
    await expect(page.locator(".monaco-dialog-modal-block.dlx-sheet")).toBeVisible({ timeout: 15_000 })
    await expect(page.locator(".dialog-toolbar .dlx-overlay-close")).toBeVisible()
    await expect(page.locator(".monaco-dialog-box .dialog-message")).toBeHidden()
    const sheet = await page.locator(".monaco-dialog-modal-block.dlx-sheet .monaco-dialog-box").boundingBox()
    expect(sheet?.height ?? 0).toBeGreaterThan(400)
    const ok = await page.locator(".monaco-dialog-box .dialog-buttons .monaco-button").first().boundingBox()
    expect(ok?.height ?? 0).toBeGreaterThanOrEqual(40)
  })

  test("About dialog on tablet is a centered modal", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.keyboard.press("F1")
    await page.keyboard.type("Help: About")
    await page.keyboard.press("Enter")
    await expect(page.locator(".monaco-dialog-modal-block.dlx-sheet")).toBeVisible({ timeout: 15_000 })
    await expect(page.locator(".monaco-workbench.dlx-compact")).toHaveCount(0)
    await expect(page.locator(".part.activitybar")).toBeVisible()
    const explorerRow = await page.locator(".explorer-folders-view .monaco-list-row").first().boundingBox()
    expect(explorerRow?.height ?? 0).toBeGreaterThanOrEqual(40)
    await expect(page.locator(".part.sidebar .title-actions .codicon-toolbar-more")).toBeHidden()
    await expect(page.locator(".monaco-dialog-box .dialog-message")).toBeHidden()
    const box = await page.locator(".monaco-dialog-modal-block.dlx-sheet .monaco-dialog-box").boundingBox()
    expect(box?.width ?? 0).toBeLessThan(800)
    expect(box?.height ?? 0).toBeLessThan(700)
  })

  test("settings on phone has a close control", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await expect(page.locator(".monaco-workbench.dlx-compact")).toBeVisible({ timeout: 30_000 })
    await page.keyboard.press("F1")
    await page.keyboard.type("Preferences: Open Settings (UI)")
    await page.keyboard.press("Enter")
    await expect(page.locator(".monaco-modal-editor-block")).toBeVisible({ timeout: 30_000 })
    const modal = await page.locator(".monaco-modal-editor-block .modal-editor-part").boundingBox()
    expect(modal?.width ?? 0).toBeGreaterThan(360)
    await expect(page.locator(".monaco-modal-editor-block .dlx-overlay-close")).toBeVisible()
    await expect(page.locator(".settings-header-controls")).toBeHidden()
    await expect(page.locator(".settings-tabs-widget")).toBeHidden()
    await expect(page.locator(".settings-tab")).toHaveCount(0)
  })

  test("settings has a single store without User Remote Workspace tabs", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.keyboard.press("F1")
    await page.keyboard.type("Preferences: Open Settings (UI)")
    await page.keyboard.press("Enter")
    await expect(page.locator(".monaco-modal-editor-block")).toBeVisible({ timeout: 30_000 })
    await expect(page.locator(".settings-header-controls")).toBeHidden()
    await expect(page.locator(".settings-tabs-widget")).toBeHidden()
    await expect(page.getByRole("tab", { name: /^User$/ })).toHaveCount(0)
    await expect(page.getByRole("tab", { name: /Remote/i })).toHaveCount(0)
    await expect(page.getByRole("tab", { name: /^Workspace$/ })).toHaveCount(0)
  })

  test("keeps the activity rail and Exit on tablet and desktop", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await expect(page.locator(".monaco-workbench")).toBeVisible({ timeout: 30_000 })
    await expect(page.locator(".monaco-workbench.dlx-compact")).toHaveCount(0)
    await expect(page.locator(".part.activitybar")).toBeVisible()
    await expect(page.locator(".dlx-drawer-toggle")).toHaveCount(0)
    await expect(page.locator(".dlx-exit")).toBeVisible()
    await expect(page.locator(".activitybar .action-item:has(.codicon-settings-view-bar-icon)")).toBeVisible()
    await expect(page.locator(".action-item[aria-label*='Accounts' i]")).toHaveCount(0)
  })

  test("phone landscape stays on the drawer", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 844, height: 390 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await expect(page.locator(".monaco-workbench.dlx-compact")).toBeVisible({ timeout: 30_000 })
    await expect(page.locator(".part.activitybar")).toBeHidden()
    await expect(page.locator(".dlx-drawer-toggle")).toBeVisible()
  })

  test("Find is a full-width bar on the phone and a corner widget on tablet", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.keyboard.press("ControlOrMeta+KeyF")
    const phoneInput = page.locator(".find-widget .monaco-inputbox").first()
    await expect(phoneInput).toBeVisible({ timeout: 15_000 })
    const phoneEditor = await page.locator(".part.editor .monaco-editor").first().boundingBox()
    const phoneWidget = await page.locator(".find-widget").first().boundingBox()
    const phoneField = await phoneInput.boundingBox()
    expect(phoneField?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(Math.abs((phoneWidget?.width ?? 0) - (phoneEditor?.width ?? 0))).toBeLessThan(8)

    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(page.locator(".monaco-workbench.dlx-compact")).toHaveCount(0)
    await page.keyboard.press("ControlOrMeta+KeyF")
    const tabletField = await page.locator(".find-widget .monaco-inputbox").first().boundingBox()
    const tabletWidget = await page.locator(".find-widget").first().boundingBox()
    const tabletEditor = await page.locator(".part.editor .monaco-editor").first().boundingBox()
    expect(tabletField?.height ?? 0).toBeGreaterThanOrEqual(44)
    expect(tabletWidget?.width ?? 0).toBeLessThan((tabletEditor?.width ?? 0) - 8)
  })

  test("context menu rows are finger-sized on tablet", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.locator(".monaco-editor").first().click({ button: "right", position: { x: 80, y: 80 } })
    const row = page.locator(".monaco-menu .action-menu-item").first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    const box = await row.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  })

  test("problems status opens a phone sheet and restores a docked panel on tablet", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.keyboard.press("ControlOrMeta+KeyJ")
    await expect(page.locator(".part.panel")).toBeVisible({ timeout: 15_000 })

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.locator(".monaco-workbench.dlx-compact")).toBeVisible()
    await expect(page.locator(".part.panel")).toBeHidden()

    const editorBefore = await page.locator(".part.editor").boundingBox()
    await page.locator(".statusbar-item[id='status.problems']").click()
    await expect(page.locator(".monaco-workbench.dlx-panel-open")).toBeVisible()
    await expect(page.locator(".part.panel .dlx-panel-close")).toBeVisible()
    const editorAfter = await page.locator(".part.editor").boundingBox()
    expect(Math.abs((editorAfter?.width ?? 0) - (editorBefore?.width ?? 0))).toBeLessThan(8)
    const panelTab = await page.locator(".part.panel .composite-bar .action-item").first().boundingBox()
    expect(panelTab?.height ?? 0).toBeGreaterThanOrEqual(40)

    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(page.locator(".monaco-workbench.dlx-compact")).toHaveCount(0)
    await expect(page.locator(".monaco-workbench.dlx-panel-open")).toHaveCount(0)
    await expect(page.locator(".part.panel")).toBeVisible()
  })

  test("empty editor shows a hint instead of the welcome page", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await expect(page.locator(".gettingStartedContainer")).toHaveCount(0)
    await expect(page.locator(".dlx-empty-hint")).toHaveText("Open a file to see its content")
    await expect(page.locator(".editor-group-watermark .letterpress")).toBeHidden()
    await expect(page.locator(".editor-group-watermark .shortcuts")).toBeHidden()
    const arrow = page.locator(".dlx-empty-arrow")
    await expect(arrow).toBeVisible()
    const align = await page.evaluate(() => {
      const button = document.querySelector(".dlx-drawer-toggle")!.getBoundingClientRect()
      const mark = document.querySelector(".dlx-empty-arrow")!.getBoundingClientRect()
      return {
        dx: Math.abs(button.left + button.width / 2 - (mark.left + mark.width / 2)),
        below: mark.top >= button.bottom - 4,
      }
    })
    expect(align.dx).toBeLessThan(8)
    expect(align.below).toBe(true)
  })

  test("file context menu stacks above the open drawer", async ({ codeServerPage }) => {
    const page = codeServerPage.page
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await codeServerPage.reloadUntilEditorIsReady()

    await page.locator(".dlx-drawer-toggle").click()
    await expect(page.locator(".monaco-workbench.dlx-drawer-open")).toBeVisible()
    const row = page.locator(".explorer-folders-view .monaco-list-row").first()
    await expect(row).toBeVisible()
    await row.click({ button: "right" })
    const menu = page.locator(".context-view .monaco-menu")
    await expect(menu).toBeVisible()
    const hit = await menu.evaluate((el) => {
      const rect = el.getBoundingClientRect()
      const top = document.elementFromPoint(rect.left + 8, rect.top + 8)
      const view = el.closest(".context-view") as HTMLElement
      const sidebar = document.querySelector(".part.sidebar") as HTMLElement
      return {
        menuZ: Number(getComputedStyle(view).zIndex),
        sideZ: Number(getComputedStyle(sidebar).zIndex),
        onMenu: !!top?.closest(".monaco-menu"),
      }
    })
    expect(hit.menuZ).toBeGreaterThan(hit.sideZ)
    expect(hit.onMenu).toBe(true)
  })

  test("extensions search is finger-sized on phone and tablet", async ({ codeServerPage }) => {
    const page = codeServerPage.page

    async function openExtensions(width: number, height: number) {
      await page.setViewportSize({ width, height })
      await page.reload()
      await codeServerPage.reloadUntilEditorIsReady()
      if (width < 768) {
        await page.locator(".dlx-drawer-toggle").click()
      }
      await page.locator(".activitybar .action-label[aria-label*='Extensions' i]").click()
      await expect(page.locator(".extensions-viewlet")).toBeVisible({ timeout: 15_000 })
    }

    await openExtensions(390, 844)
    await expect(page.locator(".monaco-workbench.dlx-extensions-window")).toBeVisible()
    await expect(page.locator(".dlx-extensions-tab")).toHaveCount(3)
    const phoneSide = await page.locator(".part.sidebar").boundingBox()
    expect(Math.abs((phoneSide?.width ?? 0) - 390)).toBeLessThan(8)
    await page.locator(".dlx-extensions-tab[data-tab='search']").click()
    const phoneSearch = await page.locator(".extensions-viewlet .suggest-input-container .monaco-editor").boundingBox()
    expect(phoneSearch?.height ?? 0).toBeGreaterThanOrEqual(40)
    const phoneFilter = await page.locator(".extensions-search-actions-container .action-label").first().boundingBox()
    expect(phoneFilter?.height ?? 0).toBeGreaterThanOrEqual(40)

    await openExtensions(1024, 768)
    await expect(page.locator(".monaco-workbench.dlx-extensions-window")).toHaveCount(0)
    await expect(page.locator(".dlx-extensions-tab")).toHaveCount(0)
    const tabletSearch = await page.locator(".extensions-viewlet .suggest-input-container .monaco-editor").boundingBox()
    expect(tabletSearch?.height ?? 0).toBeGreaterThanOrEqual(40)
  })
})
