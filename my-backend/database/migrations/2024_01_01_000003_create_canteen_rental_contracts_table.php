<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('canteen_rental_contracts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stall_id');
            $table->unsignedBigInteger('tenant_id');
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('monthly_rent', 10, 2);
            $table->decimal('deposit_amount', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->text('contract_terms')->nullable();
            $table->enum('contract_type', ['monthly', 'yearly', 'fixed_term'])->default('monthly');
            $table->integer('contract_duration_months')->nullable();
            $table->decimal('penalty_rate', 5, 2)->default(0.00); // Percentage for late payment penalty
            $table->date('deposit_paid_date')->nullable();
            $table->boolean('deposit_returned')->default(false);
            $table->date('deposit_return_date')->nullable();
            $table->timestamps();

            $table->foreign('stall_id')->references('id')->on('canteen_stalls')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('canteen_tenants')->onDelete('cascade');
            
            $table->index(['is_active', 'start_date']);
            $table->index(['stall_id', 'is_active']);
            $table->index(['tenant_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canteen_rental_contracts');
    }
};
