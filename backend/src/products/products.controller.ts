import { Controller, Get, Query, Param } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      return [];
    }
    return this.productsService.searchAndCompare(query);
  }

  @Get('recommendations')
  async getRecommendations(
    @Query('category') category?: string,
    @Query('budget') budget?: string,
  ) {
    const maxBudget = budget ? parseFloat(budget) : undefined;
    return this.productsService.getRecommendations(category, maxBudget);
  }

  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return this.productsService.getProductDetails(id);
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return this.productsService.getPriceHistory(id);
  }
}
