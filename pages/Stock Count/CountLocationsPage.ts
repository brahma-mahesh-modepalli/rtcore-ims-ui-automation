import { Page, Locator, expect } from '@playwright/test';
import { log } from '../../utils/helpers';


export class CountLocationsPage {
  private pageTitle: Locator;
 
  private addLocationDialog: Locator;
  private locationNameTextBox: Locator;
  private descriptionTextBox: Locator;
  private saveButton: Locator;
  private travelPathCard: Locator;
  private assignItemButton: Locator;
  readonly countLocationsMenu: Locator;
  readonly stockCountMenu: Locator;
  readonly addLocationButton: Locator;
  readonly countTravelPathCard: Locator;
  readonly countTravelPathTitle: Locator;
  readonly countTravelPathDescription: Locator;
  readonly totalLocationsCard: Locator;
  readonly activeLocationsCard: Locator;
  readonly inactiveLocationsCard: Locator;
  readonly locationTable: Locator;
  readonly numberHeader: Locator;
  readonly descriptionHeader: Locator;
  readonly itemsHeader: Locator;
  readonly statusHeader: Locator;
  readonly actionsHeader: Locator;
  readonly serialNoHeader: Locator;
  readonly locationHeader: Locator;
  readonly addLocationPopupTitle: Locator;
  readonly locationNameTextbox: Locator;
  readonly descriptionTextbox: Locator;
  readonly saveLocationButton: Locator;
  readonly cancelButton: Locator;
  readonly closePopupButton: Locator;
  readonly walkInCoolerExpandArrow: Locator;
  readonly assignItemPopupTitle: Locator;
  readonly itemSearchTextbox: Locator;
  readonly dailyButton: Locator;
  readonly weeklyButton: Locator;
  readonly monthlyButton: Locator;
  readonly assignButton: Locator;
  readonly dailyStatusBadge: Locator;
  readonly noItemFoundMessage: Locator;

  constructor(private page: Page) {
  
     this.pageTitle = page.locator("h1,h2").filter({ hasText: "Count Locations" }).first();
     this.countLocationsMenu = page.getByRole('link', {name: /count locations/i});
     this.addLocationDialog = page.getByRole('dialog');
     this.locationNameTextBox = page.getByPlaceholder("e.g. Walk-In Cooler");
     this.descriptionTextBox = page.getByPlaceholder("Brief description");
     this.saveButton = page.getByRole('button', {name: /^add location$/i});
     this.travelPathCard = page.locator("text=Count Travel Path");
     this.locationTable = page.getByRole("table");
     this.assignItemButton = page.getByRole('button', {name: /assign item/i});
     this.stockCountMenu = page.getByRole('button', {name: /stock count/i});
     this.countTravelPathCard = page.locator('text=Count Travel Path');
     this.countTravelPathTitle = page.getByText('Count Travel Path');
     this.countTravelPathDescription = page.getByText('The order below defines the walking path',{ exact: false });
     this.totalLocationsCard = page.locator('div').filter({has: page.locator('text=TOTAL LOCATIONS')}).first();
     this.activeLocationsCard = page.locator('div').filter({has: page.locator('text=ACTIVE')}).first();
     this.inactiveLocationsCard = page.locator('div').filter({has: page.locator('text=INACTIVE')}).first();
     this.locationTable = page.getByRole('table');
     this.numberHeader = page.locator('th').filter({ hasText: '#' });
     this.locationHeader = page.locator('th').filter({ hasText: 'LOCATION' });
     this.descriptionHeader = page.locator('th').filter({ hasText: 'DESCRIPTION' });
     this.statusHeader = page.locator('th').filter({ hasText: 'STATUS' });
     this.actionsHeader = page.locator('th').filter({ hasText: 'ACTIONS' });
     this.serialNoHeader = page.locator('thead th').filter({ hasText: '#' });
     this.itemsHeader = page.locator('thead th').filter({ hasText: 'Items' });
     this.addLocationButton = page.getByRole('button', {name: /add location/i});
     this.addLocationPopupTitle = page.locator('p:has-text("Add Count Location")');
     this.locationNameTextbox = page.locator('input[placeholder="e.g. Walk-In Cooler"]');
     this.descriptionTextbox = page.locator('input[placeholder="Brief description of this location"]');
     this.saveLocationButton = page.locator('button[type="submit"]');
     this.cancelButton = page.locator('button:has-text("Cancel")');
     this.closePopupButton = page.locator('button[aria-label="Close dialog"]');
     this.walkInCoolerExpandArrow = page.locator("//span[normalize-space()='Walk-In Cooler']/ancestor::tr//button[1]");
     this.assignItemPopupTitle = page.getByText('Assign Item To Location');
     this.itemSearchTextbox = page.getByPlaceholder('Search by name or PLU…');
     this.dailyButton = page.getByRole('button', { name: /^Daily$/ });
     this.weeklyButton = page.getByRole('button', { name: /^Weekly$/ });
     this.monthlyButton = page.getByRole('button', { name: /^Monthly$/ });
     this.assignButton = page.locator("//div[contains(@class,'fixed')]//button[normalize-space()='Assign Item']");
     this.dailyStatusBadge = page.locator("//span[normalize-space()='Daily']");
     this.noItemFoundMessage = page.locator('text=No active items match');

    }

      async verifyAddLocationButton(): Promise<void> {
        await expect(this.addLocationButton).toBeVisible();
        log('Add Location button displayed.');
      }

      async verifyPageLoaded(): Promise<void> {
        await this.verifyAddLocationButton();
        log('Count Locations page loaded successfully.');
     }
    
     async expandStockCountMenu(): Promise<void> {
       await expect(this.stockCountMenu).toBeVisible();
       log('Verified STOCK COUNT menu.');
       await this.stockCountMenu.click();
       log('Expanded STOCK COUNT menu.');
     }
     
     async clickCountLocations(): Promise<void> {
      await this.countLocationsMenu.click();
      log('Clicked Count Locations.');
     }

     async navigateToCountLocations(): Promise<void> {
      await expect(this.stockCountMenu).toBeVisible();
      log('Verified STOCK COUNT menu.');
      await this.expandStockCountMenu();
      await this.clickCountLocations();
      log('Navigated to Count Locations page.');
      }

      /**
   * Click on Add Location Button from the STOCK COUNT menu
   */
  async clickAddLocation(): Promise<void> {
    log('Clicking on Add Location');
    
    try {
      await this.addLocationButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        log('⚠ Element not immediately visible, proceeding anyway');
      });
      await this.addLocationButton.click();
    } catch (error) {
      log('Error clicking Add Location: ' + String(error));
      throw error;
    }
    
    await this.page.waitForLoadState('networkidle');
    log('✓ Clicked Add Location button.');
  }


  /**
 * Verify Count Locations page is displayed
 */
async verifyCountLocationsPage(): Promise<void> {

   try {
      await this.addLocationButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        log('⚠ Element not immediately visible, proceeding anyway');
      });
     
    await expect(this.addLocationButton).toBeVisible();
    log('✓ Verified: Add Location button is displayed');
    await expect(this.countTravelPathTitle).toBeVisible();
    log('✓ Verified: Count Travel Path section is displayed');
    await expect(this.countTravelPathDescription).toBeVisible();
    log('✓ Verified: Count Travel Path description is displayed');
    await expect(this.totalLocationsCard).toBeVisible();
    log('✓ Verified: Total Locations card is displayed');
    await expect(this.activeLocationsCard).toBeVisible();
    log('✓ Verified: Active Locations card is displayed');
    await expect(this.inactiveLocationsCard).toBeVisible();
    log('✓ Verified: Inactive Locations card is displayed');
    //Verify the table headers are displayed
    await expect(this.numberHeader).toBeVisible();
    log('✓ Verified: # column header is displayed');
    await expect(this.locationHeader).toBeVisible();
    log('✓ Verified: LOCATION column header is displayed');
    await expect(this.descriptionHeader).toBeVisible();
    log('✓ Verified: DESCRIPTION column header is displayed');
    await expect(this.itemsHeader).toBeVisible();
    log('✓ Verified: ITEMS column header is displayed');
    await expect(this.statusHeader).toBeVisible();
    log('✓ Verified: STATUS column header is displayed');
    await expect(this.actionsHeader).toBeVisible();
    log('✓ Verified: ACTIONS column header is displayed');

     } catch (error) {
      log('Verification failed on Count Loations page');
      throw error;
    }

  }

    /**
    * Verify Add Count Location popup
    */
     async verifyAddLocationPopup(): Promise<void> {
        try {
      await this.addLocationPopupTitle.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        log('⚠ Element not immediately visible, proceeding anyway');
      });
    await expect(this.addLocationPopupTitle).toBeVisible();
    await expect(this.locationNameTextbox).toBeVisible();
    await expect(this.descriptionTextbox).toBeVisible();
    await expect(this.saveLocationButton).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
    log('Verified Add Count Location popup.');
      } catch (error) {
      log('Verification failed on Count Loations page');
      throw error;
    }

 }

    /**
    * Enter Count Location details
    */
     async enterLocationDetails(locationName: string, description: string): Promise<void> {
      await this.locationNameTextbox.fill(locationName);
      await this.descriptionTextbox.fill(description);
      log('Entered Count Location details.');
    }

     /**
    * Enter Count Location details
    */
     async deleteLocation(locationName: string): Promise<void> {
      await this.locationNameTextbox.fill(locationName);
      log('Entered Count Location details.');
    }

    /**
     * Save Count Location
     */
    async clickSaveLocation(): Promise<void> {
      await this.saveLocationButton.click();
      log('Clicked Save Location button.');
    }

    /**
     * Create new Count Location
     */
    async createCountLocation(locationName: string, description: string): Promise<void> {
    await this.deleteLocationIfExists(locationName);
    await this.clickAddLocation();
    await this.verifyAddLocationPopup();
    await this.enterLocationDetails(locationName, description);
    await this.clickSaveLocation();
    await this.verifyLocationAdded(locationName);
    log('New Count Location created.');

}

/**
 * Delete location if it already exists
 */
async deleteLocationIfExists(locationName: string): Promise<void> {
   try {
    const location = this.getLocationByName(locationName);
    await location.waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
    if (!(await location.isVisible().catch(() => false))) {
    log(`Location '${locationName}' does not exist.`);
    return;
    }
  
    log(`Location '${locationName}' already exists.`);
    this.page.once('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        expect(dialog.message()).toBe('Remove this count location?');
        log('✓ Delete confirmation dialog displayed.');
        await dialog.accept();
    });
    await this.getDeleteIcon(locationName).click();
    await expect(location).not.toBeVisible({ timeout: 10000 });
    log(`✓ '${locationName}' deleted successfully.`);

   } catch (error) {
      log('Verification failed on Count Loations page');
      throw error;
    }
  }

getLocationByName(locationName: string): Locator {
    return this.page.locator(
        `//table//span[normalize-space()='${locationName}']`
    );
}

getDeleteIcon(locationName: string): Locator {
    return this.getLocationRow(locationName).locator('button').nth(2); // second button (Delete)
}

getLocationRow(locationName: string): Locator {
    return this.page.locator(`//span[normalize-space()='${locationName}']/ancestor::tr`);
}

/**
 * Verify newly created location is displayed in the table
 */
async verifyLocationAdded(locationName: string): Promise<void> {
    try {
        const location = this.getLocationByName(locationName);
        await expect(location).toBeVisible({ timeout: 10000 });
        log(`✓ Location '${locationName}' created successfully.`);
    } catch (error) {
        log(`Failed to verify location '${locationName}'.`);
        throw error;
    }
}

async expandLocationRow(locationName: string): Promise<void> {
    await this.getLocationRow(locationName).click();
    log(`✓ Location '${locationName}' expanded.`);

}

async verifyAssignItemButton(): Promise<void> {
    await expect(this.assignItemButton).toBeVisible();
    await expect(this.assignItemButton).toBeEnabled();
    log("Verified Assign Item button.");

}

async clickAssignItemButton(): Promise<void> {
    await this.assignItemButton.click();
    log("Clicked Assign Item button.");
}

async verifyAssignItemPopup(): Promise<void> {
    await expect(this.assignItemPopupTitle).toBeVisible();
    log("Verified Assign Item popup is visible.");
    await expect(this.itemSearchTextbox).toBeVisible();
    log("Verified Item Search textbox is visible.");
    await expect(this.dailyButton).toBeVisible();
    log("Verified Daily button is visible.");
    await expect(this.weeklyButton).toBeVisible();
    log("Verified Weekly button is visible.");
    await expect(this.monthlyButton).toBeVisible();
    log("Verified Monthly button is visible.");
    await expect(this.assignButton).toBeVisible();
    log("Verified Assign button is visible.");
    await expect(this.assignButton).toBeDisabled();
    log("Verified Assign button is disabled.");
    await expect(this.cancelButton).toBeVisible();
    await expect(this.cancelButton).toBeEnabled();
    log("Verified Cancel button is enabled.");
    await expect(this.closePopupButton).toBeVisible();
    log("Verified Close popup button is visible.");
    log("Verified Assign Item popup.");

}

async verifyAssignItemPopupFunctionality(locationName: string): Promise<void> {
    await this.expandLocationRow(locationName);
    await this.verifyAssignItemButton();
    await this.clickAssignItemButton();
    await this.verifyAssignItemPopup();

}

async addNewItems(locationName: string, items: { sku: string; itemName: string }[], countFrequency: string[]): Promise<{ sku: string; itemName: string }> {
    await this.expandLocationRow(locationName);
    await this.verifyAssignItemButton();
    await this.clickAssignItemButton();
    const selectedItem = await this.searchAndSelectAvailableItem(items);
    log(`Selected item with Item Name : ${selectedItem.itemName}`);
    await this.selectCountFrequency(countFrequency);
    await this.clickOnAssignButton();

    await expect(this.getAssignedSku(selectedItem.sku)).toBeVisible({ timeout: 15000 });
    log(`Item with SKU '${selectedItem.sku}' assigned successfully.`);

    await expect(this.getAssignedItemName(selectedItem.itemName)).toBeVisible({ timeout: 15000 });
    log(`Item with Item Name '${selectedItem.itemName}' assigned successfully.`);

    for (const frequency of countFrequency) {
      await expect(this.getAssignedItemCountFrequency(selectedItem.itemName, frequency)).toBeVisible({ timeout: 15000 });
      log(`Item with Count Frequency '${frequency}' assigned successfully.`);
    }

    return selectedItem;

}


async enterItemsDetailsAndClickOnCancel(locationName: string,  items: { sku: string; itemName: string }[], countFrequency: string[]): Promise<{ sku: string; itemName: string }> {
    await this.expandLocationRow(locationName);
    await this.verifyAssignItemButton();
    await this.clickAssignItemButton();
    const selectedItem = await this.searchAndSelectAvailableItem(items);
    log(`Selected item with Item Name : ${selectedItem.itemName}`);
    await this.selectCountFrequency(countFrequency);
    await this.clickOnCancelButton();

   await expect(this.getAssignedSku(selectedItem.sku)).toHaveCount(0);
   await expect(this.getAssignedItemName(selectedItem.itemName)).toHaveCount(0);
   return selectedItem;

}


locationName: string,
async selectCountFrequency(selectedFrequencies: string[]): Promise<void> {

    const dailyButton = this.getFrequencyButton("Daily");
    const weeklyButton = this.getFrequencyButton("Weekly");
    const monthlyButton = this.getFrequencyButton("Monthly");

    const hasDaily = selectedFrequencies.includes("Daily");
    const hasWeekly = selectedFrequencies.includes("Weekly");
    const hasMonthly = selectedFrequencies.includes("Monthly");

    // STEP 1: Select Weekly first (if required)
    if (hasWeekly) {
        const weeklySelected = (await weeklyButton.getAttribute("class"))?.includes("bg-accent");
        if (!weeklySelected) {
            await weeklyButton.click();
            log("Weekly selected.");
        } else {
            log("Weekly already selected.");
        }
    }

    // STEP 2: Select Monthly (if required)
    if (hasMonthly) {
        const monthlySelected = (await monthlyButton.getAttribute("class"))?.includes("bg-accent");
        if (!monthlySelected) {
            await monthlyButton.click();
            log("Monthly selected.");
        } else {
            log("Monthly already selected.");
        }
    }

    // STEP 3: Handle Daily
    const dailySelected = (await dailyButton.getAttribute("class"))?.includes("bg-accent");
    if (hasDaily) {
        // Daily should remain selected
        if (dailySelected) {
            log("Daily already selected.");
        } else {
            await dailyButton.click();
            log("Daily selected.");
        }

    } else {

        // Daily should be removed only after Weekly/Monthly are selected
        if ((hasWeekly || hasMonthly) && dailySelected) {
            await dailyButton.click();
            await expect(dailyButton).not.toHaveClass(/bg-accent/);
            log("Daily unselected.");
        }
    }
}


 async clickOnAssignButton(): Promise<void> {
    await expect(this.assignButton).toBeEnabled();
    await this.assignButton.click();
    log("Assign Item clicked successfully.");

 }

 async clickOnCancelButton(): Promise<void> {
    await expect(this.cancelButton).toBeEnabled();
    await this.cancelButton.click();
    log("Cancel Assign Item clicked successfully.");

 }

 


/*
async selectCountFrequency(selectedFrequencies: string[]): Promise<void> {
    const dailyButton = this.getFrequencyButton("Daily");
    const hasDaily = selectedFrequencies.includes("Daily");
    const hasWeekly = selectedFrequencies.includes("Weekly");
    const hasMonthly = selectedFrequencies.includes("Monthly");

    // Step 1: Select Weekly/Monthly first
    for (const frequency of ["Weekly", "Monthly"]) {
        if (!selectedFrequencies.includes(frequency))
            continue;

        const button = this.getFrequencyButton(frequency);

        const selected = (await button.getAttribute("class"))?.includes("bg-accent");
        if (!selected) {
            await button.click();
            log(`${frequency} selected.`);
        }
    }

    // Step 2: Remove Daily only if it is NOT required
    if (!hasDaily && (hasWeekly || hasMonthly)) {

        const dailySelected = (await dailyButton.getAttribute("class"))?.includes("bg-accent");
        if (dailySelected) {
            await dailyButton.click();
            log("Daily unselected.");
        }
    } else {
        log("Daily kept selected.");
    }
    await this.assignButton.click();
}

*/


getFrequencyButton(frequency: string): Locator {
    return this.page.locator(`//button[normalize-space()='${frequency}']`);
  
}

getFrequencyButtonCheckBox(frequency: string): Locator {
    return this.page.locator(`//button[normalize-space()='${frequency}']/child::*[2]`);
}

getItemOption(sku: string): Locator {
    return this.page.locator(`//div[contains(@class,'absolute ')][.//*[contains(text(),'${sku}')]]`);
}

getAssignedSku(sku: string): Locator {
    return this.page.locator(`//td[normalize-space()='${sku}']`);
}

getDeleteButton(sku: string): Locator {
    // Find the row that contains a td with the exact SKU text, then the remove button in that row
    return this.page.locator(`//tr[.//td[normalize-space()='${sku}']]//button[@title="Remove from location"]`);
}

deleteButton(){

    return this.page.locator('//button[@title="Remove from location"]');
}

getAssignedItemName(itemName: string): Locator {
    return this.page.locator(`//td[normalize-space()='${itemName}']`);
}

getAssignedItemCountFrequency(itemName: string, countFrequency: string): Locator {
    return this.page.locator(`//td[normalize-space()='${itemName}']/ancestor::tr[1]//child::span[normalize-space()='${countFrequency}']`);
}

getAssignedItemRow(itemName: string, sku: string): Locator {
    return this.page.locator(`//tr[td[normalize-space()='${itemName}'] and td[normalize-space()='${sku}']]`);
}

async verifyAssignedItem(itemName: string, sku: string, frequency: string): Promise<void> {
    const row = this.page.locator(`//tr[.//td[normalize-space()='${itemName}']]`);
    await expect(row).toBeVisible();
    await expect(row.locator(`.//td[normalize-space()='${sku}']`)).toBeVisible();
    await expect(row.locator(`.//td//*[normalize-space()='${frequency}']`)).toBeVisible();
    log(`✓ Item '${itemName}' with SKU '${sku}' and frequency '${frequency}' verified.`);
}

/**
 * Search available item from list and select first available item.
 */
async searchAndSelectAvailableItem(items: { sku: string; itemName: string }[]): Promise<{ sku: string; itemName: string }> {
  for (const item of items) {
    await this.itemSearchTextbox.clear();
    await this.itemSearchTextbox.fill(item.sku);
    await this.page.waitForTimeout(2000);
    if (await this.noItemFoundMessage.isVisible().catch(() => false)) {
      log(`SKU ${item.sku} is already assigned. Trying next SKU...`);
      continue;
    }
    await this.page.waitForTimeout(1000);
    await expect(this.getItemOption(item.itemName)).toBeVisible();
    await this.getItemOption(item.itemName).click();
    log(`Selected Item : ${item.itemName} (${item.sku})`);
    return item;
  }

  throw new Error("No available items found for assignment.");
}

async deleteItems( locationName: string,items: { sku: string; itemName: string }): Promise<void> {
    await this.expandLocationRow(locationName);
     await this.page.waitForTimeout(3000);
        const deleteBtn = this.getDeleteButton(items.sku).first();
        const visible = await deleteBtn.isVisible({ timeout: 10000 }).catch(() => false);
        if (!visible) {
            log(`Delete button for SKU ${items.sku} not found.`);
            return;
        }
        await deleteBtn.scrollIntoViewIfNeeded();
        await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });

        // Prepare to accept confirmation dialog that appears on delete
        this.page.once('dialog', async dialog => {
            try {
                expect(dialog.type()).toBe('confirm');
                await dialog.accept();
                log('✓ Delete confirmation dialog accepted.');
            } catch (err) {
                await dialog.dismiss();
            }
        });

        // Try a normal click, then fall back to hover+click and force click if necessary
        try {
             
            await deleteBtn.click();
            const visible = await deleteBtn.isVisible({ timeout: 10000 }).catch(() => false);
            if (visible) {
            await deleteBtn.click();
        }
        } catch (err) {
            log(`Delete button regular click failed: ${String(err)} — trying hover+click`);
            try {
                await deleteBtn.hover();
                await deleteBtn.click();
            } catch (err2) {
                log(`Hover+click failed: ${String(err2)} — trying force click`);
                await deleteBtn.click({ force: true });
            }
        }

        log(`Clicked delete for SKU : ${items.sku}`);
        await expect(this.getAssignedItemRow(items.itemName, items.sku)).not.toBeVisible({ timeout: 10000 });
        log(`Verified item with SKU : ${items.sku} is deleted successfully.`);
}

 /**
 * Verify given Count Frequency options
 */
async verifyCountFrequencyOptions(locationName: string, frequencies: string[]): Promise<void> {
     await this.expandLocationRow(locationName);
    await this.verifyAssignItemButton();
    await this.clickAssignItemButton();

    for (const frequency of frequencies) {

        await expect(this.getFrequencyButton(frequency)).toBeVisible();

        log(`✓ Verified '${frequency}' frequency option is displayed.`);
    }
}














}





