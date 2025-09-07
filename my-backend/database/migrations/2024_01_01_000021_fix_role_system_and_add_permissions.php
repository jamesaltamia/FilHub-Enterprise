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
        // Remove the duplicate role field from users table
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        // Insert default roles
        DB::table('roles')->insert([
            [
                'name' => 'admin',
                'description' => 'Administrator with full access to all features',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'cashier',
                'description' => 'Cashier with limited access to Inventory, POS, and Reports',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ]);

        // Insert permissions
        DB::table('permissions')->insert([
            // Admin permissions (all features)
            ['name' => 'dashboard.view', 'guard_name' => 'web', 'description' => 'View dashboard', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'products.manage', 'guard_name' => 'web', 'description' => 'Manage products', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'categories.manage', 'guard_name' => 'web', 'description' => 'Manage categories', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'brands.manage', 'guard_name' => 'web', 'description' => 'Manage brands', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'units.manage', 'guard_name' => 'web', 'description' => 'Manage units', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'customers.manage', 'guard_name' => 'web', 'description' => 'Manage customers', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'suppliers.manage', 'guard_name' => 'web', 'description' => 'Manage suppliers', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'pos.access', 'guard_name' => 'web', 'description' => 'Access POS system', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'orders.manage', 'guard_name' => 'web', 'description' => 'Manage orders', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'reports.view', 'guard_name' => 'web', 'description' => 'View reports', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'users.manage', 'guard_name' => 'web', 'description' => 'Manage users', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'settings.manage', 'guard_name' => 'web', 'description' => 'Manage system settings', 'created_at' => now(), 'updated_at' => now()],
            
            // Cashier permissions (limited features)
            ['name' => 'inventory.view', 'guard_name' => 'web', 'description' => 'View inventory', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'pos.cashier', 'guard_name' => 'web', 'description' => 'Access POS as cashier', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'reports.basic', 'guard_name' => 'web', 'description' => 'View basic reports', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Get role IDs
        $adminRoleId = DB::table('roles')->where('name', 'admin')->first()->id;
        $cashierRoleId = DB::table('roles')->where('name', 'cashier')->first()->id;

        // Get permission IDs
        $permissions = DB::table('permissions')->get()->keyBy('name');

        // Assign all permissions to admin
        foreach ($permissions as $permission) {
            DB::table('role_permissions')->insert([
                'role_id' => $adminRoleId,
                'permission_id' => $permission->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Assign limited permissions to cashier
        $cashierPermissions = ['inventory.view', 'pos.cashier', 'reports.basic'];
        foreach ($cashierPermissions as $permissionName) {
            if (isset($permissions[$permissionName])) {
                DB::table('role_permissions')->insert([
                    'role_id' => $cashierRoleId,
                    'permission_id' => $permissions[$permissionName]->id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back the role field to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('address');
        });

        // Remove the inserted data
        DB::table('role_permissions')->truncate();
        DB::table('permissions')->truncate();
        DB::table('roles')->truncate();
    }
};
