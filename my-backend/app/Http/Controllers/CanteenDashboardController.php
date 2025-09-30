<?php

namespace App\Http\Controllers;

use App\Models\CanteenStall;
use App\Models\CanteenTenant;
use App\Models\CanteenRentalContract;
use App\Models\CanteenRentalPayment;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class CanteenDashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     */
    public function getStats(): JsonResponse
    {
        try {
            $currentMonth = Carbon::now()->format('Y-m');
            $currentYear = Carbon::now()->year;
            $today = Carbon::now();

            // Basic stall statistics
            $totalStalls = CanteenStall::count();
            $occupiedStalls = CanteenStall::where('is_occupied', true)->count();
            $vacantStalls = $totalStalls - $occupiedStalls;

            // Revenue statistics
            $activeContracts = CanteenRentalContract::where('is_active', true)->get();
            $totalMonthlyRent = $activeContracts->sum('monthly_rent');

            // Current month payment statistics
            $currentMonthPayments = CanteenRentalPayment::where('month', $currentMonth)
                ->where('year', $currentYear)
                ->get();

            $paidThisMonth = $currentMonthPayments->where('is_paid', true)->sum('amount');
            $unpaidThisMonth = $currentMonthPayments->where('is_paid', false)->sum('amount');

            // Overdue payments
            $overduePayments = CanteenRentalPayment::where('is_paid', false)
                ->where('due_date', '<', $today)
                ->count();

            $stats = [
                'totalStalls' => $totalStalls,
                'occupiedStalls' => $occupiedStalls,
                'vacantStalls' => $vacantStalls,
                'totalMonthlyRent' => $totalMonthlyRent,
                'paidThisMonth' => $paidThisMonth,
                'unpaidThisMonth' => $unpaidThisMonth,
                'overduePayments' => $overduePayments
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch dashboard stats'], 500);
        }
    }

    /**
     * Get recent payments.
     */
    public function getRecentPayments(): JsonResponse
    {
        try {
            $recentPayments = CanteenRentalPayment::with('stall', 'tenant')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            return response()->json($recentPayments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch recent payments'], 500);
        }
    }

    /**
     * Get overdue payments.
     */
    public function getOverduePayments(): JsonResponse
    {
        try {
            $today = Carbon::now();
            $overduePayments = CanteenRentalPayment::with('stall', 'tenant')
                ->where('is_paid', false)
                ->where('due_date', '<', $today)
                ->orderBy('due_date', 'asc')
                ->get();

            return response()->json($overduePayments);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch overdue payments'], 500);
        }
    }

    /**
     * Get monthly revenue chart data.
     */
    public function getMonthlyRevenue(): JsonResponse
    {
        try {
            $currentYear = Carbon::now()->year;
            $monthlyRevenue = [];

            for ($month = 1; $month <= 12; $month++) {
                $monthString = $currentYear . '-' . str_pad($month, 2, '0', STR_PAD_LEFT);
                $revenue = CanteenRentalPayment::where('month', $monthString)
                    ->where('year', $currentYear)
                    ->where('is_paid', true)
                    ->sum('amount');

                $monthlyRevenue[] = [
                    'month' => Carbon::create($currentYear, $month, 1)->format('M'),
                    'revenue' => $revenue
                ];
            }

            return response()->json($monthlyRevenue);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch monthly revenue'], 500);
        }
    }

    /**
     * Get tenant performance data.
     */
    public function getTenantPerformance(): JsonResponse
    {
        try {
            $tenantPerformance = CanteenTenant::with(['payments' => function($query) {
                $query->where('is_paid', true);
            }])
            ->get()
            ->map(function($tenant) {
                return [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'business_name' => $tenant->business_name,
                    'total_paid' => $tenant->payments->sum('amount'),
                    'payment_count' => $tenant->payments->count()
                ];
            })
            ->sortByDesc('total_paid')
            ->values();

            return response()->json($tenantPerformance);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch tenant performance'], 500);
        }
    }
}
