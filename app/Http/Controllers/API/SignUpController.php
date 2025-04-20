<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

class SignUpController extends Controller
{
    public function credentials(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => [
                'required',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[a-z]/',
                'regex:/[0-9]/',
                'regex:/[!@#$%^&*(),_.?":{}|<>]/',
            ],
        ], [
            'password.min' => 'Password must be at least 8 characters.',
            'password.regex' => 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
        ]);

        User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'registration_progress' => 'credentials',
        ]);

        return response()->json(['message' => 'Credentials saved'], 200);
    }

    public function information(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'role' => 'required|in:student,professor',
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'university' => 'nullable|string|max:255',
        ]);

        $user = User::where('email', $request->email)->first();
        if ($user->registration_progress !== 'credentials') {
            return response()->json(['message' => 'Invalid signup step'], 400);
        }

        $user->profile()->update([
            'first_name' => ucwords(strtolower($request->firstname)),
            'last_name' => ucwords(strtolower($request->lastname)),
            'university' => ucwords(strtolower($request->university)),
        ]);

        $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'role' => $request->role,
            'registration_progress' => 'information',
            'verification_code' => $code,
            'verification_code_expires_at' => now()->addMinutes(15),
        ]);

        Mail::to($user->email)->send(new VerificationCodeMail($code));

        return response()->json(['message' => 'Information saved. Check your email for the verification code.']);
    }

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6',
        ]);

        $user = User::where('email', $request->email)->first();
        if ($user->registration_progress !== 'information') {
            return response()->json(['message' => 'Invalid signup step'], 400);
        }

        if ($user->verification_code !== $request->code || $user->verification_code_expires_at < now()) {
            return response()->json(['message' => 'Invalid or expired verification code'], 400);
        }

        $user->update([
            'registration_progress' => 'completed',
            'email_verified_at' => now(),
            'verification_code' => null,
            'verification_code_expires_at' => null,
        ]);

        return response()->json(['message' => 'Email verified. Please log in.']);
    }

    public function resendVerification(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $user = User::where('email', $request->email)->first();
        if ($user->registration_progress !== 'information') {
            return response()->json(['message' => 'Invalid signup step'], 400);
        }

        $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $user->update([
            'verification_code' => $code,
            'verification_code_expires_at' => now()->addMinutes(15),
        ]);

        Mail::to($user->email)->send(new VerificationCodeMail($code));

        return response()->json(['message' => 'Verification code resent']);
    }
}