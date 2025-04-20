<?php

namespace App\Http\Controllers\API;
use App\Models\Submission;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
class SubmissionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'challenge_problem_id' => 'required|exists:challenge_problems,id',
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
            'challenge_problem_id' => $request->challenge_problem_id,
            'language_id' => $request->language_id,
            'source_code' => $request->source_code,
            'status' => $request->status,
            'stdout' => $request->stdout,
            'stderr' => $request->stderr,
            'execution_time' => $request->execution_time,
            'memory_used' => $request->memory_used,
        ]);

        return response()->json(['message' => 'Submission saved successfully', 'submission' => $submission], 201);
    }

    public function latest($challengeProblemId)
    {
        $submission = Submission::where('user_id', auth()->id())
            ->where('challenge_problem_id', $challengeProblemId)
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json($submission ?: []);
    }
}