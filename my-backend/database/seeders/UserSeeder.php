<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get role IDs
        $adminRole = Role::where('name', 'admin')->first();
        $cashierRole = Role::where('name', 'cashier')->first();

        if (!$adminRole || !$cashierRole) {
            $this->command->error('Roles not found. Please run the role migration first.');
            return;
        }

        // Create admin user
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@filhub.com',
            'password' => Hash::make('admin123'),
            'phone' => '+1234567890',
            'address' => 'Admin Address',
            'is_active' => true,
        ]);

        // Assign admin role
        $admin->roles()->attach($adminRole->id);

        // Create cashier user
        $cashier = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@filhub.com',
            'password' => Hash::make('cashier123'),
            'phone' => '+1234567891',
            'address' => 'Cashier Address',
            'is_active' => true,
        ]);

        // Assign cashier role
        $cashier->roles()->attach($cashierRole->id);

        $this->command->info('Users created successfully!');
        $this->command->info('Admin: admin@filhub.com / admin123');
        $this->command->info('Cashier: cashier@filhub.com / cashier123');
    }
}
