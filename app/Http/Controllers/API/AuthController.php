<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Log;
class AuthController extends Controller
{
    /**
     * Handle user login and return token and role.
     */
    public function login(Request $request)
    {

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            if ($user->registration_progress !== 'Completed') {
                return response()->json([
                    'message' => 'Complete your registration before logging in.',
                    'signup_email' => $user->email,
                    'registration_progress' => $user->registration_progress,
                ], 403);
            }
            $token = $user->createToken('authToken')->plainTextToken;

            return response()->json([
                'user_id' => $user->id,
                'token' => $token,
                'name' => $user->profile->first_name . ' ' . $user->profile->last_name,
                'role' => $user->role,
            ]);
        }
        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    /**
     * Return the authenticated user's data.
     */
    public function user(Request $request)
    {
        return new UserResource($request->user());
    }

    /**
     * Log out the authenticated user.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out']);
    }
}