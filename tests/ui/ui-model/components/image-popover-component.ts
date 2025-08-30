import { expect } from 'playwright/test';
import { Element } from '../element';

export class ImagePopoverComponent extends Element {
  get popoverImage(): Element {
    return this.child(Element, 'Popover Image', 'img');
  }

  get backdrop(): Element {
    return new Element('Popover Backdrop', '[data-testid="popover-backdrop"]', this.page);
  }

  async shouldDisplayFullSizeImage(imageId: string): Promise<void> {
    await this.shouldBeDisplayed();
    await this.popoverImage.shouldBeDisplayed();
    
    // Verify the image is loading the full resolution version, not thumbnail
    const src = await this.page.locator(this.popoverImage.selector).getAttribute('src');
    expect(src, {
      message: `Popover image src is "${src}" instead of full resolution image path`
    }).toContain(`/api/images/`);
    expect(src, {
      message: `Popover image src "${src}" contains "/thumbnail" when it should be full resolution`
    }).not.toContain('/thumbnail');
    expect(src, {
      message: `Popover image src "${src}" does not contain expected image ID "${imageId}"`
    }).toContain(imageId);
    
    console.log(`✓ Popover displays full resolution image for ${imageId}`);
  }

  async shouldBeCenteredInViewport(): Promise<void> {
    await this.shouldBeDisplayed();
    
    const popoverPosition = await this.page.evaluate(() => {
      const popover = document.querySelector('[data-testid="image-popover"]') as HTMLElement;
      if (!popover) return null;
      
      const rect = popover.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        viewportCenterX: viewport.width / 2,
        viewportCenterY: viewport.height / 2
      };
    });

    expect(popoverPosition, {
      message: 'Could not determine popover position'
    }).toBeTruthy();

    const tolerance = 5; // Allow 5px tolerance for centering
    expect(Math.abs(popoverPosition!.centerX - popoverPosition!.viewportCenterX), {
      message: `Popover is horizontally centered at ${popoverPosition!.centerX}px instead of viewport center ${popoverPosition!.viewportCenterX}px`
    }).toBeLessThanOrEqual(tolerance);

    expect(Math.abs(popoverPosition!.centerY - popoverPosition!.viewportCenterY), {
      message: `Popover is vertically centered at ${popoverPosition!.centerY}px instead of viewport center ${popoverPosition!.viewportCenterY}px`
    }).toBeLessThanOrEqual(tolerance);

    console.log('✓ Popover is centered in viewport');
  }

  async shouldDisplayImageAtNativeSize(): Promise<void> {
    await this.shouldBeDisplayed();
    
    const imageDimensions = await this.page.evaluate(() => {
      const img = document.querySelector('[data-testid="image-popover"] img') as HTMLImageElement;
      if (!img) return null;
      
      return {
        displayedWidth: img.width,
        displayedHeight: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      };
    });

    expect(imageDimensions, {
      message: 'Could not determine popover image dimensions'
    }).toBeTruthy();

    expect(imageDimensions!.displayedWidth, {
      message: `Popover image displayed width is ${imageDimensions!.displayedWidth}px instead of native width ${imageDimensions!.naturalWidth}px`
    }).toBe(imageDimensions!.naturalWidth);

    expect(imageDimensions!.displayedHeight, {
      message: `Popover image displayed height is ${imageDimensions!.displayedHeight}px instead of native height ${imageDimensions!.naturalHeight}px`
    }).toBe(imageDimensions!.naturalHeight);

    console.log(`✓ Popover image displays at native size (${imageDimensions!.naturalWidth}x${imageDimensions!.naturalHeight})`);
  }

  async shouldDisplayImageScaledToFitViewport(): Promise<void> {
    await this.shouldBeDisplayed();
    
    const scaleInfo = await this.page.evaluate(() => {
      const img = document.querySelector('[data-testid="image-popover"] img') as HTMLImageElement;
      if (!img) return null;
      
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const margin = 0.05; // 5% margin
      const maxWidth = viewport.width * (1 - margin * 2);
      const maxHeight = viewport.height * (1 - margin * 2);
      
      return {
        displayedWidth: img.width,
        displayedHeight: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        maxAllowedWidth: maxWidth,
        maxAllowedHeight: maxHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        displayedAspectRatio: img.width / img.height
      };
    });

    expect(scaleInfo, {
      message: 'Could not determine popover image scale information'
    }).toBeTruthy();

    // Verify image is scaled down (not at native size)
    const isScaled = scaleInfo!.displayedWidth < scaleInfo!.naturalWidth || 
                    scaleInfo!.displayedHeight < scaleInfo!.naturalHeight;
    expect(isScaled, {
      message: `Image displayed at ${scaleInfo!.displayedWidth}x${scaleInfo!.displayedHeight} which equals native size ${scaleInfo!.naturalWidth}x${scaleInfo!.naturalHeight}, expected to be scaled down`
    }).toBe(true);

    // Verify image fits within viewport with 5% margin
    expect(scaleInfo!.displayedWidth, {
      message: `Scaled image width ${scaleInfo!.displayedWidth}px exceeds maximum allowed width ${scaleInfo!.maxAllowedWidth}px (viewport with 5% margin)`
    }).toBeLessThanOrEqual(scaleInfo!.maxAllowedWidth);

    expect(scaleInfo!.displayedHeight, {
      message: `Scaled image height ${scaleInfo!.displayedHeight}px exceeds maximum allowed height ${scaleInfo!.maxAllowedHeight}px (viewport with 5% margin)`
    }).toBeLessThanOrEqual(scaleInfo!.maxAllowedHeight);

    // Verify aspect ratio is maintained
    const aspectRatioTolerance = 0.01;
    expect(Math.abs(scaleInfo!.aspectRatio - scaleInfo!.displayedAspectRatio), {
      message: `Image aspect ratio changed from ${scaleInfo!.aspectRatio} to ${scaleInfo!.displayedAspectRatio}, expected to maintain original aspect ratio`
    }).toBeLessThanOrEqual(aspectRatioTolerance);

    console.log(`✓ Popover image scaled to fit viewport (${scaleInfo!.displayedWidth}x${scaleInfo!.displayedHeight}) while maintaining aspect ratio`);
  }

  async shouldApplyBackgroundEffects(): Promise<void> {
    await this.shouldBeDisplayed();
    
    // Check for blur and overlay effects on page background
    const backgroundEffects = await this.page.evaluate(() => {
      const body = document.body;
      const backdrop = document.querySelector('[data-testid="popover-backdrop"]');
      
      return {
        hasBlurClass: body.classList.contains('popover-blur') || 
                     body.classList.contains('blur') ||
                     !!document.querySelector('.popover-blur'),
        hasBackdrop: !!backdrop,
        backdropVisible: backdrop ? window.getComputedStyle(backdrop).display !== 'none' : false
      };
    });

    expect(backgroundEffects.hasBlurClass, {
      message: 'Page does not have blur effect applied when popover is open'
    }).toBe(true);

    expect(backgroundEffects.hasBackdrop, {
      message: 'Popover backdrop element not found in DOM'
    }).toBe(true);

    expect(backgroundEffects.backdropVisible, {
      message: 'Popover backdrop is not visible (display: none)'
    }).toBe(true);

    console.log('✓ Background blur and semi-transparent overlay effects applied');
  }

  async shouldDisableOtherThumbnails(): Promise<void> {
    const thumbnailsDisabled = await this.page.evaluate(() => {
      const thumbnails = Array.from(document.querySelectorAll('[data-testid^="image-thumbnail-"]'));
      let disabledCount = 0;
      
      for (const thumbnail of thumbnails) {
        const isDisabled = (thumbnail as HTMLElement).style.pointerEvents === 'none' ||
                          thumbnail.hasAttribute('disabled') ||
                          thumbnail.classList.contains('disabled');
        if (isDisabled) disabledCount++;
      }
      
      return {
        totalThumbnails: thumbnails.length,
        disabledThumbnails: disabledCount
      };
    });

    expect(thumbnailsDisabled.disabledThumbnails, {
      message: `Only ${thumbnailsDisabled.disabledThumbnails} out of ${thumbnailsDisabled.totalThumbnails} thumbnails are disabled, expected all thumbnails to be disabled when popover is open`
    }).toBe(thumbnailsDisabled.totalThumbnails);

    console.log(`✓ All ${thumbnailsDisabled.totalThumbnails} thumbnails disabled for interaction when popover is open`);
  }

  async closeByClickingOutside(): Promise<void> {
    await this.shouldBeDisplayed();
    
    // Click on the backdrop area (outside the image)  
    await this.backdrop.click();
    
    console.log('✓ Clicked outside popover image to close');
  }

  async closeByEscapeKey(): Promise<void> {
    await this.shouldBeDisplayed();
    
    await this.page.keyboard.press('Escape');
    
    console.log('✓ Pressed ESC key to close popover');
  }

  async shouldBeClosed(): Promise<void> {
    await this.shouldNotBeDisplayed();
    
    // Verify background effects are removed
    const backgroundEffectsRemoved = await this.page.evaluate(() => {
      const body = document.body;
      const backdrop = document.querySelector('[data-testid="popover-backdrop"]');
      
      return {
        hasNoBlurClass: !body.classList.contains('popover-blur') && 
                       !body.classList.contains('blur') &&
                       !document.querySelector('.popover-blur'),
        hasNoBackdrop: !backdrop || window.getComputedStyle(backdrop).display === 'none'
      };
    });

    expect(backgroundEffectsRemoved.hasNoBlurClass, {
      message: 'Page still has blur effect applied after popover closed'
    }).toBe(true);

    expect(backgroundEffectsRemoved.hasNoBackdrop, {
      message: 'Popover backdrop is still visible after popover closed'
    }).toBe(true);

    // Verify thumbnails are re-enabled
    const thumbnailsReenabled = await this.page.evaluate(() => {
      const thumbnails = Array.from(document.querySelectorAll('[data-testid^="image-thumbnail-"]'));
      let enabledCount = 0;
      
      for (const thumbnail of thumbnails) {
        const isEnabled = (thumbnail as HTMLElement).style.pointerEvents !== 'none' &&
                         !thumbnail.hasAttribute('disabled') &&
                         !thumbnail.classList.contains('disabled');
        if (isEnabled) enabledCount++;
      }
      
      return {
        totalThumbnails: thumbnails.length,
        enabledThumbnails: enabledCount
      };
    });

    expect(thumbnailsReenabled.enabledThumbnails, {
      message: `Only ${thumbnailsReenabled.enabledThumbnails} out of ${thumbnailsReenabled.totalThumbnails} thumbnails are enabled, expected all thumbnails to be re-enabled when popover is closed`
    }).toBe(thumbnailsReenabled.totalThumbnails);

    console.log('✓ Popover closed, background effects removed, and thumbnails re-enabled');
  }
}