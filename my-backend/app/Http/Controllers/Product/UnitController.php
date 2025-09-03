<?php

namespace App\Http\Controllers\Product;

use App\Http\Controllers\BaseApiController;
use App\Models\Unit;
use Illuminate\Http\Request;

class UnitController extends BaseApiController
{
    public function index(Request $request)
    {
        $query = Unit::query();

        if ($request->has('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $query->orderBy('name');

        if ($request->has('per_page')) {
            $units = $query->paginate((int) $request->per_page);
        } else {
            $units = $query->get();
        }

        return $this->successResponse($units, 'Units retrieved successfully');
    }
}
