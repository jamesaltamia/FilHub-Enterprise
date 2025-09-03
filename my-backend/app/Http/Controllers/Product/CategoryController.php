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
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $category = Category::create($request->only(['name','description']) + ['is_active' => $request->boolean('is_active', true)]);
        return $this->successResponse($category, 'Category created', 201);
    }

    public function update(Request $request, Category $category)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:500',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $category->update($request->only(['name','description','is_active']));
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
