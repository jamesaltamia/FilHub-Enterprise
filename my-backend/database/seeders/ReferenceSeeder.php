<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class ReferenceSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Categories
        $categories = ['Electronics', 'Groceries', 'Clothing', 'Accessories'];
        foreach ($categories as $name) {
            DB::table('categories')->updateOrInsert(
                ['name' => $name],
                ['description' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
            );
        }

        // Brands
        $brands = ['Apple', 'Samsung', 'Sony', 'LG'];
        foreach ($brands as $name) {
            DB::table('brands')->updateOrInsert(
                ['name' => $name],
                ['description' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
            );
        }

        // Units
        $units = [
            ['name' => 'Piece', 'short_name' => 'pc'],
            ['name' => 'Kilogram', 'short_name' => 'kg'],
            ['name' => 'Liter', 'short_name' => 'L'],
        ];
        foreach ($units as $u) {
            DB::table('units')->updateOrInsert(
                ['name' => $u['name']],
                ['short_name' => $u['short_name'], 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
            );
        }
    }
}
