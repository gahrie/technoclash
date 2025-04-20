<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChallengeProblem;
use App\Models\TestCase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChallengeProblemController extends Controller
{

    // List all challenge problems (Read - Index)
    public function index(Request $request)
    {
        $perPage = $request->query('rows', 10);
        $search = $request->query('search', '');
        $difficulty = $request->query('difficulty', []);
        $status = $request->query('status', []);
        $tags = $request->query('tags', []); // Added tags filter

        $query = ChallengeProblem::with('user.profile');

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

    /**
     * Display a paginated listing of the challenge problems with dynamic search, filters, and sorting.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function userChallenges(Request $request)
    {
        $perPage = 10; // Fixed value
        $search = $request->query('search', '');
        $difficulty = $request->query('difficulty', []);
        $tags = $request->query('tags', []);
        $sortKey = $request->query('sort_key', 'title');
        $sortDirection = $request->query('sort_direction', 'asc');

        $query = ChallengeProblem::with('testCases');

        // Search by title
        if ($search) {
            $query->where('title', 'like', "%{$search}%");
        }

        // Filter by difficulty
        if (!empty($difficulty)) {
            $query->whereIn('difficulty', $difficulty);
        }

        // Filter by tags
        if (!empty($tags)) {
            $query->where(function ($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->whereJsonContains('tags', $tag);
                }
            });
        }

        // Sorting
        $sortableColumns = [
            'title' => 'title',
            'difficulty' => 'difficulty',
            'tags' => 'tags',
        ];

        $column = $sortableColumns[$sortKey] ?? 'title';
        $direction = in_array(strtolower($sortDirection), ['asc', 'desc']) ? $sortDirection : 'asc';

        if ($column === 'tags') {
            $query->orderByRaw("CAST(tags AS CHAR) $direction");
        } else {
            $query->orderBy($column, $direction);
        }

        // Fetch paginated results
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
    // Show a single challenge problem (Read - Show)
    public function show($id)
    {
        $challenge = ChallengeProblem::with(['user.profile', 'testCases'])->findOrFail($id);
        return response()->json(['data' => $challenge]);
    }

    // Create a new challenge problem (Create)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'difficulty' => ['required', 'in:easy,medium,hard'],
            'constraints' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'], // Validate each tag
            'test_cases' => ['required', 'array', 'min:1'],
            'test_cases.*.input' => ['required', 'string'],
            'test_cases.*.expected_output' => ['required', 'string'],
            'test_cases.*.is_sample' => ['boolean'],
        ]);

        Log::info('Creating challenge problem', [
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'difficulty' => $validated['difficulty'],
            'constraints' => $validated['constraints'],
            'tags' => $validated['tags'] ?? [],
        ]);
        $challenge = ChallengeProblem::create([
            'user_id' => $request->user()->id,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'difficulty' => $validated['difficulty'],
            'constraints' => $validated['constraints'],
            'tags' => $validated['tags'] ?? [],
            'status' => 'active',
        ]);

        // Create test cases
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
    }

    // Update an existing challenge problem (Update)
    public function update(Request $request, $id)
    {
        $challenge = ChallengeProblem::findOrFail($id);

        // Check if the user is authorized to update the challenge
        if ($challenge->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'difficulty' => ['required', 'in:easy,medium,hard'],
            'constraints' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'test_cases' => ['sometimes', 'array', 'min:1'],
            'test_cases.*.input' => ['required', 'string'],
            'test_cases.*.expected_output' => ['required', 'string'],
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

        // Update test cases if provided
        if ($request->has('test_cases')) {
            // Delete existing test cases and recreate
            $challenge->testCases()->delete();
            foreach ($validated['test_cases'] as $testCaseData) {
                $challenge->testCases()->create([
                    'input' => $testCaseData['input'],
                    'expected_output' => $testCaseData['expected_output'],
                    'is_sample' => $testCaseData['is_sample'] ?? false,
                ]);
            }
        }

        return response()->json([
            'message' => 'Challenge problem updated successfully',
            'data' => $challenge->load('testCases'),
        ]);
    }

    // Delete a challenge problem (Delete)
    public function destroy(Request $request, $id)
    {
        $challenge = ChallengeProblem::findOrFail($id);

        // Check if the user is authorized to delete the challenge
        if ($challenge->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $challenge->delete(); 

        return response()->json(['message' => 'Challenge problem deleted successfully']);
    }
}