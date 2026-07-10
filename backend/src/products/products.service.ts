import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricePoint } from '@prisma/client';
import { SearchService } from '../search/search.service';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { SCRAPE_QUEUE } from '../scraper/scraper.processor';
import { ScraperService } from '../scraper/scraper.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly scraperService: ScraperService,
    @InjectQueue(SCRAPE_QUEUE) private readonly scrapeQueue: Queue,
  ) {}

  async searchAndCompare(query: string) {
    this.logger.log(`User query received: "${query}"`);

    // 1. Search locally or via Elasticsearch
    let products = await this.searchService.searchProducts(query);

    // Local DB fallback search if Elasticsearch is down/empty
    if (products.length === 0) {
      this.logger.log(`No results from search index. Trying local database...`);
      const dbProducts = await this.prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 10,
      });
      products = dbProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? '',
        brand: p.brand ?? '',
        category: p.category ?? '',
        imageUrl: p.imageUrl ?? '',
      }));
    }

    // 2. If nothing or very little in cache/DB, trigger immediate scrape synchronously for immediate feedback
    if (products.length === 0) {
      this.logger.log(`No results found in cache. Running real-time scrapers...`);
      const scraped = await this.scraperService.scrapeAllPlatforms(query);
      
      // Index new products into Elasticsearch
      for (const item of scraped) {
        const dbProduct = await this.prisma.product.findFirst({
          where: { name: item.name },
          include: { pricePoints: true },
        });

        if (dbProduct) {
          const prices = dbProduct.pricePoints.map((p: PricePoint) => p.price);
          await this.searchService.indexProduct({
            id: dbProduct.id,
            name: dbProduct.name,
            imageUrl: dbProduct.imageUrl ?? undefined,
            minPrice: Math.min(...prices, item.price),
            maxPrice: Math.max(...prices, item.price),
            category: dbProduct.category ?? undefined,
          });
        }
      }

      // Re-search to get structured results from Elasticsearch or local DB
      products = await this.searchService.searchProducts(query);
      if (products.length === 0) {
        const dbProducts = await this.prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { description: { contains: query } },
            ],
          },
          take: 10,
        });
        products = dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description ?? '',
          brand: p.brand ?? '',
          category: p.category ?? '',
          imageUrl: p.imageUrl ?? '',
        }));
      }
    } else {
      // If we did have results, trigger a background refresh job via BullMQ
      this.logger.log(`Found ${products.length} cached results. Queueing refresh job...`);
      try {
        await this.scrapeQueue.add('scrape-search', { query }, {
          attempts: 2,
          backoff: 5000,
        });
      } catch (error) {
        this.logger.warn(`Failed to add background job to queue: ${error.message || error}`);
      }
    }

    // 3. For each search hit, query DB to get the latest price points from all platforms
    const comparisonResults = [];
    for (const p of products) {
      const dbProduct = await this.prisma.product.findUnique({
        where: { id: (p as any).id },
        include: {
          pricePoints: {
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      if (dbProduct && dbProduct.pricePoints.length > 0) {
        // Filter distinct by platform in memory
        const distinctPricePoints = this.getLatestDistinctByPlatform(dbProduct.pricePoints);

        // Find cheapest, fastest (mocked/delivery info), best deal (deal score)
        const activeDeals = distinctPricePoints.map((pt: PricePoint) => ({
          ...pt,
          dealScore: this.scraperService.computeDealScore(
            {
              name: dbProduct.name,
              price: pt.price,
              originalPrice: pt.original ?? undefined,
              platform: pt.platform,
              url: pt.url,
              inStock: pt.inStock,
            },
            distinctPricePoints.map((origPt: PricePoint) => ({
              name: dbProduct.name,
              price: origPt.price,
              originalPrice: origPt.original ?? undefined,
              platform: origPt.platform,
              url: origPt.url,
              inStock: origPt.inStock,
            }))
          )
        }));

        const cheapest = [...activeDeals].sort((a, b) => a.price - b.price)[0];
        const bestDeal = [...activeDeals].sort((a, b) => b.dealScore - a.dealScore)[0];

        comparisonResults.push({
          id: dbProduct.id,
          name: dbProduct.name,
          imageUrl: dbProduct.imageUrl,
          description: dbProduct.description,
          deals: activeDeals,
          summary: {
            cheapestPlatform: cheapest?.platform,
            lowestPrice: cheapest?.price,
            bestDealPlatform: bestDeal?.platform,
            bestDealScore: bestDeal?.dealScore,
            totalDeals: activeDeals.length,
          }
        });
      }
    }

    return comparisonResults;
  }

  async getPriceHistory(productId: string) {
    const pricePoints = await this.prisma.pricePoint.findMany({
      where: { productId },
      orderBy: { timestamp: 'asc' },
    });

    // Group by day/week or return raw for frontend graphing
    return pricePoints.map((pt: PricePoint) => ({
      platform: pt.platform,
      price: pt.price,
      timestamp: pt.timestamp,
    }));
  }

  async getProductDetails(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        pricePoints: {
          orderBy: { timestamp: 'desc' },
        },
        reviews: true,
      },
    });
  }

  async getRecommendations(category?: string, maxBudget?: number) {
    const products = await this.prisma.product.findMany({
      where: category ? { category: { contains: category } } : {},
      include: {
        pricePoints: {
          orderBy: { timestamp: 'desc' },
        },
      },
      take: 10,
    });

    const recommendations = products.map((p) => {
      const activeDeals = this.getLatestDistinctByPlatform(p.pricePoints);
      const cheapest = [...activeDeals].sort((a, b) => a.price - b.price)[0];
      
      const dealScore = cheapest
        ? this.scraperService.computeDealScore(
            {
              name: p.name,
              price: cheapest.price,
              originalPrice: cheapest.original ?? undefined,
              platform: cheapest.platform,
              url: cheapest.url,
              inStock: cheapest.inStock,
            },
            activeDeals.map((pt: PricePoint) => ({
              name: p.name,
              price: pt.price,
              originalPrice: pt.original ?? undefined,
              platform: pt.platform,
              url: pt.url,
              inStock: pt.inStock,
            }))
          )
        : 50;

      return {
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        category: p.category,
        price: cheapest?.price || 0,
        dealScore,
      };
    });

    return recommendations
      .filter((r) => !maxBudget || r.price <= maxBudget)
      .sort((a, b) => b.dealScore - a.dealScore);
  }

  private getLatestDistinctByPlatform(pricePoints: PricePoint[]): PricePoint[] {
    const map = new Map<string, PricePoint>();
    for (const pt of pricePoints) {
      if (!map.has(pt.platform)) {
        map.set(pt.platform, pt);
      }
    }
    return Array.from(map.values());
  }
}
