<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenStall extends Model
{
    use HasFactory;

    protected $table = 'canteen_stalls';

    protected $fillable = [
        'stall_number',
        'stall_name',
        'monthly_rent',
        'is_occupied',
        'tenant_id',
        'description',
        'area_sqm',
        'amenities'
    ];

    protected $casts = [
        'monthly_rent' => 'decimal:2',
        'is_occupied' => 'boolean',
        'area_sqm' => 'decimal:2',
        'amenities' => 'array'
    ];

    // Relationship with tenant
    public function tenant()
    {
        return $this->belongsTo(CanteenTenant::class, 'tenant_id');
    }

    // Relationship with contracts
    public function contracts()
    {
        return $this->hasMany(CanteenRentalContract::class, 'stall_id');
    }

    // Relationship with payments
    public function payments()
    {
        return $this->hasMany(CanteenRentalPayment::class, 'stall_id');
    }

    // Get active contract
    public function activeContract()
    {
        return $this->hasOne(CanteenRentalContract::class, 'stall_id')->where('is_active', true);
    }
}
