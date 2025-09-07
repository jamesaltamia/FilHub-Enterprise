<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = $request->user();
        
        // Check if user has the required permission through their roles
        $hasPermission = false;
        foreach ($user->roles as $role) {
            if ($role->hasPermission($permission)) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            return response()->json([
                'message' => 'Access denied. Insufficient permissions.',
                'required_permission' => $permission,
                'user_roles' => $user->roles->pluck('name')
            ], 403);
        }

        return $next($request);
    }
}
