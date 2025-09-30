<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenRentalPayment extends Model
{
    use HasFactory;

    protected $table = 'canteen_rental_payments';

    protected $fillable = [
        'stall_id',
        'tenant_id',
        'contract_id',
        'month',
        'year',
        'amount',
        'payment_date',
        'due_date',
        'is_paid',
        'payment_method',
        'reference_number',
        'notes',
        'late_fee',
        'days_overdue',
        'payment_status',
        'partial_amount',
        'received_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payment_date' => 'date',
        'due_date' => 'date',
        'is_paid' => 'boolean',
        'late_fee' => 'decimal:2',
        'partial_amount' => 'decimal:2'
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

    // Relationship with contract
    public function contract()
    {
        return $this->belongsTo(CanteenRentalContract::class, 'contract_id');
    }

    // Relationship with user who received payment
    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }
}
