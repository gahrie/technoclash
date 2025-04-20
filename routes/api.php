<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\SignUpController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ChallengeProblemController;
use App\Http\Controllers\API\SubmissionController;

Route::post('/login', [AuthController::class, 'login'])->name('api.login');
Route::post('/signup/credentials', [SignUpController::class, 'credentials']);
Route::post('/signup/information', [SignUpController::class, 'information']);
Route::post('/signup/verify-email', [SignUpController::class, 'verifyEmail']);
Route::post('/signup/resend-verification', [SignUpController::class, 'resendVerification']);
Route::middleware('auth:sanctum')->get('/users', [UserController::class, 'index']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user'])->name('api.user');

    // User management routes
    Route::get('/users', [UserController::class, 'index']); // List users
    Route::get('/users/{id}', [UserController::class, 'show']); // Fetch single user
    Route::put('/users/{id}', [UserController::class, 'update']); // Update user
    Route::put('/users/{id}/archive', [UserController::class, 'deactivateUser']);
    Route::put('/users/{id}/activate', [UserController::class, 'activateUser']);
    Route::prefix('admin')->group(function () {
        Route::post('/users/create', [UserController::class, 'store']);
    });

    // List all challenges (GET /api/challenges)
    Route::get('/challenges', [ChallengeProblemController::class, 'index'])->name('challenges.index');
    // Show a specific challenge (GET /api/challenges/{id})
    Route::get('/challenges/{id}', [ChallengeProblemController::class, 'show'])->name('challenges.show');
    // Create a new challenge (POST /api/challenges)
    Route::post('/challenges', [ChallengeProblemController::class, 'store'])->name('challenges.store');
    // Update an existing challenge (PUT /api/challenges/{id})
    Route::put('/challenges/{id}', [ChallengeProblemController::class, 'update'])->name('challenges.update');
    
    // Delete a challenge (DELETE /api/challenges/{id})
    Route::delete('/challenges/{id}', [ChallengeProblemController::class, 'destroy'])->name('challenges.destroy');
    
    Route::get('challenge-problems', [ChallengeProblemController::class, 'userChallenges']);
    Route::get('/challenge-problems/{id}', [ChallengeProblemController::class, 'show']);
    Route::post('/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/latest/{challengeProblemId}', [SubmissionController::class, 'latest']);
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');
});