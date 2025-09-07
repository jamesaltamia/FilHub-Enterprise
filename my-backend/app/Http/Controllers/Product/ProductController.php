<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\BaseApiController;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProductController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Product::with(['category']);
        if ($request->has('search')) {
            $query->search($request->search);
        }
        $query->orderBy('created_at','desc');
        $products = $request->has('per_page') ? $query->paginate((int) $request->per_page) : $query->get();
        
        // Transform the data to match frontend expectations
        $transformedProducts = $products->map(function ($product) {
            return [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'sku' => $product->sku,
                'price' => $product->selling_price,
                'cost' => $product->cost_price,
                'stock_quantity' => $product->stock_quantity,
                'min_stock_level' => $product->low_stock_alert,
                'category_id' => $product->category_id,
                'category' => $product->category,
                'is_active' => $product->is_active,
                'created_at' => $product->created_at,
                'updated_at' => $product->updated_at,
            ];
        });
        
        return $this->successResponse($transformedProducts, 'Products retrieved successfully');
    }

    public function search(Request $request)
    {
        $term = (string) $request->query('query', '');
        if ($term === '') {
            return $this->successResponse([], 'No query');
        }

        $products = Product::query()
            ->where(function($q) use ($term) {
                $q->where('name', 'like', "%{$term}%")
                  ->orWhere('barcode', 'like', "%{$term}%")
                  ->orWhere('sku', 'like', "%{$term}%");
            })
            ->orderBy('name')
            ->limit(20)
            ->get(['id','name','selling_price','sku','barcode']);

        return $this->successResponse($products, 'Search results');
    }

    public function show(Product $product)
    {
        $product->load('category');
        return $this->successResponse([
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'sku' => $product->sku,
            'price' => $product->selling_price,
            'cost' => $product->cost_price,
            'stock_quantity' => $product->stock_quantity,
            'min_stock_level' => $product->low_stock_alert,
            'category_id' => $product->category_id,
            'category' => $product->category,
            'is_active' => $product->is_active,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ], 'Product retrieved successfully');
    }

    public function store(Request $request)
    {
        // Debug: Log the raw request
        \Log::info('Raw request content: ' . $request->getContent());
        \Log::info('Request all: ' . json_encode($request->all()));
        
        // Try to get data from raw JSON if request->all() is empty
        $data = $request->all();
        if (empty($data)) {
            $rawData = json_decode($request->getContent(), true);
            if ($rawData) {
                $data = $rawData;
                \Log::info('Using raw JSON data: ' . json_encode($data));
            }
        }
        
        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'required|string|unique:products,sku',
            'category_id' => 'nullable|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'cost' => 'required|numeric|min:0',
            'min_stock_level' => 'required|integer|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            \Log::info('Validation failed: ' . json_encode($validator->errors()));
            return $this->validationErrorResponse($validator->errors());
        }

        $productData = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'sku' => $data['sku'],
            'category_id' => $data['category_id'] ?? null,
            'selling_price' => $data['price'],
            'cost_price' => $data['cost'],
            'low_stock_alert' => $data['min_stock_level'],
            'stock_quantity' => $data['stock_quantity'],
            'is_active' => $data['is_active'] ?? true,
        ];

        $product = Product::create($productData);
        $product->load('category');
        
        return $this->successResponse([
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'sku' => $product->sku,
            'price' => $product->selling_price,
            'cost' => $product->cost_price,
            'stock_quantity' => $product->stock_quantity,
            'min_stock_level' => $product->low_stock_alert,
            'category_id' => $product->category_id,
            'category' => $product->category,
            'is_active' => $product->is_active,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ], 'Product created', 201);
    }

    public function update(Request $request, Product $product)
    {
        // Try to get data from raw JSON if request->all() is empty
        $data = $request->all();
        if (empty($data)) {
            $rawData = json_decode($request->getContent(), true);
            if ($rawData) {
                $data = $rawData;
            }
        }
        
        $validator = Validator::make($data, [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'sku' => 'sometimes|required|string|unique:products,sku,' . $product->id,
            'category_id' => 'nullable|exists:categories,id',
            'price' => 'sometimes|required|numeric|min:0',
            'cost' => 'sometimes|required|numeric|min:0',
            'min_stock_level' => 'sometimes|required|integer|min:0',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $updateData = [];
        if (isset($data['name'])) $updateData['name'] = $data['name'];
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['sku'])) $updateData['sku'] = $data['sku'];
        if (isset($data['category_id'])) $updateData['category_id'] = $data['category_id'];
        if (isset($data['price'])) $updateData['selling_price'] = $data['price'];
        if (isset($data['cost'])) $updateData['cost_price'] = $data['cost'];
        if (isset($data['min_stock_level'])) $updateData['low_stock_alert'] = $data['min_stock_level'];
        if (isset($data['stock_quantity'])) $updateData['stock_quantity'] = $data['stock_quantity'];
        if (isset($data['is_active'])) $updateData['is_active'] = $data['is_active'];

        $product->update($updateData);
        $product->load('category');
        
        return $this->successResponse([
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'sku' => $product->sku,
            'price' => $product->selling_price,
            'cost' => $product->cost_price,
            'stock_quantity' => $product->stock_quantity,
            'min_stock_level' => $product->low_stock_alert,
            'category_id' => $product->category_id,
            'category' => $product->category,
            'is_active' => $product->is_active,
            'created_at' => $product->created_at,
            'updated_at' => $product->updated_at,
        ], 'Product updated');
    }

    public function destroy(Product $product)
    {
        if ($product->image) Storage::disk('public')->delete($product->image);
        $product->delete();
        return $this->successResponse(null, 'Product deleted');
    }
}
