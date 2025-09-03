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
        $query = Product::with(['category','brand','unit']);
        if ($request->has('search')) {
            $query->search($request->search);
        }
        $query->orderBy('created_at','desc');
        $products = $request->has('per_page') ? $query->paginate((int) $request->per_page) : $query->get();
        return $this->successResponse($products, 'Products retrieved successfully');
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

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'brand_id' => 'nullable|exists:brands,id',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'low_stock_alert' => 'required|integer|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $data = $request->except('image');
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($data);
        return $this->successResponse($product, 'Product created', 201);
    }

    public function update(Request $request, Product $product)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'category_id' => 'sometimes|required|exists:categories,id',
            'unit_id' => 'sometimes|required|exists:units,id',
            'brand_id' => 'nullable|exists:brands,id',
            'cost_price' => 'sometimes|required|numeric|min:0',
            'selling_price' => 'sometimes|required|numeric|min:0',
            'low_stock_alert' => 'sometimes|required|integer|min:0',
            'stock_quantity' => 'sometimes|required|integer|min:0',
            'image' => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $data = $request->except('image');
        if ($request->hasFile('image')) {
            if ($product->image) Storage::disk('public')->delete($product->image);
            $data['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);
        return $this->successResponse($product->fresh(), 'Product updated');
    }

    public function destroy(Product $product)
    {
        if ($product->image) Storage::disk('public')->delete($product->image);
        $product->delete();
        return $this->successResponse(null, 'Product deleted');
    }
}
