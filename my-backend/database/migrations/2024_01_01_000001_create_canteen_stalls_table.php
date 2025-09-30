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
        Schema::create('canteen_stalls', function (Blueprint $table) {
            $table->id();
            $table->integer('stall_number')->unique();
            $table->string('stall_name');
            $table->decimal('monthly_rent', 10, 2);
            $table->boolean('is_occupied')->default(false);
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->text('description')->nullable();
            $table->decimal('area_sqm', 8, 2)->nullable(); // Area in square meters
            $table->json('amenities')->nullable(); // JSON array of amenities
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('canteen_tenants')->onDelete('set null');
            $table->index(['is_occupied', 'stall_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('canteen_stalls');
    }
};
