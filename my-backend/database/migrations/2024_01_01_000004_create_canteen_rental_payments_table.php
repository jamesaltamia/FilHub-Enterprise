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
        Schema::create('canteen_rental_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('stall_id');
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('contract_id');
            $table->string('month', 7); // Format: YYYY-MM
            $table->integer('year');
            $table->decimal('amount', 10, 2);
            $table->date('payment_date')->nullable();
            $table->date('due_date');
            $table->boolean('is_paid')->default(false);
            $table->enum('payment_method', ['cash', 'check', 'bank_transfer', 'gcash', 'paymaya', 'other'])->nullable();
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('late_fee', 8, 2)->default(0.00);
            $table->integer('days_overdue')->default(0);
            $table->enum('payment_status', ['pending', 'paid', 'overdue', 'partial'])->default('pending');
            $table->decimal('partial_amount', 10, 2)->default(0.00);
            $table->unsignedBigInteger('received_by')->nullable(); // User ID who received payment
            $table->timestamps();

            $table->foreign('stall_id')->references('id')->on('canteen_stalls')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('canteen_tenants')->onDelete('cascade');
            $table->foreign('contract_id')->references('id')->on('canteen_rental_contracts')->onDelete('cascade');
            $table->foreign('received_by')->references('id')->on('users')->onDelete('set null');
            
            $table->unique(['stall_id', 'tenant_id', 'month', 'year'], 'unique_monthly_payment');
            $table->index(['is_paid', 'due_date']);
            $table->index(['payment_status', 'due_date']);
            $table->index(['month', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canteen_rental_payments');
    }
};
