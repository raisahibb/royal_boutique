// Shared product type — used across ProductCard, QuickViewModal, CollectionsSection
export interface Product {
  id: number
  name: string
  price: number
  category: string
  images: string[]   // multiple images for carousel
  description: string
  sizes: string[]    // varies by category
}
