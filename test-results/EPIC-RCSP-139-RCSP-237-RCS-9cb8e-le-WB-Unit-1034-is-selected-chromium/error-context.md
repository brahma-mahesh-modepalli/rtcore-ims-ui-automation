# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: EPIC-RCSP-139/RCSP-237.spec.ts >> RCSP-237 - Inventory Balances: Admin user can navigate to Inventory > Inventory Balances page from the main menu while... >> Verify whether the admin user can navigate to Inventory > Inventory Balances page from the main menu while WB Unit 1034 is selected
- Location: tests/EPIC-RCSP-139/RCSP-237.spec.ts:220:7

# Error details

```
Error: Channel closed
```

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Test source

```ts
  165 |     log('✓ Transfers page loaded');
  166 |   }
  167 | 
  168 |   async openDashboard(): Promise<void> {
  169 |     log('Navigating to Dashboard');
  170 |     await this.dashboardMenu.click();
  171 |     await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
  172 |     await expect(
  173 |       this.page.getByRole('heading', { name: /dashboard|overview|recent/i }).first(),
  174 |     )
  175 |       .toBeVisible({ timeout: 15000 })
  176 |       .catch(() => undefined);
  177 |     log('✓ Dashboard page loaded');
  178 |   }
  179 | 
  180 |   // ── My Hierarchy ──────────────────────────────────────────
  181 | 
  182 |   async verifyHierarchyControlsVisible(): Promise<void> {
  183 |     await expect(
  184 |       this.page.getByRole('heading', { name: /^My Hierarchy$/i }),
  185 |     ).toBeVisible();
  186 |     await expect(
  187 |       this.page.getByText(/Your assigned regions, markets, and stores/i),
  188 |     ).toBeVisible();
  189 |     await expect(this.page.getByText('Total stores', { exact: true })).toBeVisible();
  190 |     await expect(this.page.getByText('Region', { exact: true }).first()).toBeVisible();
  191 |     await expect(this.page.getByText('Market', { exact: true }).first()).toBeVisible();
  192 |   }
  193 | 
  194 |   private hierarchyNodeButton(label: string): Locator {
  195 |     const compact = label.replace(/\s+/g, '\\s*');
  196 |     return this.page.getByRole('button', { name: new RegExp(compact, 'i') }).first();
  197 |   }
  198 | 
  199 |   private async expandHierarchyNode(label: string): Promise<void> {
  200 |     const button = this.hierarchyNodeButton(label);
  201 |     await button.scrollIntoViewIfNeeded();
  202 |     await button.click();
  203 |     await this.page.waitForTimeout(700);
  204 |   }
  205 | 
  206 |   async expandHierarchyPath(
  207 |     region: string,
  208 |     market: string,
  209 |     expectedStore?: string,
  210 |   ): Promise<void> {
  211 |     log(`Expanding hierarchy: ${region} > ${market}`);
  212 |     const marketButton = this.hierarchyNodeButton(market);
  213 |     await this.expandHierarchyNode(region);
  214 |     if (!(await marketButton.isVisible().catch(() => false))) {
  215 |       await this.expandHierarchyNode(region);
  216 |     }
  217 |     await expect(marketButton).toBeVisible({ timeout: 20000 });
  218 | 
  219 |     await marketButton.scrollIntoViewIfNeeded();
  220 |     await marketButton.click();
  221 |     await this.page.waitForTimeout(800);
  222 | 
  223 |     if (expectedStore) {
  224 |       const storeLocator = this.page.getByText(expectedStore, { exact: true }).first();
  225 |       if (!(await storeLocator.isVisible().catch(() => false))) {
  226 |         await marketButton.click();
  227 |         await this.page.waitForTimeout(800);
  228 |       }
  229 |       await storeLocator.scrollIntoViewIfNeeded().catch(() => undefined);
  230 |       await expect(storeLocator).toBeVisible({ timeout: 20000 });
  231 |       return;
  232 |     }
  233 | 
  234 |     const anyStore = this.page.getByText(/WB Unit\s+\d+/i).first();
  235 |     if (!(await anyStore.isVisible().catch(() => false))) {
  236 |       await marketButton.click();
  237 |       await this.page.waitForTimeout(800);
  238 |     }
  239 |     await expect(anyStore).toBeVisible({ timeout: 20000 });
  240 |   }
  241 | 
  242 |   async selectHierarchyPath(
  243 |     region: string,
  244 |     market: string,
  245 |     store: string,
  246 |   ): Promise<void> {
  247 |     log(`Selecting hierarchy: ${region} > ${market} > ${store}`);
  248 |     await this.expandHierarchyPath(region, market);
  249 | 
  250 |     const storeLocator = this.page.getByText(store, { exact: true }).first();
  251 |     if (!(await storeLocator.isVisible().catch(() => false))) {
  252 |       await this.hierarchyNodeButton(market).click();
  253 |       await this.page.waitForTimeout(700);
  254 |     }
  255 |     await expect(storeLocator).toBeVisible({ timeout: 20000 });
  256 |     await this.selectStoreFromHierarchy(store);
  257 |     log(`✓ Selected store: ${store}`);
  258 |   }
  259 | 
  260 |   async selectStoreFromHierarchy(store: string): Promise<void> {
  261 |     const storeCode = store.replace(/^WB Unit\s+/i, '').trim();
  262 | 
  263 |     // App guidance: "Click a store to switch to it."
  264 |     await this.page.getByText(store, { exact: true }).first().click({ force: true });
> 265 |     await this.page.waitForTimeout(2000);
      |                     ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  266 | 
  267 |     if (await this.isStoreContextActive(storeCode, store)) {
  268 |       return;
  269 |     }
  270 | 
  271 |     // Fallback 1: open store details and look for an explicit switch action.
  272 |     const viewDetailsButton = this.page.locator(
  273 |       `xpath=//*[normalize-space()="${store}"]/ancestor::div[.//button[contains(., "View details")]][1]//button[contains(., "View details")]`,
  274 |     );
  275 |     if (await viewDetailsButton.isVisible().catch(() => false)) {
  276 |       await viewDetailsButton.click({ force: true });
  277 |       await this.page.waitForLoadState('networkidle').catch(() => undefined);
  278 |       await this.page.waitForTimeout(1500);
  279 |     }
  280 | 
  281 |     const switchAction = this.page.getByRole('button', {
  282 |       name: /switch to|use this store|select store|set as current/i,
  283 |     });
  284 |     if (await switchAction.first().isVisible().catch(() => false)) {
  285 |       await switchAction.first().click();
  286 |       await this.page.waitForTimeout(1000);
  287 |     }
  288 | 
  289 |     if (await this.isStoreContextActive(storeCode, store)) {
  290 |       return;
  291 |     }
  292 | 
  293 |     // Fallback 2: header store selector.
  294 |     await this.switchStoreViaHeader(store);
  295 |   }
  296 | 
  297 |   async switchStoreViaHeader(store: string): Promise<void> {
  298 |     const storeCode = store.replace(/^WB Unit\s+/i, '').trim();
  299 |     const headerStoreButton = this.page.locator('header').getByRole('button').first();
  300 |     await headerStoreButton.click();
  301 |     await this.page.waitForTimeout(500);
  302 | 
  303 |     const search = this.page
  304 |       .getByPlaceholder(/search/i)
  305 |       .or(this.page.getByRole('textbox').last())
  306 |       .first();
  307 |     if (await search.isVisible().catch(() => false)) {
  308 |       await search.fill(storeCode);
  309 |       await this.page.waitForTimeout(500);
  310 |     }
  311 | 
  312 |     const option = this.page
  313 |       .getByRole('option', { name: new RegExp(storeCode, 'i') })
  314 |       .or(this.page.getByText(new RegExp(`${store}|${storeCode}`, 'i')))
  315 |       .first();
  316 |     await option.click({ force: true });
  317 |     await this.page.waitForTimeout(1500);
  318 |   }
  319 | 
  320 |   async isStoreContextActive(storeCode: string, storeName: string): Promise<boolean> {
  321 |     const headerText = await this.page.locator('header').innerText().catch(() => '');
  322 |     const sidebarText = await this.sidebar.innerText().catch(() => '');
  323 |     return new RegExp(`${storeName}|Store.*${storeCode}|\\b${storeCode}\\b`, 'i').test(
  324 |       `${headerText}\n${sidebarText}`,
  325 |     );
  326 |   }
  327 | 
  328 |   async verifyStoresVisible(stores: string[]): Promise<void> {
  329 |     for (const store of stores) {
  330 |       const storeLocator = this.page.getByText(store, { exact: true }).first();
  331 |       await expect(storeLocator).toBeVisible({ timeout: 15000 });
  332 |     }
  333 |   }
  334 | 
  335 |   async verifyActiveStore(storeName: string): Promise<void> {
  336 |     log(`Verifying active store context: ${storeName}`);
  337 |     const storeCode = storeName.replace(/^WB Unit\s+/i, '').trim();
  338 |     await expect
  339 |       .poll(async () => this.isStoreContextActive(storeCode, storeName), {
  340 |         timeout: 20000,
  341 |         message: `Waiting for active store context to become ${storeName}`,
  342 |       })
  343 |       .toBe(true);
  344 |     log(`✓ Active store is ${storeName}`);
  345 |   }
  346 | 
  347 |   async switchStore(
  348 |     region: string,
  349 |     market: string,
  350 |     store: string,
  351 |   ): Promise<void> {
  352 |     await this.openMyHierarchy();
  353 |     await this.selectHierarchyPath(region, market, store);
  354 |     await this.openDashboard();
  355 |     await this.verifyActiveStore(store);
  356 |   }
  357 | 
  358 |   // ── Inventory Balances ────────────────────────────────────
  359 | 
  360 |   async searchInventoryItem(itemNameOrSku: string): Promise<void> {
  361 |     log(`Searching inventory item: ${itemNameOrSku}`);
  362 |     await this.inventorySearchInput.fill(itemNameOrSku);
  363 |     await this.inventorySearchInput.press('Enter');
  364 |     await this.page.waitForLoadState('networkidle').catch(() => undefined);
  365 |   }
```