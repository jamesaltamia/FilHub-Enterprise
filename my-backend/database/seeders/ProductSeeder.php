<?php

// namespace Database\Seeders;

// use Illuminate\Database\Seeder;
// use App\Models\Product;
// use App\Models\Category;

// class ProductSeeder extends Seeder
// {
//     /**
//      * Run the database seeds.
//      */
//     public function run(): void
//     {
//         // Get actual category IDs from database
//         $electronicsCategory = Category::where('name', 'Electronics')->first();
//         $booksCategory = Category::where('name', 'Books')->first();
//         $schoolSuppliesCategory = Category::where('name', 'School Supplies')->first();
//         $accessoriesCategory = Category::where('name', 'Accessories')->first();

//         if (!$electronicsCategory || !$booksCategory || !$schoolSuppliesCategory || !$accessoriesCategory) {
//             $this->command->error('Required categories not found. Please run ReferenceSeeder first.');
//             return;
//         }

//         // Create sample products
//         $products = [
//             [
//                 'name' => 'Laptop Computer',
//                 'description' => 'High-performance laptop for students',
//                 'sku' => 'LT001',
//                 'selling_price' => 55000.00,
//                 'cost_price' => 40000.00,
//                 'stock_quantity' => 10,
//                 'low_stock_alert' => 2,
//                 'category_id' => $electronicsCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'Wireless Mouse',
//                 'description' => 'Ergonomic wireless mouse',
//                 'sku' => 'MS001',
//                 'selling_price' => 750.00,
//                 'cost_price' => 300.00,
//                 'stock_quantity' => 25,
//                 'low_stock_alert' => 5,
//                 'category_id' => $electronicsCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'Mechanical Keyboard',
//                 'description' => 'RGB mechanical gaming keyboard',
//                 'sku' => 'KB001',
//                 'selling_price' => 1500.00,
//                 'cost_price' => 800.00,
//                 'stock_quantity' => 15,
//                 'low_stock_alert' => 3,
//                 'category_id' => $electronicsCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => '27-inch Monitor',
//                 'description' => 'Full HD monitor for better visibility',
//                 'sku' => 'MN001',
//                 'selling_price' => 18000.00,
//                 'cost_price' => 12000.00,
//                 'stock_quantity' => 8,
//                 'low_stock_alert' => 2,
//                 'category_id' => $electronicsCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'Gaming Headphones',
//                 'description' => 'Noise-cancelling gaming headphones',
//                 'sku' => 'HP001',
//                 'selling_price' => 3000.00,
//                 'cost_price' => 1800.00,
//                 'stock_quantity' => 20,
//                 'low_stock_alert' => 5,
//                 'category_id' => $accessoriesCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'USB Flash Drive 32GB',
//                 'description' => 'High-speed USB 3.0 flash drive',
//                 'sku' => 'FD001',
//                 'selling_price' => 1000.00,
//                 'cost_price' => 500.00,
//                 'stock_quantity' => 50,
//                 'low_stock_alert' => 10,
//                 'category_id' => $electronicsCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'HD Webcam',
//                 'description' => '1080p HD webcam for online classes',
//                 'sku' => 'WC001',
//                 'selling_price' => 4000.00,
//                 'cost_price' => 2500.00,
//                 'stock_quantity' => 12,
//                 'low_stock_alert' => 3,
//                 'category_id' => $electronicsCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'External Hard Drive 1TB',
//                 'description' => 'Portable 1TB external hard drive',
//                 'sku' => 'HD001',
//                 'selling_price' => 5200.00,
//                 'cost_price' => 3500.00,
//                 'stock_quantity' => 18,
//                 'low_stock_alert' => 5,
//                 'category_id' => $electronicsCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'Mathematics Textbook',
//                 'description' => 'Advanced mathematics textbook for college',
//                 'sku' => 'MT001',
//                 'selling_price' => 950.00,
//                 'cost_price' => 600.00,
//                 'stock_quantity' => 30,
//                 'low_stock_alert' => 5,
//                 'category_id' => $booksCategory->id,
//                 'is_active' => true,
//             ],
//             [
//                 'name' => 'Scientific Calculator',
//                 'description' => 'Advanced scientific calculator',
//                 'sku' => 'SC001',
//                 'selling_price' => 1500.00,
//                 'cost_price' => 900.00,
//                 'stock_quantity' => 25,
//                 'low_stock_alert' => 5,
//                 'category_id' => $schoolSuppliesCategory->id,
//                 'is_active' => true,
//             ],
//         ];

//         foreach ($products as $product) {
//             Product::firstOrCreate(
//                 ['sku' => $product['sku']],
//                 $product
//             );
//         }

//         $this->command->info('Products seeded successfully!');
//     }
// }
