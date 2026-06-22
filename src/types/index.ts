export interface TableData {
    id?: string;
    name: string;
}

export interface MenuItemData {
    id?: string;
    name: string;
    price: number;
    category?: string;
}

export interface OrderAction {
    quantity: number;
    timestamp: number;
}

export interface OrderItem {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    history?: OrderAction[];
}

export interface InvoiceData {
    id?: string;
    tableId: string;
    tableName: string;
    items: OrderItem[];
    pendingItems?: OrderItem[];
    status: 'eating' | 'paid';
    createdAt: number;
    updatedAt: number;
}
