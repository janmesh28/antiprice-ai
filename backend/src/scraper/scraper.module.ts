import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScraperService } from './scraper.service';
import { ScraperProcessor, SCRAPE_QUEUE } from './scraper.processor';
import { AmazonScraper } from './scrapers/amazon.scraper';
import { FlipkartScraper } from './scrapers/flipkart.scraper';
import { CromaScraper } from './scrapers/croma.scraper';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SCRAPE_QUEUE,
    }),
  ],
  providers: [
    ScraperService,
    ScraperProcessor,
    AmazonScraper,
    FlipkartScraper,
    CromaScraper,
  ],
  exports: [ScraperService, BullModule],
})
export class ScraperModule {}
