<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\BaseApiController;
use App\Models\Brand;
use Illuminate\Http\Request;

class BrandController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Brand::query();

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $query->orderBy('name');

        if ($request->has('per_page')) {
            $brands = $query->paginate((int) $request->per_page);
        } else {
            $brands = $query->get();
        }

        return $this->successResponse($brands, 'Brands retrieved successfully');
    }
}
