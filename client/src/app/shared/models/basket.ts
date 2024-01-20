import * as cuid from "cuid";

export interface BasketItem {
    id: number;
    productName: string;
    price: number;
    quantity: number;
    pictureUrl: string;
    brand: string;
    type: string;
}

export interface Basket {
    id: string;
    items: BasketItem[];
    clientSecret?: string;
    paymentIntentId?: string;
    deliveryMethodId?: number;
    shippingPrice: number;
}

export class Basket implements Basket {
    id = cuid();
    items: BasketItem[] = [];
    shippingPrice = 0;
}

// the idea being that each time we either get or set our basket, we calculate 
// what these totals are based on what is currently inside the baskets
export interface BasketTotals {
    shipping: number;
    subtotal: number;
    total: number;
}