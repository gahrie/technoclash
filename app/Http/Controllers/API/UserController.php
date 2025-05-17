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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

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
        $sortBy = $request->query('sort_by', 'id');
        $sortDirection = $request->query('sort_direction', 'asc');

        $query = User::with('profile')->select('users.*');

        // Exclude the authenticated user
        $query->where('users.id', '!=', auth()->id());

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

        // Handle sorting
        if ($sortBy) {
            if ($sortBy === 'name') {
                $query->join('user_profiles', 'users.id', '=', 'user_profiles.user_id')
                ->orderBy('user_profiles.first_name', $sortDirection)
                ->orderBy('user_profiles.last_name', $sortDirection);
            } else {
                $query->orderBy($sortBy, $sortDirection);
            }
        }

        $users = $query->paginate($perPage);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'total_pages' => $users->lastPage(),
                    'total' => $users->total()
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
            'first_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\'-]+$/'],
            'last_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\'-]+$/'],
            'username' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z0-9]+$/', 'unique:user_profiles'],
            'gender' => ['required', 'in:Male,Female,Other'],
            'bio' => ['nullable', 'string'],
            'university' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email' => ['required', 'email', 'max:255', 'unique:users'],
            'role' => ['required', 'in:Admin,Student,Professor'],
            'password' => [
                'required',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'regex:/[!@#$%^&*(),_.?":{}|<>]/',
                'confirmed'
            ],
            'level' => ['required', 'integer', 'min:1', 'max:50'],
            'rating' => ['required', 'integer', 'min:0'],
            'exp' => ['required', 'integer', 'min:0'],
            'avatar' => ['nullable', 'image', 'mimes:png', 'max:2048'],
        ], [
            'first_name.regex' => 'First name can only contain letters, hyphens, and apostrophes.',
            'last_name.regex' => 'Last name can only contain letters, hyphens, and apostrophes.',
            'username.regex' => 'Username can only contain letters and numbers.',
            'university.regex' => 'University can only contain letters and spaces.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.regex' => 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
            'avatar.mimes' => 'Avatar must be a PNG file.',
            'avatar.max' => 'Avatar cannot exceed 2MB.',
            'level.min' => 'Level must be at least 1.',
            'level.max' => 'Level cannot exceed 50.',
            'rating.min' => 'Rating cannot be negative.',
            'exp.min' => 'Experience points cannot be negative.',
        ]);

        // Validate exp against minimum_exp for the level
        $levelData = DB::table('levels')->where('level', $request->level)->first();
        if (!$levelData) {
            return response()->json(['message' => 'Invalid level'], 422);
        }
        if ($request->exp < $levelData->minimum_exp) {
            return response()->json([
                'message' => "Experience points must be at least {$levelData->minimum_exp} for level {$request->level}"
            ], 422);
        }

        // Create avatars directory if it doesn't exist
        Storage::disk('public')->makeDirectory('avatars');

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $uniqueName = 'avatar_' . Str::uuid() . '.png';
            $avatarPath = 'avatars/' . $uniqueName;
            $request->file('avatar')->storeAs('avatars', $uniqueName, 'public');
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
            'first_name' => ucwords(strtolower($request->first_name)),
            'last_name' => ucwords(strtolower($request->last_name)),
            'username' => $request->username,
            'gender' => $request->gender,
            'avatar' => $avatarPath ?? null,
            'bio' => $request->bio ?? null,
            'university' => $request->university ? strtoupper($request->university) : null,
            'exp' => $request->exp,
            'level' => $request->level,
            'rating' => $request->rating,
            'win_streak' => 0,
        ]);

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

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\'-]+$/'],
            'last_name' => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\'-]+$/'],
            'username' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9]+$/',
                Rule::unique('user_profiles')->ignore($userProfile->id),
            ],
            'gender' => ['required', 'in:Male,Female,Other'],
            'bio' => ['nullable', 'string'],
            'university' => ['nullable', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'role' => ['required', 'in:Admin,Student,Professor'],
            'password' => [
                'nullable',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'regex:/[!@#$%^&*(),_.?":{}|<>]/',
                'confirmed',
            ],
            'level' => ['required', 'integer', 'min:1', 'max:50'],
            'rating' => ['required', 'integer', 'min:0'],
            'exp' => ['required', 'integer', 'min:0'],
            'avatar' => ['nullable', 'image', 'mimes:png', 'max:2048'],
        ], [
            'first_name.regex' => 'First name can only contain letters, hyphens, and apostrophes.',
            'last_name.regex' => 'Last name can only contain letters, hyphens, and apostrophes.',
            'username.regex' => 'Username can only contain letters and numbers.',
            'university.regex' => 'University can only contain letters and spaces.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.regex' => 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
            'avatar.mimes' => 'Avatar must be a PNG file.',
            'avatar.max' => 'Avatar cannot exceed 2MB.',
            'level.min' => 'Level must be at least 1.',
            'level.max' => 'Level cannot exceed 50.',
            'rating.min' => 'Rating cannot be negative.',
            'exp.min' => 'Experience points cannot be negative.',
        ]);

        // Validate exp against minimum_exp for the level
        $levelData = DB::table('levels')->where('level', $request->level)->first();
        if (!$levelData) {
            return response()->json(['message' => 'Invalid level'], 422);
        }
        if ($request->exp < $levelData->minimum_exp) {
            return response()->json([
                'message' => "Experience points must be at least {$levelData->minimum_exp} for level {$request->level}"
            ], 422);
        }

        // Create avatars directory if it doesn't exist
        Storage::disk('public')->makeDirectory('avatars');

        $avatarPath = $userProfile->avatar;
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($avatarPath) {
                Storage::disk('public')->delete($avatarPath);
            }
            $uniqueName = 'avatar_' . Str::uuid() . '.png';
            $avatarPath = 'avatars/' . $uniqueName;
            $request->file('avatar')->storeAs('avatars', $uniqueName, 'public');
        }

        $user->update([
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => !empty($validated['password']) ? Hash::make($validated['password']) : $user->password,
        ]);

        $userProfile->update([
            'first_name' => ucwords(strtolower($validated['first_name'])),
            'last_name' => ucwords(strtolower($validated['last_name'])),
            'username' => $validated['username'],
            'gender' => $validated['gender'],
            'avatar' => $avatarPath,
            'bio' => $validated['bio'] ?? null,
            'university' => $validated['university'] ? strtoupper($validated['university']) : null,
            'exp' => $validated['exp'],
            'level' => $validated['level'],
            'rating' => $validated['rating'],
        ]);

        return response()->json([
            'message' => 'User and profile updated successfully!',
            'user' => $user,
            'profile' => $userProfile,
        ], 200);
    }

    public function deactivateUser($id)
    {
        $user = User::findOrFail($id);

        // Set the user's status to inactive
        $user->status = 'Deactivated';
        $user->save();

        return response()->json([
            'message' => 'User deactivated successfully',
        ], 200);
    }

    public function activateUser($id)
    {
        $user = User::findOrFail($id);

        // Set the user's status to active
        $user->status = 'Activated';
        $user->save();
        return response()->json([
            'message' => 'User activated successfully',
        ], 200);
    }

    /**
     * Retrieve demographic data for users.
     */
    public function demographics()
    {
        try {
            $totalUsers = User::count();
            $totalAdmins = User::where('role', 'Admin')->count();
            $totalProfessors = User::where('role', 'Professor')->count();
            $totalStudents = User::where('role', 'Student')->count();
            $totalActive = User::where('status', 'Activated')->count();
            $totalInactive = User::where('status', 'Deactivated')->count();

            return response()->json([
                'total_users' => $totalUsers,
                'total_admins' => $totalAdmins,
                'total_professors' => $totalProfessors,
                'total_students' => $totalStudents,
                'total_active' => $totalActive,
                'total_inactive' => $totalInactive,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching demographics: ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch demographic data.',
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}