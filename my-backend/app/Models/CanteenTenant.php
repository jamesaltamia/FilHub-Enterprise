<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CanteenTenant extends Model
{
    use HasFactory;

    protected $table = 'canteen_tenants';

    protected $fillable = [
        'name',
        'contact_number',
        'email',
        'business_name',
        'business_type',
        'address',
        'emergency_contact_name',
        'emergency_contact_number',
        'birth_date',
        'status',
        'notes'
    ];

    protected $casts = [
        'birth_date' => 'date'
    ];

    // Relationship with stalls
    public function stalls()
    {
        return $this->hasMany(CanteenStall::class, 'tenant_id');
    }

    // Relationship with contracts
    public function contracts()
    {
        return $this->hasMany(CanteenRentalContract::class, 'tenant_id');
    }

    // Relationship with payments
    public function payments()
    {
        return $this->hasMany(CanteenRentalPayment::class, 'tenant_id');
    }

    // Get active contracts
    public function activeContracts()
    {
        return $this->hasMany(CanteenRentalContract::class, 'tenant_id')->where('is_active', true);
    }
}
