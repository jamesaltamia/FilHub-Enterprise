<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenRentalContract extends Model
{
    use HasFactory;

    protected $table = 'canteen_rental_contracts';

    protected $fillable = [
        'stall_id',
        'tenant_id',
        'start_date',
        'end_date',
        'monthly_rent',
        'deposit_amount',
        'is_active',
        'contract_terms',
        'contract_type',
        'contract_duration_months',
        'penalty_rate',
        'deposit_paid_date',
        'deposit_returned',
        'deposit_return_date'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'monthly_rent' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'is_active' => 'boolean',
        'penalty_rate' => 'decimal:2',
        'deposit_paid_date' => 'date',
        'deposit_returned' => 'boolean',
        'deposit_return_date' => 'date'
    ];

    // Relationship with stall
    public function stall()
    {
        return $this->belongsTo(CanteenStall::class, 'stall_id');
    }

    // Relationship with tenant
    public function tenant()
    {
        return $this->belongsTo(CanteenTenant::class, 'tenant_id');
    }

    // Relationship with payments
    public function payments()
    {
        return $this->hasMany(CanteenRentalPayment::class, 'contract_id');
    }
}
