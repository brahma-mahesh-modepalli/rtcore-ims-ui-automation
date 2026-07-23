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
  readonly getItemOption: (sku: string) => Locator;
  readonly getAssignedSku: (sku: string) => Locator;
  readonly getAssignedItemName: (itemName: string) => Locator;
  readonly dailyStatusBadge: Locator;


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
     this.getItemOption = (sku: string) => page.locator(`//div[contains(@class,'cursor-pointer')][.//*[contains(text(),'${sku}')]]`);
     this.getAssignedSku = (sku: string) => page.locator(`//td[normalize-space()='${sku}']`);
     this.getAssignedItemName = (itemName: string) => page.locator(`//td[normalize-space()='${itemName}']`);
     this.dailyStatusBadge = page.locator("//span[normalize-space()='Daily']");

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
    return this.page.locator(
        `//span[normalize-space()='${locationName}']/ancestor::tr`
    );
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

async addNewItems(sku: string): Promise<void> {
    await this.itemSearchTextbox.fill(sku);
    await expect(this.getItemOption(sku)).toBeVisible();
    await this.getItemOption(sku).click();
    log(`Selected item with SKU : ${sku}`);
    await this.verifyDailySelected();
    await expect(this.assignButton).toBeEnabled();
    log('Assign Item button is enabled.');
    await this.assignButton.click();
    log('Clicked Assign Item button.');
    await expect(this.getAssignedSku(sku)).toBeVisible();
    log(`Item with SKU '${sku}' assigned successfully.`);
   
}

async verifyDailySelected(): Promise<void> {
    await expect(this.dailyButton).toHaveAttribute('data-state', 'active');
    log('Daily frequency is selected by default.');
}

getAssignedItemRow(itemName: string, sku: string): Locator {
    return this.page.locator(`//tr[td[normalize-space()='${itemName}'] and td[normalize-space()='${sku}']]`);
}

async verifyAssignedItem(itemName: string, sku: string): Promise<void> {
    const row = this.getAssignedItemRow(itemName, sku);
    await expect(row).toBeVisible();
    await expect(row.locator("text=Daily")).toBeVisible();
    log("✓ Assigned Item verified successfully.");
}




}






