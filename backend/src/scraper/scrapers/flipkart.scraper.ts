import { Injectable, Logger } from '@nestjs/common';
import { BaseScraper } from '../base/base.scraper';
import { ScrapedProduct } from '../interfaces/scraped-product.interface';

@Injectable()
export class FlipkartScraper extends BaseScraper {
  constructor() {
    super('Flipkart');
  }

  async scrapeSearch(query: string): Promise<ScrapedProduct[]> {
    const results: ScrapedProduct[] = [];
    const browser = await this.launchBrowser();
    const context = await this.createStealthContext(browser);
    const page = await context.newPage();

    try {
      const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
      this.logger.log(`Scraping Flipkart for: ${query}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(2000);

      // Close login popup if it appears
      const closeBtn = await page.$('button._2KpZ6l._2doB4z');
      if (closeBtn) await closeBtn.click();

      // Wait for product grid
      await page.waitForSelector('div._1AtVbE', { timeout: 15000 }).catch(() => {});

      // Flipkart uses different containers — try multiple selectors
      const productCards = await page.$$('div._2kHMtA, div.cPHDOP, div._1xHGtK');
      this.logger.log(`Found ${productCards.length} Flipkart results`);

      for (const card of productCards.slice(0, 10)) {
        try {
          const name = await card.$eval(
            'div._4rR01T, a.s1Q9rs, div.KzDlHZ',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');

          if (!name) continue;

          const priceStr = await card.$eval(
            'div._30jeq3, div.Nx9bqj',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');
          const price = this.parsePrice(priceStr);
          if (!price) continue;

          const originalPriceStr = await card.$eval(
            'div._3I9_wc, div.yRaY8j',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');
          const originalPrice = this.parsePrice(originalPriceStr);

          const discountStr = await card.$eval(
            'div._3Ay6Sb span, div.UkUFwK span',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');

          const imageUrl = await card.$eval(
            'img._396cs4, img.DByuf4',
            (el) => el.getAttribute('src') ?? '',
          ).catch(() => '');

          const productUrl = await card.$eval(
            'a._1fQZEK, a.IRpwTa, a.s1Q9rs',
            (el) => `https://www.flipkart.com${el.getAttribute('href') ?? ''}`,
          ).catch(() => '');

          const ratingStr = await card.$eval(
            'div._3LWZlK',
            (el) => el.textContent?.trim() ?? '0',
          ).catch(() => '0');

          const reviewStr = await card.$eval(
            'span._2_R_DZ span, span._13vcmD',
            (el) => el.textContent?.replace(/[^0-9]/g, '') ?? '0',
          ).catch(() => '0');

          results.push({
            name,
            price,
            originalPrice: originalPrice || undefined,
            imageUrl,
            url: productUrl,
            platform: 'Flipkart',
            inStock: true,
            rating: parseFloat(ratingStr) || 0,
            reviewCount: parseInt(reviewStr, 10) || 0,
            discount: this.calculateDiscount(originalPrice, price) || parseInt(discountStr, 10) || 0,
          });
        } catch (e) {
          this.logger.warn(`Error parsing Flipkart item: ${e}`);
        }
      }
    } catch (error) {
      this.logger.error(`Flipkart scrape failed: ${error}`);
    } finally {
      await context.close();
      await this.closeBrowser();
    }

    return results;
  }
}
