<?php
namespace App\Http\Controllers\API;
use App\Models\Submission;  
use App\Models\UserProblemProgress;
use App\Models\UserProfile;
use App\Models\Level;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubmissionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'problem_id' => 'required|exists:problems,id',
            'language_id' => 'required|integer',
            'source_code' => 'required|string',
            'status' => 'required|string',
            'stdout' => 'nullable|string',
            'stderr' => 'nullable|string',
            'execution_time' => 'nullable|numeric',
            'memory_used' => 'nullable|integer',
        ]);

        $submission = Submission::create([
            'user_id' => auth()->id(),
            'problem_id' => $request->problem_id,
            'language_id' => $request->language_id,
            'source_code' => $request->source_code,
            'status' => $request->status,
            'stdout' => $request->stdout,
            'stderr' => $request->stderr,
            'execution_time' => $request->execution_time,
            'memory_used' => $request->memory_used,
            'mode' => 'Progressive',
        ]);

        // Update user_problem_progress
        $progress = UserProblemProgress::firstOrCreate(
            [
                'user_id' => auth()->id(),
                'problem_id' => $request->problem_id,
            ],
            [
                'status' => 'Not Attempted',
                'submission_count' => 0,
                'accepted_count' => 0,
                'attempt_count' => 0,
                'success_rate' => 0,
            ]
        );

        $progress->submission_count += 1;
        $progress->last_attempted_at = now();
        
        $expAwarded = 0;
        if ($request->status === 'Accepted') {
            $wasPreviouslySolved = $progress->first_success_at !== null;
            $progress->status = 'Solved';
            $progress->accepted_count += 1;
            if (!$wasPreviouslySolved) {
                $progress->first_success_at = now();
                $problem = \App\Models\Problem::find($request->problem_id);
                $profile = UserProfile::where('user_id', auth()->id())->first();
                if ($profile && $problem) {
                    $expAwarded = $problem->exp_reward;
                    $profile->exp += $expAwarded;
                    
                    // Update level
                    $currentLevel = Level::where('minimum_exp', '<=', $profile->exp)
                        ->where('maximum_exp', '>=', $profile->exp)
                        ->first();
                    if ($currentLevel) {
                        $profile->level = $currentLevel->level;
                    }
                    
                    $profile->save();
                    Log::info("EXP awarded", [
                        'user_id' => auth()->id(),
                        'problem_id' => $request->problem_id,
                        'exp_reward' => $expAwarded,
                    ]);
                }
            }
            $progress->success_rate = $progress->submission_count > 0
                ? ($progress->accepted_count / $progress->submission_count) * 100
                : 0;
        } else {
            $progress->status = $progress->status === 'Solved' ? 'Solved' : 'Attempted';
            $progress->success_rate = $progress->submission_count > 0
                ? ($progress->accepted_count / $progress->submission_count) * 100
                : 0;
        }
        
        $progress->save();

        return response()->json([
            'message' => 'Submission saved successfully',
            'submission' => $submission,
            'exp_awarded' => $expAwarded,
            'was_previously_solved' => $progress->first_success_at !== null,
        ], 201);
    }

    public function latest($challengeProblemId)
    {
        $submission = Submission::where('user_id', auth()->id())
            ->where('problem_id', $challengeProblemId)
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json($submission ?: []);
    }

    public function getUserProfile($userId)
    {
        $profile = UserProfile::where('user_id', $userId)->first();
        if (!$profile) {
            return response()->json(['message' => 'Profile not found'], 404);
        }
        return response()->json(['data' => $profile]);
    }

    public function updateUserExp(Request $request, $userId)
    {
        $request->validate([
            'exp_reward' => 'required|integer|min:0',
            'problem_id' => 'required|exists:problems,id',
        ]);

        $profile = UserProfile::where('user_id', $userId)->first();
        if (!$profile) {
            return response()->json(['message' => 'Profile not found'], 404);
        }

        $progress = UserProblemProgress::where('user_id', $userId)
            ->where('problem_id', $request->problem_id)
            ->first();

        if ($progress && $progress->first_success_at) {
            return response()->json(['message' => 'EXP already awarded for this problem'], 400);
        }

        $profile->exp += $request->exp_reward;
        
        // Update level
        $currentLevel = Level::where('minimum_exp', '<=', $profile->exp)
            ->where('maximum_exp', '>=', $profile->exp)
            ->first();
        if ($currentLevel) {
            $profile->level = $currentLevel->level;
        }
        
        $profile->save();

        return response()->json(['data' => $profile]);
    }

    public function getUserProblemProgress($userId, $problemId)
    {
        $progress = UserProblemProgress::where('user_id', $userId)
            ->where('problem_id', $problemId)
            ->first();
        
        return response()->json(['data' => $progress ?: []]);
    }

    public function updateUserProblemProgress(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'problem_id' => 'required|exists:problems,id',
            'status' => 'required|in:Not Attempted,Attempted,Solved',
            'submission_count' => 'required|integer|min:0',
            'attempt_count' => 'required|integer|min:0',
            'success_rate' => 'required|numeric|min:0|max:100',
            'first_success_at' => 'nullable|date',
            'last_attempted_at' => 'required|date',
        ]);

        $progress = UserProblemProgress::firstOrCreate(
            [
                'user_id' => $request->user_id,
                'problem_id' => $request->problem_id,
            ],
            [
                'status' => 'Not Attempted',
                'submission_count' => 0,
                'accepted_count' => 0,
                'attempt_count' => 0,
                'success_rate' => 0,
            ]
        );

        $progress->status = $request->status;
        $progress->submission_count = $request->submission_count;
        $progress->accepted_count = $request->accepted_count ?? $progress->accepted_count;
        $progress->attempt_count = $request->attempt_count;
        $progress->success_rate = $request->success_rate;
        $progress->first_success_at = $request->first_success_at
            ? (new \DateTime($request->first_success_at))->format('Y-m-d H:i:s')
            : $progress->first_success_at;
        $progress->last_attempted_at = (new \DateTime($request->last_attempted_at))->format('Y-m-d H:i:s');
        $progress->save();

        return response()->json(['data' => $progress]);
    }
}