<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\BaseApiController;
use App\Models\User;
use App\Models\ForgetPassword;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends BaseApiController
{
    /**
     * User login
     */
    public function login(Request $request)
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
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            \Log::info('Validation failed: ' . json_encode($validator->errors()));
            return $this->validationErrorResponse($validator->errors());
        }

        if (!Auth::attempt(['email' => $data['email'], 'password' => $data['password']])) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        $user = Auth::user();
        
        if (!$user->is_active) {
            Auth::logout();
            return $this->errorResponse('Account is deactivated', 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse([
            'user' => $user->load('roles'),
            'token' => $token,
            'role' => $user->getPrimaryRole()->name,
            'permissions' => $this->getUserPermissions($user),
        ], 'Login successful');
    }

    /**
     * User registration
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            // Use hashed cast on the model; assign plain password here
            'password' => $request->password,
            'phone' => $request->phone,
            'address' => $request->address,
            'role' => 'user', // Default role
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return $this->successResponse([
            'user' => $user,
            'token' => $token,
        ], 'Registration successful', 201);
    }

    /**
     * Get user permissions based on their roles
     */
    private function getUserPermissions($user)
    {
        $permissions = [];
        foreach ($user->roles as $role) {
            foreach ($role->permissions as $permission) {
                $permissions[] = $permission->name;
            }
        }
        return array_unique($permissions);
    }

    /**
     * User logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return $this->successResponse(null, 'Logout successful');
    }

    /**
     * Forgot password
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $email = $request->email;
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Delete existing OTP for this email
        ForgetPassword::where('email', $email)->delete();
        
        // Create new OTP
        ForgetPassword::create([
            'email' => $email,
            'otp' => $otp,
            'expires_at' => now()->addMinutes(10),
        ]);

        // TODO: Send OTP via email/SMS
        // For now, just return the OTP in response (remove in production)
        
        return $this->successResponse([
            'otp' => $otp, // Remove this in production
            'message' => 'OTP sent to your email'
        ], 'OTP sent successfully');
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $forgetPassword = ForgetPassword::where('email', $request->email)
            ->where('otp', $request->otp)
            ->where('expires_at', '>', now())
            ->where('is_used', false)
            ->first();

        if (!$forgetPassword) {
            return $this->errorResponse('Invalid or expired OTP', 400);
        }

        $forgetPassword->update(['is_used' => true]);

        return $this->successResponse(null, 'OTP verified successfully');
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $forgetPassword = ForgetPassword::where('email', $request->email)
            ->where('otp', $request->otp)
            ->where('is_used', true)
            ->first();

        if (!$forgetPassword) {
            return $this->errorResponse('Invalid OTP or OTP not verified', 400);
        }

        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return $this->notFoundResponse('User not found');
        }

        // Assign plain password; model cast will hash
        $user->update(['password' => $request->password]);
        
        // Delete the used OTP
        $forgetPassword->delete();

        return $this->successResponse(null, 'Password reset successfully');
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user->update($request->only(['name', 'phone', 'address']));

        return $this->successResponse($user->fresh(), 'Profile updated successfully');
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('Current password is incorrect', 400);
        }

        // Assign plain password; model cast will hash
        $user->update(['password' => $request->password]);

        return $this->successResponse(null, 'Password changed successfully');
    }
}
