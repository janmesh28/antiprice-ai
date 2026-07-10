import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ScraperModule } from '../scraper/scraper.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [ScraperModule, SearchModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
