<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'barcode',
        'description',
        'category_id',
        'brand_id',
        'unit_id',
        'cost_price',
        'selling_price',
        'discount_percentage',
        'discount_amount',
        'stock_quantity',
        'low_stock_alert',
        'image',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'float',
        'selling_price' => 'float',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'stock_quantity' => 'integer',
        'low_stock_alert' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the category that owns the product.
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the brand that owns the product.
     */
    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get the unit that owns the product.
     */
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get the order products for the product.
     */
    public function orderProducts()
    {
        return $this->hasMany(OrderProduct::class);
    }

    /**
     * Get the purchase items for the product.
     */
    public function purchaseItems()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * Get the POS cart items for the product.
     */
    public function posCartItems()
    {
        return $this->hasMany(PosCart::class);
    }

    /**
     * Scope a query to only include active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include products with low stock.
     */
    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock_quantity <= low_stock_alert');
    }

    /**
     * Scope a query to search products by name or barcode.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where('name', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
    }

    /**
     * Calculate the final selling price after discount.
     */
    public function getFinalPriceAttribute()
    {
        if ($this->discount_percentage > 0) {
            return $this->selling_price - ($this->selling_price * $this->discount_percentage / 100);
        }
        
        if ($this->discount_amount > 0) {
            return $this->selling_price - $this->discount_amount;
        }
        
        return $this->selling_price;
    }

    /**
     * Check if product has low stock.
     */
    public function hasLowStock()
    {
        return $this->stock_quantity <= $this->low_stock_alert;
    }
}
