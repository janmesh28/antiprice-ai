import { Controller, Post, Get, Body, Param, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body('messages') messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
    if (!messages || !Array.isArray(messages)) {
      throw new BadRequestException('Messages list must be provided.');
    }
    return this.aiService.assistantChat(messages);
  }

  @Get(':productId/reviews')
  async getReviewAnalysis(@Param('productId') productId: string) {
    if (!productId) {
      throw new BadRequestException('productId is required.');
    }
    return this.aiService.analyzeReviews(productId);
  }

  @Get(':productId/predict')
  async getPricePrediction(@Param('productId') productId: string) {
    if (!productId) {
      throw new BadRequestException('productId is required.');
    }
    return this.aiService.predictPrice(productId);
  }
}
