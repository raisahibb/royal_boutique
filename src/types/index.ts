export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  images: string[];
  description: string;
  sizes?: string[];
}

export interface CartItem extends Product {
  cartKey: string;
  selectedSize: string;
  quantity: number;
  image: string;
}
