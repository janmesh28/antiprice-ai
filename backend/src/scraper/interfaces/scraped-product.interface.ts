export interface ScrapedProduct {
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  url: string;
  platform: string;
  inStock: boolean;
  seller?: string;
  rating?: number;
  reviewCount?: number;
  deliveryInfo?: string;
  discount?: number;
}
