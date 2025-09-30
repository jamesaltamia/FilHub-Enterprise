<?php

namespace App\Http\Controllers;

use App\Models\CanteenRentalPayment;
use App\Models\CanteenRentalContract;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class CanteenRentalPaymentController extends Controller
{
    /**
     * Display a listing of the payments.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = CanteenRentalPayment::with('stall', 'tenant', 'contract');

            // Apply filters
            if ($request->has('stall_id')) {
                $query->where('stall_id', $request->stall_id);
            }

            if ($request->has('tenant_id')) {
                $query->where('tenant_id', $request->tenant_id);
            }

            if ($request->has('month')) {
                $query->where('month', $request->month);
            }

            if ($request->has('year')) {
                $query->where('year', $request->year);
            }

            if ($request->has('is_paid')) {
                $query->where('is_paid', $request->boolean('is_paid'));
            }

            $payments = $query->orderBy('due_date', 'desc')->get();
            return response()->json($payments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch payments'], 500);
        }
    }

    /**
     * Store a newly created payment in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'stall_id' => 'required|exists:canteen_stalls,id',
                'tenant_id' => 'required|exists:canteen_tenants,id',
                'contract_id' => 'required|exists:canteen_rental_contracts,id',
                'month' => 'required|string|regex:/^\d{4}-\d{2}$/',
                'year' => 'required|integer',
                'amount' => 'required|numeric|min:0',
                'due_date' => 'required|date',
                'payment_date' => 'nullable|date',
                'payment_method' => 'nullable|in:cash,check,bank_transfer,gcash,paymaya,other',
                'reference_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'late_fee' => 'sometimes|numeric|min:0',
                'payment_status' => 'sometimes|in:pending,paid,overdue,partial'
            ]);

            $validated['is_paid'] = $validated['is_paid'] ?? false;
            $validated['late_fee'] = $validated['late_fee'] ?? 0;
            $validated['payment_status'] = $validated['payment_status'] ?? 'pending';
            $validated['partial_amount'] = $validated['partial_amount'] ?? 0;

            // Calculate days overdue
            $dueDate = Carbon::parse($validated['due_date']);
            $today = Carbon::now();
            $validated['days_overdue'] = $today->gt($dueDate) ? $today->diffInDays($dueDate) : 0;

            $payment = CanteenRentalPayment::create($validated);
            return response()->json($payment->load('stall', 'tenant', 'contract'), 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to create payment'], 500);
        }
    }

    /**
     * Display the specified payment.
     */
    public function show(CanteenRentalPayment $payment): JsonResponse
    {
        try {
            return response()->json($payment->load('stall', 'tenant', 'contract'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch payment'], 500);
        }
    }

    /**
     * Update the specified payment in storage.
     */
    public function update(Request $request, CanteenRentalPayment $payment): JsonResponse
    {
        try {
            $validated = $request->validate([
                'amount' => 'sometimes|numeric|min:0',
                'payment_date' => 'sometimes|nullable|date',
                'is_paid' => 'sometimes|boolean',
                'payment_method' => 'sometimes|nullable|in:cash,check,bank_transfer,gcash,paymaya,other',
                'reference_number' => 'sometimes|nullable|string|max:255',
                'notes' => 'sometimes|nullable|string',
                'late_fee' => 'sometimes|numeric|min:0',
                'payment_status' => 'sometimes|in:pending,paid,overdue,partial',
                'partial_amount' => 'sometimes|numeric|min:0'
            ]);

            // Update days overdue
            $dueDate = Carbon::parse($payment->due_date);
            $today = Carbon::now();
            $validated['days_overdue'] = $today->gt($dueDate) ? $today->diffInDays($dueDate) : 0;

            $payment->update($validated);
            return response()->json($payment->load('stall', 'tenant', 'contract'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to update payment'], 500);
        }
    }

    /**
     * Mark payment as paid.
     */
    public function markAsPaid(Request $request, CanteenRentalPayment $payment): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_date' => 'required|date',
                'payment_method' => 'required|in:cash,check,bank_transfer,gcash,paymaya,other',
                'reference_number' => 'nullable|string|max:255',
                'notes' => 'nullable|string'
            ]);

            $payment->update([
                'is_paid' => true,
                'payment_status' => 'paid',
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'received_by' => 1 // Default admin user for demo mode
            ]);

            return response()->json($payment->load('stall', 'tenant', 'contract'));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to mark payment as paid'], 500);
        }
    }

    /**
     * Generate monthly payments for all active contracts.
     */
    public function generateMonthlyPayments(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'month' => 'required|string|regex:/^\d{2}$/',
                'year' => 'required|integer'
            ]);

            $month = $validated['month'];
            $year = $validated['year'];
            $monthString = $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT);

            // Get all active contracts
            $activeContracts = CanteenRentalContract::with('stall', 'tenant')
                ->where('is_active', true)
                ->get();

            $newPayments = [];

            foreach ($activeContracts as $contract) {
                // Check if payment already exists
                $existingPayment = CanteenRentalPayment::where('stall_id', $contract->stall_id)
                    ->where('tenant_id', $contract->tenant_id)
                    ->where('month', $monthString)
                    ->where('year', $year)
                    ->first();

                if (!$existingPayment) {
                    // Create new payment record
                    $dueDate = Carbon::create($year, intval($month), 5); // Due on 5th of each month

                    $payment = CanteenRentalPayment::create([
                        'stall_id' => $contract->stall_id,
                        'tenant_id' => $contract->tenant_id,
                        'contract_id' => $contract->id,
                        'month' => $monthString,
                        'year' => $year,
                        'amount' => $contract->monthly_rent,
                        'due_date' => $dueDate,
                        'is_paid' => false,
                        'payment_status' => 'pending',
                        'late_fee' => 0,
                        'partial_amount' => 0,
                        'days_overdue' => 0
                    ]);

                    $newPayments[] = $payment->load('stall', 'tenant', 'contract');
                }
            }

            return response()->json($newPayments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate monthly payments'], 500);
        }
    }

    /**
     * Remove the specified payment from storage.
     */
    public function destroy(CanteenRentalPayment $payment): JsonResponse
    {
        try {
            $payment->delete();
            return response()->json(['message' => 'Payment deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to delete payment'], 500);
        }
    }
}
