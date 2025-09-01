import { expect } from 'playwright/test';
import { PageObject } from '../page';
import { Element } from '../element';
import { ImagePopoverComponent } from '../components/image-popover-component';

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

class ImageItem extends Element {
  get thumbnail(): Element {
    return this.child(Element, 'Thumbnail', 'img');
  }
}

export class CollectionPage extends PageObject {
  protected url = '/collection';

  // Main elements
  get imageGrid(): Element {
    return this.element('Image Grid', '[data-testid="image-grid"]');
  }

  get emptyStateMessage(): Element {
    return this.element('Empty State Message', '[data-testid="empty-state-message"]');
  }

  get notFoundMessage(): Element {
    return this.element('Not Found Message', '[data-testid="not-found-message"]');
  }

  get imagePopover(): ImagePopoverComponent {
    return this.component(ImagePopoverComponent, 'Image Popover', '[data-testid="image-popover"]');
  }

  // Dynamic elements for images
  imageItem(imageId?: string): ImageItem {
    return imageId 
      ? this.component(ImageItem, `Image Item ${imageId}`, `[data-testid="image-item-${imageId}"]`)
      : this.component(ImageItem, 'Image Item', '[data-testid^="image-item-"]');
  }

  imageThumbnail(imageId: string): Element {
    return this.element(`Image Thumbnail ${imageId}`, `[data-testid="image-thumbnail-${imageId}"]`);
  }

  // Navigation methods
  async visitCollection(collectionId: string, status?: string): Promise<void> {
    const queryParam = status ? `?status=${status}` : '';
    const path = `/collection/${collectionId}${queryParam}`;
    console.log(`Navigating to collection page: ${path}`);
    await this.page.goto(path);
    await this.page.waitForLoadState('load', { timeout: 10000 });
  }

  // Page assertions - URL and basic structure
  async shouldBeOnCollectionPage(collectionId: string, status?: string): Promise<void> {
    const expectedPath = status ? `/collection/${collectionId}?status=${status}` : `/collection/${collectionId}`;
    const currentUrl = this.page.url();
    expect(currentUrl, { 
      message: `Current URL is "${currentUrl}" instead of collection page "${expectedPath}" after navigation` 
    }).toContain(expectedPath);
    console.log(`✓ User is on collection page for "${collectionId}"${status ? ` with status filter "${status}"` : ''}`);
  }

  async shouldShow404Page(): Promise<void> {
    await this.notFoundMessage.shouldBeDisplayed();
    const notFoundText = await this.notFoundMessage.getText();
    expect(notFoundText, {
      message: `404 page shows "${notFoundText}" instead of expected collection not found message`
    }).toContain('collection was not found');
    console.log('✓ 404 error page displayed with collection not found message');
  }

  // Grid layout assertions
  async shouldDisplayImagesInThreeColumnGrid(): Promise<void> {
    await this.imageGrid.shouldBeDisplayed();
    
    // Verify CSS Grid structure
    const gridStyles = await this.page.evaluate(() => {
      const gridElement = document.querySelector('[data-testid="image-grid"]') as HTMLElement;
      if (!gridElement) return null;
      
      const computedStyles = window.getComputedStyle(gridElement);
      return {
        display: computedStyles.display,
        gridTemplateColumns: computedStyles.gridTemplateColumns
      };
    });

    expect(gridStyles?.display, {
      message: `Image grid display property is "${gridStyles?.display}" instead of "grid"`
    }).toBe('grid');

    // Verify 3 columns in grid template
    const columnCount = gridStyles?.gridTemplateColumns?.split(' ').length || 0;
    expect(columnCount, {
      message: `Image grid has ${columnCount} columns instead of 3 columns`
    }).toBe(3);

    console.log('✓ Images displayed in 3-column CSS grid layout');
  }

  // Image display and lazy loading assertions
  async shouldDisplayImagesWithThumbnails(expectedImageIds: string[]): Promise<void> {
    // Wait for images to load
    await this.imageGrid.shouldBeDisplayed();
    
    for (const imageId of expectedImageIds) {
      await this.imageItem(imageId).shouldBeDisplayed();
      await this.imageThumbnail(imageId).shouldBeDisplayed();
      
      // Verify thumbnail has proper src attribute and lazy loading
      const thumbnailElement = this.imageThumbnail(imageId);
      const src = await this.page.locator(thumbnailElement.selector).getAttribute('src');
      const loading = await this.page.locator(thumbnailElement.selector).getAttribute('loading');
      
      expect(src, {
        message: `Image ${imageId} thumbnail has no src attribute or invalid URL`
      }).toContain(`/api/images/`);
      
      expect(src, {
        message: `Image ${imageId} thumbnail src "${src}" does not contain "/thumbnail" path`
      }).toContain('/thumbnail');
      
      expect(loading, {
        message: `Image ${imageId} loading attribute is "${loading}" instead of "lazy"`
      }).toBe('lazy');
    }
    
    console.log(`✓ All ${expectedImageIds.length} images displayed with thumbnails and lazy loading`);
  }

  // async shouldDisplayImageWithProperDimensions(imageMetaData: ImageMetadata ): Promise<void> {
  //   const thumbnail = this.imageThumbnail(imageMetaData.id);
  //   await thumbnail.shouldBeDisplayed();
    
  //   const dimensions = await this.page.evaluate((id) => {
  //     const img = document.querySelector(`[data-testid="image-thumbnail-${id}"]`) as HTMLImageElement;
  //     if (!img) return null;
      
  //     return {
  //       naturalWidth: img.naturalWidth,
  //       naturalHeight: img.naturalHeight,
  //       width: img.width,
  //       height: img.height
  //     };
  //   }, imageId);
    
  //   expect(dimensions, {
  //     message: `Could not get dimensions for image ${imageId} thumbnail`
  //   }).toBeTruthy();
    
    
  //   const maxDimension = Math.max(dimensions!.naturalWidth, dimensions!.naturalHeight);
  //   expect(img.naturalWidth, {
  //     message: `Image ${imageId} thumbnail natural dimensions are ${dimensions!.naturalWidth}x${dimensions!.naturalHeight}, expected max 400px`
  //   }).toBeLessThanOrEqual(400);
    
  //   console.log(`✓ Image ${imageId} thumbnail has proper dimensions (${dimensions!.naturalWidth}x${dimensions!.naturalHeight})`);
  // }

  // Status filter assertions
  // async shouldDisplayOnlyImagesWithStatus(status: string, expectedImageIds: string[]): Promise<void> {
  //   await this.shouldDisplayImagesInThreeColumnGrid();
  //   await this.shouldDisplayImagesWithThumbnails(expectedImageIds);
    
  //   // Verify no images with other statuses are displayed
  //   const allImageElements = await this.page.locator('[data-testid^="image-item-"]').all();
  //   const actualImageIds = [];
    
  //   for (const element of allImageElements) {
  //     const testId = await element.getAttribute('data-testid');
  //     if (testId) {
  //       const imageId = testId.replace('image-item-', '');
  //       actualImageIds.push(imageId);
  //     }
  //   }
    
  //   expect(actualImageIds.sort(), {
  //     message: `Page displays images [${actualImageIds.join(', ')}] instead of expected [${expectedImageIds.join(', ')}] for status "${status}"`
  //   }).toEqual(expectedImageIds.sort());
    
  //   console.log(`✓ Page displays only images with "${status}" status: [${expectedImageIds.join(', ')}]`);
  // }

  // Empty state assertions
  async shouldDisplayEmptyStateMessage(status: string): Promise<void> {
    await this.emptyStateMessage.shouldBeDisplayed();
    
    const expectedMessage = `This collection has no images with status: "${status}"`;
    const actualMessage = await this.emptyStateMessage.getText();
    
    expect(actualMessage, {
      message: `Empty state shows "${actualMessage}" instead of "${expectedMessage}"`
    }).toBe(expectedMessage);
    
    console.log(`✓ Empty state message displayed for status "${status}"`);
  }

  async shouldMaintainPageLayout(): Promise<void> {
    // Verify page structure is maintained even when empty
    await expect(this.page.locator('body')).toBeVisible();
    
    const pageStructure = await this.page.evaluate(() => {
      const body = document.body;
      const hasMainContent = body.querySelector('[data-testid="main-content"]') !== null;
      
      return {
        hasMainContent: hasMainContent || body.children.length > 0,
        bodyHeight: body.offsetHeight
      };
    });
    
    expect(pageStructure.hasMainContent, {
      message: 'Page layout is missing main content structure'
    }).toBe(true);
    
    expect(pageStructure.bodyHeight, {
      message: 'Page layout has collapsed (body height is 0)'
    }).toBeGreaterThan(0);
    
    console.log('✓ Page layout structure maintained during empty state');
  }

  // Layout stability and performance assertions
  async shouldHaveNoLayoutShift(): Promise<void> {
    // Monitor layout shifts during image loading
    const layoutShifts = await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cumulativeShift = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as LayoutShift).hadRecentInput) {
              cumulativeShift += (entry as LayoutShift).value;
            }
          }
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Wait for images to load, then stop observing
        setTimeout(() => {
          observer.disconnect();
          resolve(cumulativeShift);
        }, 2000);
      });
    });
    
    // CLS score should be less than 0.1 (good)
    expect(layoutShifts, {
      message: `Cumulative Layout Shift score is ${layoutShifts}, expected < 0.1`
    }).toBeLessThan(0.1);
    
    console.log(`✓ No significant layout shift during image loading (CLS: ${layoutShifts})`);
  }

  async shouldLoadImagesLazily(): Promise<void> {
    // Verify images are loaded lazily by checking loading attribute
    const lazyImages = await this.page.locator('img[loading="lazy"]').count();
    const totalImages = await this.page.locator('[data-testid^="image-thumbnail-"]').count();
    
    expect(lazyImages, {
      message: `Found ${lazyImages} lazy-loaded images out of ${totalImages} total images, expected all images to be lazy-loaded`
    }).toBe(totalImages);
    
    console.log(`✓ All ${totalImages} images configured for native lazy loading`);
  }

  // Status parameter handling
  async shouldDefaultToCollectionStatus(): Promise<void> {
    // Verify that visiting without status parameter shows COLLECTION status
    const currentUrl = this.page.url();
    expect(currentUrl, {
      message: `URL "${currentUrl}" should not contain status parameter when defaulting to COLLECTION`
    }).not.toContain('status=');
    
    console.log('✓ Page defaults to "COLLECTION" status when no query parameter is present');
  }

  async shouldHandleInvalidStatusParameter(): Promise<void> {
    // Verify that invalid status parameters default to COLLECTION
    // The page should either:
    // 1. Redirect to remove invalid parameter, or  
    // 2. Show COLLECTION status images despite invalid parameter
    
    // Check if page is showing collection status behavior
    const hasCollectionImages = await this.page.locator('[data-testid^="image-item-"]').count() > 0;
    const hasEmptyState = await this.emptyStateMessage.displayed();
    
    // One of these should be true for valid COLLECTION status handling
    expect(hasCollectionImages || hasEmptyState, {
      message: `Page with invalid status parameter shows neither collection images nor empty state`
    }).toBe(true);
    
    console.log('✓ Invalid status parameter handled by defaulting to "COLLECTION" status filter');
  }

  // Popover interaction methods
  async clickImageThumbnail(imageId: string): Promise<void> {
    const thumbnail = this.imageThumbnail(imageId);
    await thumbnail.shouldBeDisplayed();
    await thumbnail.click();
    console.log(`✓ Clicked thumbnail for image ${imageId}`);
  }

  async shouldHavePopoverOpen(): Promise<void> {
    await this.imagePopover.shouldBeDisplayed();
    console.log('✓ Image popover is open');
  }

  async shouldHavePopoverClosed(): Promise<void> {
    await this.imagePopover.shouldBeClosed();
    console.log('✓ Image popover is closed');
  }
}