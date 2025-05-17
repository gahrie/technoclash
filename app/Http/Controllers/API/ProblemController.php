<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Problem;
use App\Models\TestCase;
use App\Models\UserProblemProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class ProblemController extends Controller
{
    /**
     * Display a paginated listing of the problems with dynamic search, filters, sorting, and optional user progress.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */

     // This is the way to get the problems in admin side.

    public function index(Request $request)
    {
        $perPage = $request->query('rows', 10);
        $search = $request->query('search', '');
        $difficulty = $request->query('difficulty', []);
        $status = $request->query('status', []);
        $tags = $request->query('tags', []); // Added tags filter

        $query = Problem::with('user.profile');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($difficulty)) {
            $query->whereIn('difficulty', $difficulty);
        }

        if (!empty($status)) {
            $query->whereIn('status', $status);
        }

        if (!empty($tags)) {
            $query->whereJsonContains('tags', $tags);
        }

        $challenges = $query->paginate($perPage);

        return response()->json([
            'data' => $challenges->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $challenges->currentPage(),
                    'total_pages' => $challenges->lastPage(),
                    'total' => $challenges->total(),
                ],
            ],
        ]);
    }

//    public function index(Request $request)
//     {
//         try {
//             $perPage = $request->query('rows', 10);
//             $search = $request->query('search', '');
//             $difficulty = $request->query('difficulty', []);
//             $status = $request->query('status', []);
//             $tags = $request->query('tags', []);
//             $progressStatus = $request->query('progress_status', []);
//             $sortBy = $request->query('sort_by', 'title');
//             $sortDirection = $request->query('sort_direction', 'asc');
//             $includeProgress = $request->query('include_progress', false);

//             $query = Problem::with('user.profile');

//             if ($search) {
//                 $query->where(function ($q) use ($search) {
//                     $q->where('title', 'like', "%{$search}%")
//                       ->orWhere('description', 'like', "%{$search}%");
//                 });
//             }

//             if (!empty($difficulty)) {
//                 $difficulty = is_array($difficulty) ? $difficulty : [$difficulty];
//                 $query->whereIn('difficulty', $difficulty);
//             }

//             if (!empty($status)) {
//                 $status = is_array($status) ? $status : [$status];
//                 $query->whereIn('status', $status);
//             }

//             if (!empty($tags)) {
//                 $tags = is_array($tags) ? $tags : [$tags];
//                 $query->where(function ($q) use ($tags) {
//                     foreach ($tags as $tag) {
//                         $q->whereJsonContains('tags', $tag);
//                     }
//                 });
//             }

//             // Always include user progress data for authenticated users
//             if ($request->user()) {
//                 $query->leftJoin('user_problem_progress', function ($join) use ($request) {
//                     $join->on('problems.id', '=', 'user_problem_progress.problem_id')
//                          ->where('user_problem_progress.user_id', '=', $request->user()->id);
//                 });

//                 $query->select(
//                     'problems.*',
//                     'user_problem_progress.status as progress_status',
//                     'user_problem_progress.submission_count',
//                     'user_problem_progress.attempt_count',
//                     'user_problem_progress.success_rate',
//                     'user_problem_progress.first_success_at'
//                 );

//                 // Filter by progress status if specified
//                 if (!empty($progressStatus)) {
//                     $progressStatus = is_array($progressStatus) ? $progressStatus : [$progressStatus];
//                     $validStatuses = ['Solved', 'Attempted', 'Not Attempted'];
//                     $progressStatus = array_intersect($progressStatus, $validStatuses);

//                     if (!empty($progressStatus)) {
//                         $query->where(function ($q) use ($progressStatus) {
//                             if (in_array('Not Attempted', $progressStatus)) {
//                                 $q->orWhereNull('user_problem_progress.id');
//                             }
//                             if (array_intersect(['Solved', 'Attempted'], $progressStatus)) {
//                                 $q->orWhereIn('user_problem_progress.status', $progressStatus);
//                             }
//                         });
//                     }
//                 }
//             }

//             // Sorting
//             $sortableColumns = [
//                 'id' => 'problems.id',
//                 'title' => 'problems.title',
//                 'difficulty' => 'problems.difficulty',
//                 'status' => 'problems.status',
//                 'user' => 'problems.user_id',
//                 'progress_status' => 'progress_status',
//                 'submission_count' => 'submission_count',
//                 'attempt_count' => 'attempt_count',
//                 'success_rate' => 'success_rate',
//             ];

//             $column = Arr::get($sortableColumns, $sortBy, 'problems.title');
//             $direction = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'asc';
//             $query->orderBy($column, $direction);

//             $problems = $query->paginate($perPage);

//             // Initialize response data
//             $response = [
//                 'data' => $problems->items(),
//                 'meta' => [
//                     'pagination' => [
//                         'current_page' => $problems->currentPage(),
//                         'total_pages' => $problems->lastPage(),
//                         'total' => $problems->total(),
//                         'per_page' => $problems->perPage(),
//                     ],
//                 ],
//             ];

//             // Include user progress if requested and user is authenticated
//             if ($includeProgress && $request->user()) {
//                 $progress = UserProblemProgress::where('user_id', $request->user()->id)
//                     ->selectRaw('
//                         SUM(CASE WHEN status = "Solved" THEN 1 ELSE 0 END) as solved,
//                         SUM(CASE WHEN status = "Attempted" THEN 1 ELSE 0 END) as attempted,
//                         COUNT(*) as total_progress,
//                         SUM(submission_count) as total_submissions,
//                         AVG(submission_count) as avg_submissions_per_problem,
//                         AVG(success_rate) as avg_success_rate
//                     ')
//                     ->first();

//                 $total = Problem::count();
//                 $not_attempted = $total - ($progress->solved + $progress->attempted);

//                 $response['progress'] = [
//                     'solved' => (int) $progress->solved,
//                     'attempted' => (int) $progress->attempted,
//                     'not_attempted' => max(0, $not_attempted),
//                     'total' => $total,
//                     'total_submissions' => (int) $progress->total_submissions,
//                     'avg_submissions_per_problem' => round($progress->avg_submissions_per_problem, 2),
//                     'avg_success_rate' => round($progress->avg_success_rate, 2),
//                 ];
//             }

//             return response()->json($response);
//         } catch (\Exception $e) {
//             Log::error('Failed to fetch problems', ['error' => $e->getMessage()]);
//             return response()->json(['message' => 'Failed to fetch problems'], 500);
//         }
//     }

    /**
     * Show a single problem.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $problem = Problem::with(['user.profile', 'testCases'])->findOrFail($id);
            return response()->json(['data' => $problem]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Problem not found', ['id' => $id]);
            return response()->json(['message' => 'Problem not found'], 404);
        } catch (\Exception $e) {
            Log::error('Failed to fetch problem', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch problem'], 500);
        }
    }

    /**
     * Create a new problem.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            if ($request->user()->role !== 'Admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $tags = $request->input('tags');
            if (is_string($tags)) {
                $tags = json_decode($tags, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return response()->json(['errors' => ['tags' => ['Invalid tags format']]], 422);
                }
            }
            $tags = is_array($tags) ? $tags : [];

            $testCases = $request->input('test_cases');
            if (is_string($testCases)) {
                $testCases = json_decode($testCases, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return response()->json(['errors' => ['test_cases' => ['Invalid test_cases format']]], 422);
                }
            }
            $testCases = is_array($testCases) ? $testCases : [];

            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'description' => ['required', 'string'],
                'difficulty' => ['required', 'in:easy,medium,hard'],
                'constraints' => ['nullable', 'string'],
                'tags' => ['nullable', 'array'],
                'tags.*' => ['string', 'max:50'],
                'test_cases' => ['required', 'array', 'min:1'],
                'test_cases.*.input' => ['required', 'string'],
                'test_cases.*.expected_output' => ['required', 'string'],
                'test_cases.*.is_sample' => ['boolean'],
                'status' => ['sometimes', 'in:active,archived'],
            ]);

            $expReward = match ($validated['difficulty']) {
                'easy' => 100,
                'medium' => 300,
                'hard' => 500,
                default => 0,
            };

            Log::info('Creating problem', [
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'difficulty' => $validated['difficulty'],
            ]);

            $problem = Problem::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'difficulty' => $validated['difficulty'],
                'exp_reward' => $expReward,
                'constraints' => $validated['constraints'],
                'tags' => $validated['tags'] ?? [],
                'status' => ucfirst($validated['status'] ?? 'active'),
            ]);

            foreach ($validated['test_cases'] as $testCaseData) {
                $problem->testCases()->create([
                    'input' => $testCaseData['input'],
                    'expected_output' => $testCaseData['expected_output'],
                    'is_sample' => $testCaseData['is_sample'] ?? false,
                ]);
            }

            return response()->json([
                'message' => 'Problem created successfully',
                'data' => $problem->load('testCases'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed for creating problem', ['errors' => $e->errors()]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to create problem', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create problem'], 500);
        }
    }

    /**
     * Update an existing problem.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            if ($request->user()->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $problem = Problem::findOrFail($id);

            $tags = $request->input('tags', '[]');
            if (is_string($tags)) {
                $tags = json_decode($tags, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return response()->json(['errors' => ['tags' => ['Invalid tags format']]], 422);
                }
            }
            $tags = is_array($tags) ? $tags : [];

            $testCases = $request->input('test_cases', '[]');
            if (is_string($testCases)) {
                $testCases = json_decode($testCases, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    return response()->json(['errors' => ['test_cases' => ['Invalid test_cases format']]], 422);
                }
            }
            $testCases = is_array($testCases) ? $testCases : [];

            $request->merge([
                'tags' => $tags,
                'test_cases' => $testCases,
            ]);

            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'description' => ['required', 'string'],
                'difficulty' => ['required', 'in:easy,medium,hard'],
                'constraints' => ['nullable', 'string'],
                'tags' => ['nullable', 'array'],
                'tags.*' => ['string', 'max:50'],
                'test_cases' => ['required', 'array', 'min:1'],
                'test_cases.*.input' => ['required', 'string', 'min:1'],
                'test_cases.*.expected_output' => ['required', 'string', 'min:1'],
                'test_cases.*.is_sample' => ['boolean'],
                'status' => ['required', 'in:active,archived'],
            ]);

            $expReward = match ($validated['difficulty']) {
                'easy' => 100,
                'medium' => 300,
                'hard' => 500,
                default => $problem->exp_reward,
            };

            $problem->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'difficulty' => $validated['difficulty'],
                'exp_reward' => $expReward,
                'constraints' => $validated['constraints'],
                'tags' => $validated['tags'] ?? $problem->tags,
                'status' => ucfirst($validated['status']),
            ]);

            $problem->testCases()->delete();
            foreach ($validated['test_cases'] as $testCaseData) {
                $problem->testCases()->create([
                    'input' => $testCaseData['input'],
                    'expected_output' => $testCaseData['expected_output'],
                    'is_sample' => $testCaseData['is_sample'] ?? false,
                ]);
            }

            return response()->json([
                'message' => 'Problem updated successfully',
                'data' => $problem->load('testCases'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Problem not found', ['id' => $id]);
            return response()->json(['message' => 'Problem not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed for updating problem', [
                'id' => $id,
                'errors' => $e->errors(),
                'input' => $request->all(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to update problem', [
                'id' => $id,
                'error' => $e->getMessage(),
                'input' => $request->all(),
            ]);
            return response()->json(['message' => 'Failed to update problem'], 500);
        }
    }

    /**
     * Delete a problem.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        try {
            if ($request->user()->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $problem = Problem::findOrFail($id);

            $problem->delete();

            return response()->json(['message' => 'Problem deleted successfully']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Problem not found', ['id' => $id]);
            return response()->json(['message' => 'Problem not found'], 404);
        } catch (\Exception $e) {
            Log::error('Failed to delete problem', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to delete problem'], 500);
        }
    }

    /**
     * Get demographics of problems.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function demographics(Request $request)
    {
        try {
            if ($request->user()->role !== 'Admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            return response()->json([
                'total_problems' => Problem::count(),
                'total_easy' => Problem::where('difficulty', 'Easy')->count(),
                'total_medium' => Problem::where('difficulty', 'Medium')->count(),
                'total_hard' => Problem::where('difficulty', 'Hard')->count(),
                'total_active' => Problem::where('status', 'Active')->count(),
                'total_inactive' => Problem::where('status', 'Archived')->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch problem demographics', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch problem demographics'], 500);
        }
    }
}