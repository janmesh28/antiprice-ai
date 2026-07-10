import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ScraperService } from './scraper.service';
import { ScrapeJobData } from './interfaces/scrape-job.interface';

export const SCRAPE_QUEUE = 'scrape-queue';

@Processor(SCRAPE_QUEUE)
export class ScraperProcessor {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(private readonly scraperService: ScraperService) {}

  @Process('scrape-search')
  async handleScrapeSearch(job: Job<ScrapeJobData>) {
    this.logger.log(`Processing scrape job: ${job.id} — query: "${job.data.query}"`);
    try {
      const results = await this.scraperService.scrapeAllPlatforms(job.data.query);
      this.logger.log(`Job ${job.id} completed with ${results.length} results`);
      return results;
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error}`);
      throw error;
    }
  }

  @Process('scrape-platform')
  async handleScrapePlatform(job: Job<ScrapeJobData>) {
    this.logger.log(`Processing platform scrape: ${job.data.platform} — "${job.data.query}"`);
    return this.scraperService.scrapeByPlatform(job.data.query, job.data.platform);
  }
}
