<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\BaseApiController;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoryController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Category::query();

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $query->orderBy('name');

        if ($request->has('per_page')) {
            $cats = $query->paginate((int) $request->per_page);
        } else {
            $cats = $query->get();
        }

        return $this->successResponse($cats, 'Categories retrieved successfully');
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
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            \Log::info('Validation failed: ' . json_encode($validator->errors()));
            return $this->validationErrorResponse($validator->errors());
        }

        $category = Category::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true
        ]);
        
        return $this->successResponse($category, 'Category created', 201);
    }

    public function update(Request $request, Category $category)
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
            'name' => 'sometimes|required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $updateData = [];
        if (isset($data['name'])) $updateData['name'] = $data['name'];
        if (isset($data['description'])) $updateData['description'] = $data['description'];
        if (isset($data['is_active'])) $updateData['is_active'] = $data['is_active'];
        
        $category->update($updateData);
        return $this->successResponse($category->fresh(), 'Category updated');
    }

    public function destroy(Category $category)
    {
        if ($category->products()->exists()) {
            return $this->errorResponse('Cannot delete category with associated products', 400);
        }
        $category->delete();
        return $this->successResponse(null, 'Category deleted');
    }
}
