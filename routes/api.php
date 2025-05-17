<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\SignUpController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ProblemController;
use App\Http\Controllers\API\SubmissionController;
use App\Http\Controllers\API\LevelController;
use App\Http\Controllers\API\StudentProblemController;
use App\Http\Controllers\API\CompetitiveController;
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
    Route::get('/users/demographics', [UserController::class, 'demographics']);
    Route::get('/users/{id}', [UserController::class, 'show']); // Fetch single user
    Route::put('/users/{id}', [UserController::class, 'update']); // Update user
    Route::put('/users/{id}/deactivate', [UserController::class, 'deactivateUser']);
    Route::put('/users/{id}/activate', [UserController::class, 'activateUser']);
    Route::prefix('admin')->group(function () {
        Route::post('/users/create', [UserController::class, 'store']);
    });

    Route::get('/levels/{level}', [LevelController::class, 'show']);
    // List all challenges (GET /api/challenges)
    Route::get('/problems', [ProblemController::class, 'index'])->name('problems.index');
    Route::get('/problems/demographics', [ProblemController::class, 'demographics']);
    // Show a specific challenge (GET /api/problems/{id})
    Route::get('/problems/{id}', [ProblemController::class, 'show'])->name('problems.show');
    // Create a new challenge (POST /api/problems)
    Route::post('/problems', [ProblemController::class, 'store'])->name('problems.store');
    // Update an existing challenge (PUT /api/problems/{id})
    Route::put('/problems/{id}', [ProblemController::class, 'update'])->name('problems.update');

    Route::get('/student/problems', [StudentProblemController::class, 'index']);
    Route::get('/student/problems/progress', [StudentProblemController::class, 'progress']);
    Route::get('/student/problems/{id}', [StudentProblemController::class, 'show']);
    // Delete a challenge (DELETE /api/problems/{id})
    Route::delete('/problems/{id}', [ProblemController::class, 'destroy'])->name('problems.destroy');
    
    Route::post('/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/latest/{challengeProblemId}', [SubmissionController::class, 'latest']);
    Route::post('/logout', [AuthController::class, 'logout'])->name('api.logout');

    
    Route::middleware('auth:sanctum')->prefix('student/competitive')->group(function () {
        Route::get('/rooms', [CompetitiveController::class, 'index']);
        Route::post('/rooms', [CompetitiveController::class, 'store']);
        Route::post('/rooms/{roomId}/join', [CompetitiveController::class, 'join']);
        Route::get('/rooms/{roomId}', [CompetitiveController::class, 'getRoom']);
        Route::post('/rooms/{roomId}/pass-host', [CompetitiveController::class, 'passHost']);
        Route::post('/rooms/{roomId}/start', [CompetitiveController::class, 'startMatch']);
        Route::post('/rooms/{roomId}/leave', [CompetitiveController::class, 'leaveRoom']);
        Route::get('/rank', [CompetitiveController::class, 'getRank']);
        Route::get('/rooms/{roomId}/match', [CompetitiveController::class, 'getMatch']);
        Route::post('/rooms/{roomId}/finish', [CompetitiveController::class, 'finishMatch']);
        Route::post('/rooms/{roomId}/submit', [CompetitiveController::class, 'submitMatchSolution']);
        Route::post('/rooms/{roomId}/timeout', [CompetitiveController::class, 'timeoutMatch']);
        Route::get('/pending-rooms', [CompetitiveController::class, 'checkPendingRooms']);
    });

    Route::get('/user-profiles/{userId}', [SubmissionController::class, 'getUserProfile']);
    Route::post('/user-profiles/{userId}/update-exp', [SubmissionController::class, 'updateUserExp']);
    Route::get('/user-problem-progress/{userId}/{problemId}', [SubmissionController::class, 'getUserProblemProgress']);
    Route::post('/user-problem-progress', [SubmissionController::class, 'updateUserProblemProgress']);
});