import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const node = config.get<string>(
          'ELASTICSEARCH_URL',
          'http://localhost:9200',
        );

        const apiKey = config.get<string>('ELASTICSEARCH_API_KEY');

        return {
          node,
          ...(apiKey
            ? {
                auth: {
                  apiKey,
                },
              }
            : {}),
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}