<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForgetPassword extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'otp',
        'expires_at',
        'is_used',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_used' => 'boolean',
    ];

    /**
     * Check if OTP is expired
     */
    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    /**
     * Scope a query to only include valid (non-expired, unused) OTPs
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
                    ->where('is_used', false);
    }
}
