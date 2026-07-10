import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'products';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleInit() {
    await this.createIndexIfNotExists();
  }

  private async createIndexIfNotExists() {
    try {
      const exists = await this.elasticsearchService.indices.exists({
        index: this.indexName,
      });

      if (!exists) {
        await this.elasticsearchService.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { type: 'text', analyzer: 'english' },
              description: { type: 'text', analyzer: 'english' },
              brand: { type: 'keyword' },
              category: { type: 'keyword' },
              imageUrl: { type: 'keyword', index: false },
              minPrice: { type: 'float' },
              maxPrice: { type: 'float' },
              updatedAt: { type: 'date' },
            },
          },
        });
        this.logger.log(`Elasticsearch index "${this.indexName}" created successfully.`);
      }
    } catch (error) {
      this.logger.error(`Error checking/creating index: ${error}`);
    }
  }

  async indexProduct(product: {
    id: string;
    name: string;
    description?: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
    minPrice: number;
    maxPrice: number;
  }) {
    try {
      await this.elasticsearchService.index({
        index: this.indexName,
        id: product.id,
        document: {
          id: product.id,
          name: product.name,
          description: product.description || '',
          brand: product.brand || '',
          category: product.category || '',
          imageUrl: product.imageUrl || '',
          minPrice: product.minPrice,
          maxPrice: product.maxPrice,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to index product ${product.id}: ${error}`);
    }
  }

  async searchProducts(query: string) {
    try {
      const result = await this.elasticsearchService.search({
        index: this.indexName,
        query: {
          multi_match: {
            query,
            fields: ['name^3', 'brand^2', 'category', 'description'],
            fuzziness: 'AUTO',
          },
        },
      });

      const hits = result.hits.hits;
      return hits.map((hit) => hit._source);
    } catch (error) {
      this.logger.error(`Search error: ${error}`);
      return [];
    }
  }
}
