import type { ReactNode } from "react";

export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface Product {
    id: number;
    name: string;
    price: number;
    stock_quantity: number;
    sku?: string;
    is_active?: boolean;
    image?: string;
    selling_price?: number;
}

export interface CartItem extends Product {
    quantity: number;
}

export interface OrderItem {
    product_id: number;
    qty: number;
    price: number;
}

export interface Customer {
    name: ReactNode;
    id: ReactNode;
    student_id?: string;  // Made optional with ?
    first_name?: string;  // Made optional to match usage in Customers.tsx
    last_name?: string;   // Made optional to match usage in Customers.tsx
    course?: string;
    year_level?: string;
    address?: string;
    barcode?: string;
}

export interface OrderData {
    items: OrderItem[];
    paid_amount: number;
    discount_amount?: number;
    tax_amount?: number;
    notes?: string;
}