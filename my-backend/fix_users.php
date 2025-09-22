<?php

require_once 'vendor/autoload.php';

// Load Laravel environment
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

try {
    // Delete existing users
    User::truncate();
    
    // Create users with proper Laravel password hashing
    User::create([
        'name' => 'Admin User',
        'email' => 'admin@filhub.com',
        'password' => Hash::make('admin123'),
        'role' => 'admin',
        'is_active' => true,
    ]);

    User::create([
        'name' => 'Cashier User', 
        'email' => 'cashier@filhub.com',
        'password' => Hash::make('cashier123'),
        'role' => 'cashier',
        'is_active' => true,
    ]);

    echo "✅ Users updated with proper Laravel password hashing!\n";
    echo "✅ Login credentials:\n";
    echo "   - admin@filhub.com / admin123\n";
    echo "   - cashier@filhub.com / cashier123\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
