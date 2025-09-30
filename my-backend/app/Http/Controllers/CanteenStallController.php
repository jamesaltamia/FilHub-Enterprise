<?php

namespace App\Http\Controllers;

use App\Models\CanteenStall;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CanteenStallController extends Controller
{
    /**
     * Display a listing of the stalls.
     */
    public function index(): JsonResponse
    {
        try {
            $stalls = CanteenStall::with('tenant')->orderBy('stall_number')->get();
            return response()->json($stalls);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch stalls'], 500);
        }
    }

    /**
     * Store a newly created stall in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'stall_number' => 'required|integer|unique:canteen_stalls',
                'stall_name' => 'required|string|max:255',
                'monthly_rent' => 'required|numeric|min:0',
                'description' => 'nullable|string',
                'area_sqm' => 'nullable|numeric|min:0',
                'amenities' => 'nullable|array'
            ]);

            $stall = CanteenStall::create($validated);
            return response()->json($stall->load('tenant'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create stall'], 500);
        }
    }

    /**
     * Display the specified stall.
     */
    public function show(CanteenStall $stall): JsonResponse
    {
        try {
            return response()->json($stall->load('tenant'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch stall'], 500);
        }
    }

    /**
     * Update the specified stall in storage.
     */
    public function update(Request $request, CanteenStall $stall): JsonResponse
    {
        try {
            $validated = $request->validate([
                'stall_number' => 'sometimes|integer|unique:canteen_stalls,stall_number,' . $stall->id,
                'stall_name' => 'sometimes|string|max:255',
                'monthly_rent' => 'sometimes|numeric|min:0',
                'is_occupied' => 'sometimes|boolean',
                'tenant_id' => 'sometimes|nullable|exists:canteen_tenants,id',
                'description' => 'sometimes|nullable|string',
                'area_sqm' => 'sometimes|nullable|numeric|min:0',
                'amenities' => 'sometimes|nullable|array'
            ]);

            $stall->update($validated);
            return response()->json($stall->load('tenant'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update stall'], 500);
        }
    }

    /**
     * Remove the specified stall from storage.
     */
    public function destroy(CanteenStall $stall): JsonResponse
    {
        try {
            $stall->delete();
            return response()->json(['message' => 'Stall deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete stall'], 500);
        }
    }
}
