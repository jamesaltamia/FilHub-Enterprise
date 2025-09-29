<?php

// namespace Database\Seeders;

// use Illuminate\Database\Seeder;
// use Illuminate\Support\Facades\DB;
// use Illuminate\Support\Carbon;

// class ReferenceSeeder extends Seeder
// {
//     public function run(): void
//     {
//         $now = now();

//         // Categories
//         $categories = ['Electronics', 'Groceries', 'Clothing', 'Accessories'];
//         foreach ($categories as $name) {
//             DB::table('categories')->updateOrInsert(
//                 ['name' => $name],
//                 ['description' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
//             );
//         }

//         // Brands
//         $brands = ['Apple', 'Samsung', 'Sony', 'LG'];
//         foreach ($brands as $name) {
//             DB::table('brands')->updateOrInsert(
//                 ['name' => $name],
//                 ['description' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
//             );
//         }
//     }
// }
