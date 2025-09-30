<?php

namespace App\Http\Controllers;

use App\Models\CanteenRentalContract;
use App\Models\CanteenStall;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CanteenRentalContractController extends Controller
{
    /**
     * Display a listing of the contracts.
     */
    public function index(): JsonResponse
    {
        try {
            $contracts = CanteenRentalContract::with('stall', 'tenant')
                ->orderBy('created_at', 'desc')
                ->get();
            return response()->json($contracts);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch contracts'], 500);
        }
    }

    /**
     * Store a newly created contract in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'stall_id' => 'required|exists:canteen_stalls,id',
                'tenant_id' => 'required|exists:canteen_tenants,id',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after:start_date',
                'monthly_rent' => 'required|numeric|min:0',
                'deposit_amount' => 'required|numeric|min:0',
                'contract_terms' => 'nullable|string',
                'contract_type' => 'sometimes|in:monthly,yearly,fixed_term',
                'contract_duration_months' => 'nullable|integer|min:1',
                'penalty_rate' => 'sometimes|numeric|min:0|max:100',
                'deposit_paid_date' => 'nullable|date'
            ]);

            $validated['is_active'] = $validated['is_active'] ?? true;
            $validated['contract_type'] = $validated['contract_type'] ?? 'monthly';
            $validated['penalty_rate'] = $validated['penalty_rate'] ?? 0;

            $contract = CanteenRentalContract::create($validated);

            // Update stall as occupied
            CanteenStall::where('id', $validated['stall_id'])->update([
                'is_occupied' => true,
                'tenant_id' => $validated['tenant_id']
            ]);

            return response()->json($contract->load('stall', 'tenant'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create contract'], 500);
        }
    }

    /**
     * Display the specified contract.
     */
    public function show(CanteenRentalContract $contract): JsonResponse
    {
        try {
            return response()->json($contract->load('stall', 'tenant', 'payments'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch contract'], 500);
        }
    }

    /**
     * Update the specified contract in storage.
     */
    public function update(Request $request, CanteenRentalContract $contract): JsonResponse
    {
        try {
            $validated = $request->validate([
                'start_date' => 'sometimes|date',
                'end_date' => 'sometimes|nullable|date|after:start_date',
                'monthly_rent' => 'sometimes|numeric|min:0',
                'deposit_amount' => 'sometimes|numeric|min:0',
                'is_active' => 'sometimes|boolean',
                'contract_terms' => 'sometimes|nullable|string',
                'contract_type' => 'sometimes|in:monthly,yearly,fixed_term',
                'contract_duration_months' => 'sometimes|nullable|integer|min:1',
                'penalty_rate' => 'sometimes|numeric|min:0|max:100',
                'deposit_paid_date' => 'sometimes|nullable|date',
                'deposit_returned' => 'sometimes|boolean',
                'deposit_return_date' => 'sometimes|nullable|date'
            ]);

            $contract->update($validated);

            // If contract is deactivated, update stall as vacant
            if (isset($validated['is_active']) && !$validated['is_active']) {
                CanteenStall::where('id', $contract->stall_id)->update([
                    'is_occupied' => false,
                    'tenant_id' => null
                ]);
            }

            return response()->json($contract->load('stall', 'tenant'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update contract'], 500);
        }
    }

    /**
     * Remove the specified contract from storage.
     */
    public function destroy(CanteenRentalContract $contract): JsonResponse
    {
        try {
            // Update stall as vacant
            CanteenStall::where('id', $contract->stall_id)->update([
                'is_occupied' => false,
                'tenant_id' => null
            ]);

            $contract->delete();
            return response()->json(['message' => 'Contract deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete contract'], 500);
        }
    }
}
