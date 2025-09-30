<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CanteenStallsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $stalls = [
            [
                'stall_number' => 1,
                'stall_name' => 'Stall 1',
                'monthly_rent' => 5000.00,
                'is_occupied' => false,
                'description' => 'Corner stall with good visibility',
                'area_sqm' => 12.5,
                'amenities' => json_encode(['electricity', 'water', 'sink']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'stall_number' => 2,
                'stall_name' => 'Stall 2',
                'monthly_rent' => 4500.00,
                'is_occupied' => false,
                'description' => 'Standard stall with basic amenities',
                'area_sqm' => 10.0,
                'amenities' => json_encode(['electricity', 'water']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'stall_number' => 3,
                'stall_name' => 'Stall 3',
                'monthly_rent' => 4500.00,
                'is_occupied' => false,
                'description' => 'Standard stall with basic amenities',
                'area_sqm' => 10.0,
                'amenities' => json_encode(['electricity', 'water']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'stall_number' => 4,
                'stall_name' => 'Stall 4',
                'monthly_rent' => 4500.00,
                'is_occupied' => false,
                'description' => 'Standard stall with basic amenities',
                'area_sqm' => 10.0,
                'amenities' => json_encode(['electricity', 'water']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'stall_number' => 5,
                'stall_name' => 'Stall 5',
                'monthly_rent' => 4500.00,
                'is_occupied' => false,
                'description' => 'Standard stall with basic amenities',
                'area_sqm' => 10.0,
                'amenities' => json_encode(['electricity', 'water']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'stall_number' => 6,
                'stall_name' => 'Stall 6',
                'monthly_rent' => 5500.00,
                'is_occupied' => false,
                'description' => 'Premium stall with extra space and amenities',
                'area_sqm' => 15.0,
                'amenities' => json_encode(['electricity', 'water', 'sink', 'storage', 'exhaust_fan']),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('canteen_stalls')->insert($stalls);
    }
}
