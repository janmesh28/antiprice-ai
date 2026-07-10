import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { ScrapedProduct } from '../interfaces/scraped-product.interface';
import { Logger } from '@nestjs/common';

export abstract class BaseScraper {
  protected readonly logger: Logger;
  protected browser: Browser | null = null;

  constructor(protected readonly platform: string) {
    this.logger = new Logger(`${platform}Scraper`);
  }

  abstract scrapeSearch(query: string): Promise<ScrapedProduct[]>;

  protected async launchBrowser(): Promise<Browser> {
    this.browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
    return this.browser;
  }

  protected async createStealthContext(browser: Browser): Promise<BrowserContext> {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'en-IN',
      timezoneId: 'Asia/Kolkata',
      viewport: { width: 1366, height: 768 },
      extraHTTPHeaders: {
        'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8',
      },
    });
    return context;
  }

  protected async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    const cleaned = priceStr.replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  protected calculateDiscount(original: number, current: number): number {
    if (!original || !current || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  }

  protected async safeGetText(page: Page, selector: string): Promise<string> {
    try {
      const el = await page.$(selector);
      return el ? (await el.textContent())?.trim() ?? '' : '';
    } catch {
      return '';
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
