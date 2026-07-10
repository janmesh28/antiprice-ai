import { Injectable, Logger } from '@nestjs/common';
import { BaseScraper } from '../base/base.scraper';
import { ScrapedProduct } from '../interfaces/scraped-product.interface';

@Injectable()
export class CromaScraper extends BaseScraper {
  constructor() {
    super('Croma');
  }

  async scrapeSearch(query: string): Promise<ScrapedProduct[]> {
    const results: ScrapedProduct[] = [];
    const browser = await this.launchBrowser();
    const context = await this.createStealthContext(browser);
    const page = await context.newPage();

    try {
      const searchUrl = `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&langCode=en`;
      this.logger.log(`Scraping Croma for: ${query}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(2500);

      await page.waitForSelector('.product-item', { timeout: 15000 }).catch(() => {});
      const items = await page.$$('.product-item');
      this.logger.log(`Found ${items.length} Croma results`);

      for (const item of items.slice(0, 10)) {
        try {
          const name = await item.$eval(
            'h3.product-title a',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');
          if (!name) continue;

          const priceStr = await item.$eval(
            '.new-price, .amount',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');
          const price = this.parsePrice(priceStr);
          if (!price) continue;

          const originalPriceStr = await item.$eval(
            '.old-price',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');
          const originalPrice = this.parsePrice(originalPriceStr);

          const imageUrl = await item.$eval(
            'img.product-img',
            (el) => el.getAttribute('src') ?? '',
          ).catch(() => '');

          const productHref = await item.$eval(
            'h3.product-title a',
            (el) => el.getAttribute('href') ?? '',
          ).catch(() => '');

          results.push({
            name,
            price,
            originalPrice: originalPrice || undefined,
            imageUrl,
            url: `https://www.croma.com${productHref}`,
            platform: 'Croma',
            inStock: true,
            discount: this.calculateDiscount(originalPrice, price),
          });
        } catch (e) {
          this.logger.warn(`Error parsing Croma item: ${e}`);
        }
      }
    } catch (error) {
      this.logger.error(`Croma scrape failed: ${error}`);
    } finally {
      await context.close();
      await this.closeBrowser();
    }

    return results;
  }
}
