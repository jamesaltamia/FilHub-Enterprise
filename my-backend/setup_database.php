<?php

// Simple database setup script for FilHub Enterprise
require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

$capsule = new Capsule;

$capsule->addConnection([
    'driver' => 'sqlite',
    'database' => __DIR__ . '/database/database.sqlite',
    'prefix' => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

try {
    // Create basic tables
    Capsule::schema()->create('users', function ($table) {
        $table->id();
        $table->string('name');
        $table->string('email')->unique();
        $table->string('password');
        $table->string('role')->default('user');
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    Capsule::schema()->create('categories', function ($table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });

    Capsule::schema()->create('products', function ($table) {
        $table->id();
        $table->string('name');
        $table->text('description')->nullable();
        $table->string('sku')->unique();
        $table->unsignedBigInteger('category_id');
        $table->decimal('price', 10, 2);
        $table->decimal('cost', 10, 2)->nullable();
        $table->integer('stock_quantity')->default(0);
        $table->integer('min_stock_level')->default(5);
        $table->string('image')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
        $table->foreign('category_id')->references('id')->on('categories');
    });

    Capsule::schema()->create('orders', function ($table) {
        $table->id();
        $table->string('order_number')->unique();
        $table->decimal('total_amount', 10, 2);
        $table->string('status')->default('pending');
        $table->string('payment_status')->default('pending');
        $table->string('payment_method')->nullable();
        $table->timestamps();
    });

    // Insert default users
    Capsule::table('users')->insert([
        [
            'name' => 'Admin User',
            'email' => 'admin@filhub.com',
            'password' => password_hash('admin123', PASSWORD_DEFAULT),
            'role' => 'admin',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ],
        [
            'name' => 'Cashier User',
            'email' => 'cashier@filhub.com',
            'password' => password_hash('cashier123', PASSWORD_DEFAULT),
            'role' => 'cashier',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]
    ]);

    // Insert sample categories
    Capsule::table('categories')->insert([
        [
            'name' => 'Electronics',
            'description' => 'Electronic devices and accessories',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ],
        [
            'name' => 'Clothing',
            'description' => 'Apparel and fashion items',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ],
        [
            'name' => 'Books',
            'description' => 'Books and educational materials',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]
    ]);

    echo "✅ Database setup completed successfully!\n";
    echo "✅ Default users created:\n";
    echo "   - admin@filhub.com / admin123 (Admin)\n";
    echo "   - cashier@filhub.com / cashier123 (Cashier)\n";
    echo "✅ Sample categories created\n";

} catch (Exception $e) {
    echo "❌ Error setting up database: " . $e->getMessage() . "\n";
}

function now() {
    return date('Y-m-d H:i:s');
}
