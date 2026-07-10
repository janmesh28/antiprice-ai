import { Injectable, Logger } from '@nestjs/common';
import { BaseScraper } from '../base/base.scraper';
import { ScrapedProduct } from '../interfaces/scraped-product.interface';

@Injectable()
export class AmazonScraper extends BaseScraper {
  constructor() {
    super('Amazon');
  }

  async scrapeSearch(query: string): Promise<ScrapedProduct[]> {
    const results: ScrapedProduct[] = [];
    const browser = await this.launchBrowser();
    const context = await this.createStealthContext(browser);
    const page = await context.newPage();

    try {
      const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(query)}&ref=nb_sb_noss`;
      this.logger.log(`Scraping Amazon for: ${query}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await this.delay(2000);

      // Accept cookies if prompted
      const cookieBtn = await page.$('input[data-cel-widget="sp-cc-accept"]');
      if (cookieBtn) await cookieBtn.click();

      await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 15000 }).catch(() => {});

      const items = await page.$$('[data-component-type="s-search-result"]');
      this.logger.log(`Found ${items.length} Amazon results`);

      for (const item of items.slice(0, 10)) {
        try {
          const name = await item.$eval(
            'h2 .a-link-normal span',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');

          if (!name) continue;

          const priceWhole = await item.$eval(
            '.a-price .a-price-whole',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');

          const priceFraction = await item.$eval(
            '.a-price .a-price-fraction',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '00');

          const priceStr = `${priceWhole}${priceFraction}`;
          const price = this.parsePrice(priceStr);
          if (!price) continue;

          const originalPriceStr = await item.$eval(
            '.a-text-price span.a-offscreen',
            (el) => el.textContent?.trim() ?? '',
          ).catch(() => '');
          const originalPrice = this.parsePrice(originalPriceStr);

          const imageUrl = await item.$eval(
            '.s-product-image-container img',
            (el) => el.getAttribute('src') ?? '',
          ).catch(() => '');

          const productUrl = await item.$eval(
            'h2 .a-link-normal',
            (el) => `https://www.amazon.in${el.getAttribute('href') ?? ''}`,
          ).catch(() => '');

          const rating = await item.$eval(
            '.a-icon-star-small .a-icon-alt',
            (el) => parseFloat(el.textContent?.split(' ')[0] ?? '0'),
          ).catch(() => 0);

          const reviewCount = await item.$eval(
            '.s-link-style .s-underline-text',
            (el) => parseInt(el.textContent?.replace(/[^0-9]/g, '') ?? '0', 10),
          ).catch(() => 0);

          const inStock = !(await item.$('.a-color-price').then(
            async (el) => (await el?.textContent())?.includes('unavailable') ?? false,
          ).catch(() => false));

          results.push({
            name,
            price,
            originalPrice: originalPrice || undefined,
            imageUrl,
            url: productUrl,
            platform: 'Amazon',
            inStock,
            rating,
            reviewCount,
            discount: this.calculateDiscount(originalPrice, price),
          });
        } catch (e) {
          this.logger.warn(`Error parsing Amazon item: ${e}`);
        }
      }
    } catch (error) {
      this.logger.error(`Amazon scrape failed: ${error}`);
    } finally {
      await context.close();
      await this.closeBrowser();
    }

    return results;
  }
}
