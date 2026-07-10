import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || 'dummy-key';
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyzes reviews of a product using AI.
   * Generates a summary, sentiment score, pros/cons, and a reliability score.
   */
  async analyzeReviews(productId: string) {
    this.logger.log(`Analyzing reviews for product: ${productId}`);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { reviews: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const reviews = product.reviews;
    if (reviews.length === 0) {
      return {
        summary: 'No user reviews available yet for this product.',
        sentimentScore: 70, // neutral default
        praises: ['Good default specs'],
        complaints: ['No feedback yet'],
        reliabilityScore: 80,
      };
    }

    const reviewsText = reviews
      .map((r) => `[Rating: ${r.rating}/5] Comment: ${r.comment || 'N/A'}`)
      .join('\n');

    try {
      // If a dummy key is configured, fallback to simulated analysis to avoid throwing exceptions
      if (this.configService.get<string>('OPENAI_API_KEY') === 'your-openai-api-key-here' || !this.configService.get<string>('OPENAI_API_KEY')) {
        return this.simulateReviewAnalysis(reviews);
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert product analyst. Analyze the provided reviews and return a JSON summary. Structure: { "summary": string, "sentimentScore": number (0-100), "praises": string[], "complaints": string[], "reliabilityScore": number (0-100) }',
          },
          {
            role: 'user',
            content: `Product Name: ${product.name}\nReviews:\n${reviewsText}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message?.content || '{}');
      return result;
    } catch (error) {
      this.logger.error(`AI analysis failed: ${error}`);
      return this.simulateReviewAnalysis(reviews);
    }
  }

  private simulateReviewAnalysis(reviews: any[]) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = totalRating / reviews.length;
    const sentimentScore = Math.round((average / 5) * 100);

    return {
      summary: `Analyzed ${reviews.length} user reviews. Overall, customers rate the product at ${average.toFixed(1)}/5 stars. Good quality standard options.`,
      sentimentScore,
      praises: ['Good build quality', 'Reliable performance for daily tasks'],
      complaints: ['Standard delivery takes time', 'Slightly premium pricing'],
      reliabilityScore: Math.min(85, Math.max(50, sentimentScore - 5)),
    };
  }

  /**
   * AI Shopping Assistant Chatbot logic.
   * Provides reasoning-based recommendations.
   */
  async assistantChat(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
    try {
      // Fetch some popular products to provide real context
      const products = await this.prisma.product.findMany({
        take: 10,
        include: {
          pricePoints: {
            orderBy: { timestamp: 'desc' },
            distinct: ['platform'],
          },
        },
      });

      const contextText = products
        .map(
          (p) =>
            `- ${p.name}: Prices: [${p.pricePoints
              .map((pt) => `${pt.platform}: ₹${pt.price}`)
              .join(', ')}]`,
        )
        .join('\n');

      const systemPrompt = {
        role: 'system' as const,
        content: `You are AntiPrice AI Assistant, a world-class price intelligence assistant. Helper for buying electronics in India.
Here are some products currently in our comparison database:\n${contextText}\n
Help the user compare specs, find cheapest platforms, and give clear budget/performance arguments. Always be concise.`,
      };

      if (this.configService.get<string>('OPENAI_API_KEY') === 'your-openai-api-key-here' || !this.configService.get<string>('OPENAI_API_KEY')) {
        return {
          content: `Hello! I am AntiPrice AI. I see you're asking about electronics. (Note: OpenAI API Key not configured; showing mock response). 
Based on our database, you can compare top products like ASUS Zenbook or MacBook Air. Let me know which one you prefer, or ask for the cheapest RTX laptop under your budget!`,
        };
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [systemPrompt, ...messages],
      });

      return {
        content: response.choices[0].message?.content || '',
      };
    } catch (error) {
      this.logger.error(`AI chatbot failed: ${error}`);
      return {
        content: 'I apologize, but I am currently offline. Please try again later.',
      };
    }
  }

  /**
   * Simple linear regression price prediction model.
   * Forecasts price changes for the next 7 and 30 days based on price trends.
   */
  async predictPrice(productId: string) {
    const pricePoints = await this.prisma.pricePoint.findMany({
      where: { productId },
      orderBy: { timestamp: 'asc' },
    });

    if (pricePoints.length < 3) {
      return {
        trend: 'STABLE',
        predictionText: 'Insufficent historical data to predict price movements.',
        expectedPrice7Days: null,
        expectedPrice30Days: null,
        confidence: 0,
      };
    }

    // Convert timestamps to timestamps relative to first point
    const t0 = pricePoints[0].timestamp.getTime();
    const x = pricePoints.map((pt) => (pt.timestamp.getTime() - t0) / (1000 * 60 * 60 * 24)); // in days
    const y = pricePoints.map((pt) => pt.price);

    const n = x.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
    }

    // Slope (m) and Intercept (c)
    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const c = (sumY - m * sumX) / n;

    const lastX = x[n - 1];
    const currentPrice = y[n - 1];

    const priceIn7Days = Math.round(m * (lastX + 7) + c);
    const priceIn30Days = Math.round(m * (lastX + 30) + c);

    let trend = 'STABLE';
    let predictionText = 'Prices are projected to remain stable.';
    let confidence = 75; // baseline confidence

    if (m < -5) {
      trend = 'DOWNWARD';
      predictionText = `Price is expected to drop to around ₹${priceIn7Days} in the next week. Recommended to WAIT for a potential deal!`;
      confidence = Math.min(95, 75 + Math.abs(m) * 2);
    } else if (m > 5) {
      trend = 'UPWARD';
      predictionText = `Price is trending upwards to around ₹${priceIn7Days} in the next week. Recommended to BUY now before prices increase further!`;
      confidence = Math.min(95, 75 + Math.abs(m) * 2);
    }

    return {
      trend,
      predictionText,
      expectedPrice7Days: Math.max(1, priceIn7Days),
      expectedPrice30Days: Math.max(1, priceIn30Days),
      confidence: Math.round(confidence),
    };
  }
}
