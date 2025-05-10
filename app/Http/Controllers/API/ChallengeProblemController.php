<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChallengeProblem;
use App\Models\TestCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class ChallengeProblemController extends Controller
{
    /**
     * Display a paginated listing of the challenge problems with dynamic search, filters, and sorting.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $perPage = $request->query('rows', 10);
        $search = $request->query('search', '');
        $difficulty = $request->query('difficulty', []);
        $status = $request->query('status', []);
        $tags = $request->query('tags', []);
        $sortBy = $request->query('sort_by', 'title');
        $sortDirection = $request->query('sort_direction', 'asc');

        $query = ChallengeProblem::with('user.profile');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (!empty($difficulty)) {
            $difficulty = is_array($difficulty) ? $difficulty : [$difficulty];
            $query->whereIn('difficulty', $difficulty);
        }

        if (!empty($status)) {
            $status = is_array($status) ? $status : [$status];
            $query->whereIn('status', $status);
        }

        if (!empty($tags)) {
            $tags = is_array($tags) ? $tags : [$tags];
            $query->whereJsonContains('tags', $tags);
        }

        // Sorting
        $sortableColumns = [
            'id' => 'id',
            'title' => 'title',
            'difficulty' => 'difficulty',
            'status' => 'status',
            'user' => 'user_id',
        ];

        $column = Arr::get($sortableColumns, $sortBy, 'title');
        $direction = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'asc';
        $query->orderBy($column, $direction);

        $challenges = $query->paginate($perPage);

        return response()->json([
            'data' => $challenges->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $challenges->currentPage(),
                    'total_pages' => $challenges->lastPage(),
                    'total' => $challenges->total(),
                    'per_page' => $challenges->perPage(),
                ],
            ],
        ]);
    }

    /**
     * Display a paginated listing of the challenge problems for users with dynamic search, filters, and sorting.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function userChallenges(Request $request)
    {
        $perPage = $request->query('rows', 10);
        $search = $request->query('search', '');
        $difficulty = $request->query('difficulty', []);
        $tags = $request->query('tags', []);
        $sortBy = $request->query('sort_by', 'title');
        $sortDirection = $request->query('sort_direction', 'asc');

        $query = ChallengeProblem::with('testCases')->where('status', 'active');

        if ($search) {
            $query->where('title', 'like', "%{$search}%");
        }

        if (!empty($difficulty)) {
            $difficulty = is_array($difficulty) ? $difficulty : [$difficulty];
            $query->whereIn('difficulty', $difficulty);
        }

        if (!empty($tags)) {
            $tags = is_array($tags) ? $tags : [$tags];
            $query->whereJsonContains('tags', $tags);
        }

        // Sorting
        $sortableColumns = [
            'title' => 'title',
            'difficulty' => 'difficulty',
            'tags' => 'tags',
        ];

        $column = Arr::get($sortableColumns, $sortBy, 'title');
        $direction = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'asc';

        if ($column === 'tags') {
            $query->orderByRaw("CAST(tags AS CHAR) $direction");
        } else {
            $query->orderBy($column, $direction);
        }

        $challenges = $query->paginate($perPage);

        return response()->json([
            'data' => $challenges->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $challenges->currentPage(),
                    'total_pages' => $challenges->lastPage(),
                    'total' => $challenges->total(),
                    'per_page' => $challenges->perPage(),
                ],
            ],
        ]);
    }

    /**
     * Show a single challenge problem.
     *
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            $challenge = ChallengeProblem::with(['user.profile', 'testCases'])->findOrFail($id);
            return response()->json(['data' => $challenge]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch challenge', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Challenge not found'], 404);
        }
    }

    /**
     * Create a new challenge problem.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Parse JSON-stringified fields if present
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

            Log::info('Creating challenge problem', [
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'difficulty' => $validated['difficulty'],
            ]);

            $challenge = ChallengeProblem::create([
                'user_id' => $request->user()->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'difficulty' => $validated['difficulty'],
                'constraints' => $validated['constraints'],
                'tags' => $validated['tags'] ?? [],
                'status' => $validated['status'] ?? 'active',
            ]);

            foreach ($validated['test_cases'] as $testCaseData) {
                $challenge->testCases()->create([
                    'input' => $testCaseData['input'],
                    'expected_output' => $testCaseData['expected_output'],
                    'is_sample' => $testCaseData['is_sample'] ?? false,
                ]);
            }

            return response()->json([
                'message' => 'Challenge problem created successfully',
                'data' => $challenge->load('testCases'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed for creating challenge', ['errors' => $e->errors()]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to create challenge', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to create challenge'], 500);
        }
    }

    /**
     * Update an existing challenge problem.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, $id)
    {
        try {
            $challenge = ChallengeProblem::findOrFail($id);

            if ($challenge->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Parse JSON-stringified fields if present
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

            // Merge parsed values back into the request for validation
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

            $challenge->update([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'difficulty' => $validated['difficulty'],
                'constraints' => $validated['constraints'],
                'tags' => $validated['tags'] ?? $challenge->tags,
                'status' => $validated['status'],
            ]);

            // Update test cases
            $challenge->testCases()->delete();
            foreach ($validated['test_cases'] as $testCaseData) {
                $challenge->testCases()->create([
                    'input' => $testCaseData['input'],
                    'expected_output' => $testCaseData['expected_output'],
                    'is_sample' => $testCaseData['is_sample'] ?? false,
                ]);
            }

            return response()->json([
                'message' => 'Challenge problem updated successfully',
                'data' => $challenge->load('testCases'),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Challenge not found', ['id' => $id]);
            return response()->json(['message' => 'Challenge not found'], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed for updating challenge', [
                'id' => $id,
                'errors' => $e->errors(),
                'input' => $request->all(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Failed to update challenge', [
                'id' => $id,
                'error' => $e->getMessage(),
                'input' => $request->all(),
            ]);
            return response()->json(['message' => 'Failed to update challenge'], 500);
        }
    }

    /**
     * Delete a challenge problem.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, $id)
    {
        try {
            $challenge = ChallengeProblem::findOrFail($id);

            if ($challenge->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $challenge->delete();

            return response()->json(['message' => 'Challenge problem deleted successfully']);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Challenge not found', ['id' => $id]);
            return response()->json(['message' => 'Challenge not found'], 404);
        } catch (\Exception $e) {
            Log::error('Failed to delete challenge', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to delete challenge'], 500);
        }
    }

    /**
     * Get demographics of challenge problems.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function demographics()
    {
        try {
            return response()->json([
                'total_challenges' => ChallengeProblem::count(),
                'total_easy' => ChallengeProblem::where('difficulty', 'easy')->count(),
                'total_medium' => ChallengeProblem::where('difficulty', 'medium')->count(),
                'total_hard' => ChallengeProblem::where('difficulty', 'hard')->count(),
                'total_active' => ChallengeProblem::where('status', 'active')->count(),
                'total_inactive' => ChallengeProblem::where('status', 'archived')->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch demographics', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to fetch demographics'], 500);
        }
    }
}