<?php

namespace App\Http\Controllers\API;

use App\Models\User;
use App\Models\UserProfile;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPage = $request->query('rows', 10);
        $role = $request->query('role', []);
        $status = $request->query('status', []);
        $search = $request->query('search', '');

        $query = User::with('profile');

        if (!empty($role)) {
            $query->whereIn('role', $role);
        }

        if (!empty($status)) {
            $query->whereIn('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhereHas('profile', function ($q2) use ($search) {
                      $q2->where('first_name', 'like', "%{$search}%")
                         ->orWhere('last_name', 'like', "%{$search}%")
                         ->orWhere('username', 'like', "%{$search}%");
                  });
            });
        }

        $users = $query->paginate($perPage);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'total_pages' => $users->lastPage(),
                    'total' => $users->total(),
                ],
            ],
        ]);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:user_profiles'],
            'gender' => ['required', 'in:male,female,other'],
            'bio' => ['nullable', 'string'],
            'university' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users'],
            'role' => ['required', 'in:admin,user,moderator'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'], // Max 2MB
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }
        
        $user = User::create([
            'email' => $request->email,
            'email_verified_at' => now(),
            'registration_progress' => 'completed',
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        $userProfile = UserProfile::create([
                'user_id' => $user->id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'username' => $request->username,
                'gender' => $request->gender,
                'avatar' => $request->avatar ?? 'default-avatar.png',
                'bio' => $request->bio ?? null,
                'university' => $request->university ?? null,
                'points' => 1000,
                'win_streak' => 0,
            ]);

            // Return success response
            return response()->json([
                'message' => 'User and profile created successfully!',
                'user' => $user,
                'profile' => $userProfile,
            ], 201);
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $user = User::findOrFail($id);
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $userProfile = UserProfile::where('user_id', $user->id)->first();

        if (!$userProfile) {
            return response()->json(['message' => 'User profile not found'], 404);
        }

        // Use 'required_without' to ensure fields are present unless explicitly unchanged
        $validated = $request->validate([
            'first_name' => ['required_without:_method', 'string', 'max:255'],
            'last_name' => ['required_without:_method', 'string', 'max:255'],
            'username' => ['required_without:_method', 'string', 'max:255', Rule::unique('user_profiles')->ignore($userProfile->id)],
            'gender' => ['required_without:_method', 'in:male,female,other'],
            'bio' => ['nullable', 'string'],
            'university' => ['nullable', 'string', 'max:255'],
            'email' => ['required_without:_method', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['required_without:_method', 'in:admin,user,moderator'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ]);

        $avatarPath = $userProfile->avatar;
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($avatarPath) {
                Storage::disk('public')->delete($avatarPath);
            }
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update([
            'email' => $validated['email'] ?? $user->email,
            'role' => $validated['role'] ?? $user->role,
            'password' => !empty($validated['password']) ? Hash::make($validated['password']) : $user->password,
        ]);

        $userProfile->update([
            'first_name' => $validated['first_name'] ?? $userProfile->first_name,
            'last_name' => $validated['last_name'] ?? $userProfile->last_name,
            'username' => $validated['username'] ?? $userProfile->username,
            'gender' => $validated['gender'] ?? $userProfile->gender,
            'avatar' => $avatarPath ?? $userProfile->avatar,
            'bio' => $validated['bio'] ?? $userProfile->bio,
            'university' => $validated['university'] ?? $userProfile->university,
        ]);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->load('profile'),
        ]);
    }

    public function deactivateUser($id)
    {
        $user = User::findOrFail($id);

        // Set the user's status to inactive
        $user->status = 'Deactivated';
        $user->save();

        return response()->json([
            'message' => 'User deactivate successfully',
        ], 200);
    }

    public function activateUser($id)
    {
        $user = User::findOrFail($id);

        // Set the user's status to inactive
        $user->status = 'Activated';
        $user->save();
        return response()->json([
            'message' => 'User activate successfully',
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
