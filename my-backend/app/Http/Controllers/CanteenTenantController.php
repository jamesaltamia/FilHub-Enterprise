<?php

namespace App\Http\Controllers;

use App\Models\CanteenTenant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CanteenTenantController extends Controller
{
    /**
     * Display a listing of the tenants.
     */
    public function index(): JsonResponse
    {
        try {
            $tenants = CanteenTenant::with('stalls')->orderBy('name')->get();
            return response()->json($tenants);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch tenants'], 500);
        }
    }

    /**
     * Store a newly created tenant in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'contact_number' => 'required|string|max:20',
                'email' => 'nullable|email|max:255',
                'business_name' => 'required|string|max:255',
                'business_type' => 'required|string|max:255',
                'address' => 'nullable|string',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_number' => 'nullable|string|max:20',
                'birth_date' => 'nullable|date',
                'status' => 'sometimes|in:active,inactive,suspended',
                'notes' => 'nullable|string'
            ]);

            $validated['status'] = $validated['status'] ?? 'active';
            $tenant = CanteenTenant::create($validated);
            return response()->json($tenant->load('stalls'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create tenant'], 500);
        }
    }

    /**
     * Display the specified tenant.
     */
    public function show(CanteenTenant $tenant): JsonResponse
    {
        try {
            return response()->json($tenant->load('stalls', 'contracts', 'payments'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch tenant'], 500);
        }
    }

    /**
     * Update the specified tenant in storage.
     */
    public function update(Request $request, CanteenTenant $tenant): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'contact_number' => 'sometimes|string|max:20',
                'email' => 'sometimes|nullable|email|max:255',
                'business_name' => 'sometimes|string|max:255',
                'business_type' => 'sometimes|string|max:255',
                'address' => 'sometimes|nullable|string',
                'emergency_contact_name' => 'sometimes|nullable|string|max:255',
                'emergency_contact_number' => 'sometimes|nullable|string|max:20',
                'birth_date' => 'sometimes|nullable|date',
                'status' => 'sometimes|in:active,inactive,suspended',
                'notes' => 'sometimes|nullable|string'
            ]);

            $tenant->update($validated);
            return response()->json($tenant->load('stalls'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update tenant'], 500);
        }
    }

    /**
     * Remove the specified tenant from storage.
     */
    public function destroy(CanteenTenant $tenant): JsonResponse
    {
        try {
            $tenant->delete();
            return response()->json(['message' => 'Tenant deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete tenant'], 500);
        }
    }
}
