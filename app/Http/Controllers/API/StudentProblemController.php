<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Problem;
use App\Models\UserProblemProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class StudentProblemController extends Controller
{
    /**
     * Display a paginated listing of problems with student-specific filters and sorting.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
{
    try {
        $perPage = $request->query('rows', 10);
        $search = $request->query('search', '');
        $difficulty = $request->query('difficulty', []);
        $tags = $request->query('tags', []);
        $progressStatus = $request->query('progress_status', []);
        $sortBy = $request->query('sort_by', 'title');
        $sortDirection = $request->query('sort_direction', 'asc');

        Log::info('Filter parameters:', [
            'search' => $search,
            'difficulty' => $difficulty,
            'tags' => $tags,
            'progress_status' => $progressStatus,
            'sort_by' => $sortBy,
            'sort_direction' => $sortDirection,
            'rows' => $perPage,
        ]);

        $query = Problem::with('user.profile')
            ->where('problems.status', 'Active');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('problems.title', 'like', "%{$search}%")
                  ->orWhere('problems.description', 'like', "%{$search}%");
            });
        }

        if (!empty($difficulty) && is_array($difficulty)) {
            $query->whereIn('problems.difficulty', $difficulty);
        }

        if (!empty($tags) && is_array($tags)) {
            $tags = array_map('strtolower', $tags);
            $query->where(function ($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->whereJsonContains('problems.tags', $tag);
                }
            });
        }

        if ($request->user()) {
            $query->leftJoin('user_problem_progress', function ($join) use ($request) {
                $join->on('problems.id', '=', 'user_problem_progress.problem_id')
                                    ->where('user_problem_progress.user_id', '=', $request->user()->id);
            });

            $query->select(
                'problems.*',
                'user_problem_progress.status as progress_status',
                'user_problem_progress.submission_count',
                'user_problem_progress.attempt_count',
                'user_problem_progress.success_rate',
                'user_problem_progress.first_success_at'
            );

            if (!empty($progressStatus) && is_array($progressStatus)) {
                $validStatuses = ['Solved', 'Attempted', 'Not Attempted'];
                $progressStatus = array_intersect($progressStatus, $validStatuses);

                if (!empty($progressStatus)) {
                    $query->where(function ($q) use ($progressStatus) {
                        if (in_array('Solved', $progressStatus)) {
                            $q->orWhere('user_problem_progress.status', 'Solved');
                        }
                        if (in_array('Attempted', $progressStatus)) {
                            $q->orWhere('user_problem_progress.status', 'Attempted');
                        }
                        if (in_array('Not Attempted', $progressStatus)) {
                            $q->orWhereNull('user_problem_progress.id');
                        }
                    });
                }
            }
        }

        $sortableColumns = [
            'id' => 'problems.id',
            'title' => 'problems.title',
            'difficulty' => 'problems.difficulty',
            'progress_status' => 'progress_status',
            'submission_count' => 'submission_count',
            'success_rate' => 'success_rate',
            'tags' => 'problems.tags'
        ];

        $column = isset($sortableColumns[$sortBy]) ? $sortableColumns[$sortBy] : 'problems.title';
        $direction = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'asc';
        $query->orderBy($column, $direction);

        $problems = $query->paginate($perPage);

        Log::info('Filtered problems count:', ['count' => $problems->total()]);

        $response = [
            'data' => $problems->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $problems->currentPage(),
                    'total_pages' => $problems->lastPage(),
                    'total' => $problems->total(),
                    'per_page' => $problems->perPage(),
                ],
            ],
        ];

        return response()->json($response);
    } catch (\Exception $e) {
        Log::error('Failed to fetch student problems', ['error' => $e->getMessage()]);
        return response()->json(['message' => 'Failed to fetch problems'], 500);
    }
}


    /**
     * Fetch progress statistics for the authenticated student.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function progress(Request $request)
    {
        try {
            if (!$request->user()) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            $progress = UserProblemProgress::where('user_id', $request->user()->id)
                ->selectRaw('
                    SUM(CASE WHEN status = "Solved" THEN 1 ELSE 0 END) as solved,
                    SUM(CASE WHEN status = "Attempted" THEN 1 ELSE 0 END) as attempted,
                    COUNT(*) as total_progress,
                    SUM(submission_count) as total_submissions,
                    AVG(submission_count) as avg_submissions_per_problem,
                    AVG(success_rate) as avg_success_rate
                ')
                ->first();

            $total = Problem::where('problems.status', 'Active')->count();
            $not_attempted = $total - ($progress->solved + $progress->attempted);

            $response = [
                'progress' => [
                    'solved' => (int) $progress->solved,
                    'attempted' => (int) $progress->attempted,
                    'not_attempted' => max(0, $not_attempted),
                    'total' => $total,
                    'total_submissions' => (int) $progress->total_submissions,
                    'avg_submissions_per_problem' => round($progress->avg_submissions_per_problem, 2),
                    'avg_success_rate' => round($progress->avg_success_rate, 2),
                ],
            ];

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Failed to fetch student progress', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch progress data'], 500);
        }
    }

    /**
     * Show a single problem for a student.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $problem = Problem::with(['user.profile', 'testCases'])
                ->where('problems.status', 'Active')
                ->findOrFail($id);

            // Include user progress if authenticated
            if (auth()->check()) {
                $progress = UserProblemProgress::where('user_id', auth()->id())
                    ->where('problem_id', $id)
                    ->first();

                $problem->progress_status = $progress ? $progress->status : 'Not Attempted';
                $problem->submission_count = $progress ? $progress->submission_count : 0;
                $problem->success_rate = $progress ? $progress->success_rate : 0;
            }

            return response()->json(['data' => $problem]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Student problem not found', ['id' => $id]);
            return response()->json(['message' => 'Problem not found or not available'], 404);
        } catch (\Exception $e) {
            Log::error('Failed to fetch student problem', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch problem'], 500);
        }
    }
}