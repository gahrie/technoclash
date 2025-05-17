<?php
namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Room;
use App\Models\Rank;
use App\Models\UserProfile;
use App\Models\MatchParticipant;
use App\Models\Problem;
use App\Models\RoomProblem;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Pusher\Pusher;
use Carbon\Carbon;

class CompetitiveController extends Controller
{
    protected $pusher;

    public function __construct()
    {
        $this->pusher = new Pusher(
            env('PUSHER_APP_KEY'),
            env('PUSHER_APP_SECRET'),
            env('PUSHER_APP_ID'),
            [
                'cluster' => env('PUSHER_APP_CLUSTER'),
                'useTLS' => true,
            ]
        );
    }

    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $minRating = $request->input('min_rating');
        $maxRating = $request->input('max_rating');
        $isPublic = $request->input('is_public', []);
        $sortBy = $request->input('sort_by', 'id');
        $sortDirection = $request->input('sort_direction', 'asc');
        $rows = $request->input('rows', 10);
        $page = $request->input('page', 1);

        $query = Room::with(['hostUser.profile'])->select('rooms.*');

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', '%' . $search . '%')
                  ->orWhere('room_name', 'like', '%' . $search . '%');
            });
        }

        if (!is_null($minRating) && is_numeric($minRating)) {
            $query->where('minimum_rating', '>=', (int)$minRating);
        }

        if (!is_null($maxRating) && is_numeric($maxRating)) {
            $query->where('maximum_rating', '<=', (int)$maxRating);
        }

        if (!empty($isPublic) && is_array($isPublic)) {
            $query->whereIn('is_public', $isPublic);
        }

        if (in_array($sortBy, ['id', 'room_name', 'room_duration', 'minimum_rating', 'is_public', 'status'])) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderBy('id', 'asc');
        }

        Log::info('Room filter parameters:', [
            'search' => $search,
            'min_rating' => $minRating,
            'max_rating' => $maxRating,
            'is_public' => $isPublic,
            'sort_by' => $sortBy,
            'sort_direction' => $sortDirection,
            'rows' => $rows,
            'page' => $page,
        ]);

        $rooms = $query->paginate($rows, ['*'], 'page', $page);

        $rooms->getCollection()->transform(function ($room) {
            $score = MatchParticipant::where('room_id', $room->id)->where('user_id', Auth::user()->id)->whereNotNull('finished_at')
                ->first();

            $room->host_username = $room->hostUser && $room->hostUser->profile
                ? $room->hostUser->profile->username ?? 'Unknown'
                : ($room->host ? 'Unknown' : 'No Host');
            $room->score = $score ? $score->total_score : 0;
            unset($room->hostUser);
            return $room;
        });

        Log::debug('Rooms API response:', [
            'rooms' => $rooms->items(),
        ]);

        return response()->json([
            'data' => $rooms->items(),
            'meta' => [
                'pagination' => [
                    'current_page' => $rooms->currentPage(),
                    'per_page' => $rooms->perPage(),
                    'total' => $rooms->total(),
                    'total_pages' => $rooms->lastPage(),
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to create room');
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'room_name' => 'required|string|max:255',
            'room_duration' => 'required|integer|min:10|max:120',
            'minimum_rating' => 'required|integer|min:0',
            'maximum_rating' => 'required|integer|gt:minimum_rating',
            'is_public' => 'required|boolean',
            'password' => 'nullable|string|required_if:is_public,false|min:1',
        ]);

        $room = Room::create([
            'room_name' => $validated['room_name'],
            'room_duration' => $validated['room_duration'],
            'minimum_rating' => $validated['minimum_rating'],
            'maximum_rating' => $validated['maximum_rating'],
            'is_public' => $validated['is_public'],
            'password' => $validated['is_public'] ? null : $validated['password'],
            'host' => $user->id,
            'status' => 'Waiting',
        ]);

        MatchParticipant::create([
            'room_id' => $room->id,
            'user_id' => $user->id,
            'placement' => 0,
            'exp_earned' => 0,
            'rating_change' => 0,
            'submission_count' => 0,
        ]);

        $this->pusher->trigger('competitive-rooms', 'room-created', [
            'id' => $room->id,
            'room_name' => $room->room_name,
            'room_duration' => $room->room_duration,
            'minimum_rating' => $room->minimum_rating,
            'maximum_rating' => $room->maximum_rating,
            'is_public' => $room->is_public,
            'host' => $room->host,
            'host_username' => $user->profile ? $user->profile->username ?? 'Unknown' : 'Unknown',
            'status' => $room->status,
        ]);

        Log::info('Room created:', ['room_id' => $room->id, 'user_id' => $user->id]);

        return response()->json([
            'message' => 'Room created successfully',
            'room' => $room,
        ], 201);
    }

    public function join(Request $request, $roomId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to join room', ['room_id' => $roomId]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $room = Room::findOrFail($roomId);
        $userProfile = UserProfile::where('user_id', $user->id)->first();

        if ($room->status !== 'Waiting') {
            return response()->json(['message' => 'Room is not accepting new participants'], 403);
        }

        if ($userProfile->rating < $room->minimum_rating || $userProfile->rating > $room->maximum_rating) {
            return response()->json(['message' => 'Your rating is outside the room\'s rating range'], 403);
        }

        $existingParticipant = MatchParticipant::where('room_id', $room->id)
            ->where('user_id', $user->id)
            ->exists();
        if ($existingParticipant) {
            return response()->json(['message' => 'You have already joined this room'], 400);
        }

        if (!$room->is_public) {
            $request->validate(['password' => 'required|string']);
            if (!Hash::check($request->password, $room->password)) {
                return response()->json(['message' => 'Incorrect password'], 401);
            }
        }

        $participant = MatchParticipant::create([
            'room_id' => $room->id,
            'user_id' => $user->id,
            'placement' => 0,
            'exp_earned' => 0,
            'rating_change' => 0,
            'submission_count' => 0,
        ]);

        if (is_null($room->host)) {
            $room->host = $user->id;
            $room->save();
            $this->pusher->trigger('competitive-rooms', 'room-updated', [
                'id' => $room->id,
                'host' => $room->host,
                'host_username' => $userProfile ? $userProfile->username ?? 'Unknown' : 'Unknown',
            ]);
            Log::info('Assigned new host:', ['room_id' => $roomId, 'host_id' => $user->id]);
        }

        $this->pusher->trigger("room-{$roomId}", 'user-joined', [
            'user_id' => $user->id,
            'username' => $userProfile ? $userProfile->username ?? 'Unknown' : 'Unknown',
            'rating' => $userProfile->rating,
        ]);

        Log::info('User joined room:', ['room_id' => $room->id, 'user_id' => $user->id]);

        return response()->json(['message' => 'Joined room successfully']);
    }

    public function getRoom($roomId)
    {
        $room = Room::with(['hostUser.profile', 'participants.user.profile'])->findOrFail($roomId);

        $participants = $room->participants->map(function ($participant) {
            return [
                'user_id' => $participant->user_id,
                'username' => $participant->user->profile ? $participant->user->profile->username ?? 'Unknown' : 'Unknown',
                'rating' => $participant->user->profile->rating,
            ];
        });

        $response = [
            'room' => [
                'id' => $room->id,
                'room_name' => $room->room_name,
                'room_duration' => $room->room_duration,
                'minimum_rating' => $room->minimum_rating,
                'maximum_rating' => $room->maximum_rating,
                'is_public' => $room->is_public,
                'host' => $room->host,
                'host_username' => $room->hostUser && $room->hostUser->profile
                    ? $room->hostUser->profile->username ?? 'Unknown'
                    : ($room->host ? 'Unknown' : 'No Host'),
                'status' => $room->status,
            ],
            'participants' => $participants,
        ];

        Log::debug('Room API response:', [
            'room_id' => $roomId,
            'host_username' => $response['room']['host_username'],
        ]);

        return response()->json($response);
    }

    public function passHost(Request $request, $roomId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to pass host', ['room_id' => $roomId]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate(['new_host_id' => 'required|integer|exists:users,id']);

        $room = Room::findOrFail($roomId);

        if ($room->host !== $user->id) {
            return response()->json(['message' => 'Only the host can pass hosting'], 403);
        }

        $participant = MatchParticipant::where('room_id', $roomId)
            ->where('user_id', $request->new_host_id)
            ->first();
        if (!$participant) {
            return response()->json(['message' => 'New host must be a participant'], 400);
        }

        $room->host = $request->new_host_id;
        $room->save();

        $newHostProfile = UserProfile::where('user_id', $room->host)->first();
        $this->pusher->trigger('competitive-rooms', 'room-updated', [
            'id' => $room->id,
            'host' => $room->host,
            'host_username' => $newHostProfile ? $newHostProfile->username ?? 'Unknown' : 'Unknown',
        ]);

        Log::info('Host passed:', ['room_id' => $room->id, 'new_host_id' => $request->new_host_id]);

        return response()->json(['message' => 'Host passed successfully']);
    }

    public function startMatch($roomId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to start match', ['room_id' => $roomId]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $room = Room::findOrFail($roomId);

        if ($room->host !== $user->id) {
            return response()->json(['message' => 'Only the host can start the match'], 403);
        }

        if ($room->status !== 'Waiting') {
            return response()->json(['message' => 'Match cannot be started'], 400);
        }

        // Fetch 2 easy, 2 medium, 2 hard problems
        $easyProblems = Problem::where('difficulty', 'Easy')->inRandomOrder()->take(2)->get();
        $mediumProblems = Problem::where('difficulty', 'Medium')->inRandomOrder()->take(2)->get();
        $hardProblems = Problem::where('difficulty', 'Hard')->inRandomOrder()->take(2)->get();

        if ($easyProblems->count() < 2 || $mediumProblems->count() < 2 || $hardProblems->count() < 2) {
            return response()->json(['message' => 'Not enough problems available'], 400);
        }

        $problems = $easyProblems->merge($mediumProblems)->merge($hardProblems);

        // Store problems in room_problems
        foreach ($problems as $problem) {
            RoomProblem::create([
                'room_id' => $room->id,
                'problem_id' => $problem->id,
                'difficulty' => $problem->difficulty,
            ]);
        }

        $room->status = 'Started';
        $room->started_at = Carbon::now();
        $room->save();

        $this->pusher->trigger("room-{$roomId}", 'match-started', [
            'room_id' => $room->id,
            'problems' => $problems->map(function ($problem) {
                return [
                    'id' => $problem->id,
                    'title' => $problem->title,
                    'difficulty' => $problem->difficulty,
                    'description' => $problem->description,
                    'constraints' => $problem->constraints,
                    'test_cases' => $problem->test_cases,
                    'templates' => $problem->templates,
                ];
            })->toArray(),
            'started_at' => $room->started_at,
            'duration' => $room->room_duration,
        ]);

        $this->pusher->trigger('competitive-rooms', 'room-updated', [
            'id' => $room->id,
            'status' => $room->status,
        ]);

        Log::info('Match started:', ['room_id' => $room->id, 'problem_ids' => $problems->pluck('id')->toArray()]);

        return response()->json(['message' => 'Match started successfully']);
    }

    public function finishMatch($roomId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to finish match', ['room_id' => $roomId]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $room = Room::findOrFail($roomId);
        if ($room->status !== 'Started') {
            return response()->json(['message' => 'Match is not active'], 400);
        }

        // Check if match has timed out
        $isTimedOut = $room->started_at && Carbon::now()->greaterThanOrEqualTo(
            Carbon::parse($room->started_at)->addMinutes($room->room_duration)
        );

        // Calculate user's score
        $submissions = Submission::where('room_id', $roomId)
            ->where('user_id', $user->id)
            ->get();

        $totalScore = $submissions->sum(function ($submission) {
            return $submission->test_case_results
                ? array_sum(array_map(fn($result) => $result === 'Accepted' ? 2 : 0, $submission->test_case_results))
                : 0;
        });

        // Update user profile with earned EXP
        $userProfile = UserProfile::where('user_id', $user->id)->first();
        $expEarned = $totalScore * 100;
        if ($userProfile) {
            $userProfile->exp += $expEarned;
            $userProfile->save();
        }

        // Update current participant
        $participant = MatchParticipant::where('room_id', $roomId)
            ->where('user_id', $user->id)
            ->first();
        if ($participant) {
            $participant->exp_earned = $expEarned;
            $participant->submission_count = $submissions->count();
            $participant->total_score = $totalScore;
            $participant->finished_at = Carbon::now();
            $participant->save();
        }

        // If timed out, finish all remaining participants
        if ($isTimedOut) {
            $remainingParticipants = MatchParticipant::where('room_id', $roomId)
                ->whereNull('finished_at')
                ->get();

            foreach ($remainingParticipants as $remainingParticipant) {
                $remainingSubmissions = Submission::where('room_id', $roomId)
                    ->where('user_id', $remainingParticipant->user_id)
                    ->get();

                $remainingTotalScore = $remainingSubmissions->sum(function ($submission) {
                    return $submission->test_case_results
                        ? array_sum(array_map(fn($result) => $result === 'Accepted' ? 2 : 0, $submission->test_case_results))
                        : 0;
                });

                $remainingExpEarned = $remainingTotalScore * 100;

                $remainingUserProfile = UserProfile::where('user_id', $remainingParticipant->user_id)->first();
                if ($remainingUserProfile) {
                    $remainingUserProfile->exp += $remainingExpEarned;
                    $remainingUserProfile->save();
                }

                $remainingParticipant->exp_earned = $remainingExpEarned;
                $remainingParticipant->submission_count = $remainingSubmissions->count();
                $remainingParticipant->total_score = $remainingTotalScore;
                $remainingParticipant->finished_at = Carbon::now();
                $remainingParticipant->save();

                $this->pusher->trigger("room-{$roomId}", 'match-finished', [
                    'room_id' => $room->id,
                    'user_id' => $remainingParticipant->user_id,
                    'total_score' => $remainingTotalScore,
                    'placement' => $remainingParticipant->placement,
                ]);

                Log::info('Participant auto-finished due to timeout:', [
                    'room_id' => $roomId,
                    'user_id' => $remainingParticipant->user_id,
                    'total_score' => $remainingTotalScore,
                    'exp_earned' => $remainingExpEarned,
                ]);
            }

            $room->status = 'Finished';
            $room->save();

            $this->pusher->trigger("room-{$roomId}", 'match-ended', [
                'room_id' => $room->id,
                'status' => $room->status,
            ]);
        }

        // Update placements for all finished participants
        $this->updatePlacements($roomId);

        // Refresh participant data for response
        $participant = MatchParticipant::where('room_id', $roomId)
            ->where('user_id', $user->id)
            ->first();

        $this->pusher->trigger("room-{$roomId}", 'match-finished', [
            'room_id' => $room->id,
            'user_id' => $user->id,
            'total_score' => $totalScore,
            'placement' => $participant->placement,
        ]);

        Log::info('Match finished:', [
            'room_id' => $roomId,
            'user_id' => $user->id,
            'total_score' => $totalScore,
            'exp_earned' => $expEarned,
            'placement' => $participant->placement,
        ]);

        return response()->json([
            'message' => 'Match finished successfully',
            'total_score' => $totalScore,
            'exp_earned' => $expEarned,
            'placement' => $participant->placement,
        ]);
    }

    public function timeoutMatch($roomId)
    {
        $room = Room::findOrFail($roomId);
        if ($room->status !== 'Started') {
            Log::info('Match not active for timeout:', ['room_id' => $roomId]);
            return response()->json(['message' => 'Match is not active'], 400);
        }

        $endTime = Carbon::parse($room->started_at)->addMinutes($room->room_duration);
        if (Carbon::now()->lessThan($endTime)) {
            Log::info('Match not yet timed out:', ['room_id' => $roomId]);
            return response()->json(['message' => 'Match has not yet timed out'], 400);
        }

        $participants = MatchParticipant::where('room_id', $roomId)
            ->whereNull('finished_at')
            ->get();

        foreach ($participants as $participant) {
            $submissions = Submission::where('room_id', $roomId)
                ->where('user_id', $participant->user_id)
                ->get();

            $totalScore = $submissions->sum(function ($submission) {
                return $submission->test_case_results
                    ? array_sum(array_map(fn($result) => $result === 'Accepted' ? 2 : 0, $submission->test_case_results))
                    : 0;
            });

            $expEarned = $totalScore * 100;

            $userProfile = UserProfile::where('user_id', $participant->user_id)->first();
            if ($userProfile) {
                $userProfile->exp += $expEarned;
                $userProfile->save();
            }

            $participant->exp_earned = $expEarned;
            $participant->submission_count = $submissions->count();
            $participant->total_score = $totalScore;
            $participant->finished_at = Carbon::now();
            $participant->save();

            $this->pusher->trigger("room-{$roomId}", 'match-finished', [
                'room_id' => $room->id,
                'user_id' => $participant->user_id,
                'total_score' => $totalScore,
                'placement' => $participant->placement,
            ]);

            Log::info('Participant auto-finished due to timeout:', [
                'room_id' => $roomId,
                'user_id' => $participant->user_id,
                'total_score' => $totalScore,
                'exp_earned' => $expEarned,
            ]);
        }

        $this->updatePlacements($roomId);

        $room->status = 'Finished';
        $room->save();

        $this->pusher->trigger("room-{$roomId}", 'match-ended', [
            'room_id' => $room->id,
            'status' => $room->status,
        ]);

        Log::info('Match timed out and finished:', ['room_id' => $roomId]);

        return response()->json(['message' => 'Match timed out and finished']);
    }

    protected function updatePlacements($roomId)
    {
        $participants = MatchParticipant::where('room_id', $roomId)
            ->whereNotNull('finished_at')
            ->orderBy('total_score', 'desc')
            ->orderBy('finished_at', 'asc')
            ->get();

        $currentPlacement = 0;
        $previousScore = null;
        $sameScoreCount = 0;

        foreach ($participants as $index => $participant) {
            if ($index === 0 || $participant->total_score !== $previousScore) {
                $currentPlacement = $index + 1;
                $sameScoreCount = 1;
            } else {
                $sameScoreCount++;
            }

            $participant->placement = $currentPlacement;
            $participant->save();

            $previousScore = $participant->total_score;
        }
    }

    public function leaveRoom($roomId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to leave room', ['room_id' => $roomId]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $room = Room::findOrFail($roomId);

        $participant = MatchParticipant::where('room_id', $roomId)
            ->where('user_id', $user->id)
            ->first();

        if (!$participant) {
            return response()->json(['message' => 'You are not a participant in this room'], 400);
        }

        if ($room->host === $user->id && $room->status === 'Waiting') {
            $otherParticipants = MatchParticipant::where('room_id', $roomId)
                ->where('user_id', '!=', $user->id)
                ->get();

            if ($otherParticipants->count() > 0) {
                $room->host = $otherParticipants->first()->user_id;
                $room->save();
                $newHostProfile = UserProfile::where('user_id', $room->host)->first();
                $this->pusher->trigger('competitive-rooms', 'room-updated', [
                    'id' => $room->id,
                    'host' => $room->host,
                    'host_username' => $newHostProfile ? $newHostProfile->username ?? 'Unknown' : 'Unknown',
                ]);
                Log::info('Host reassigned:', ['room_id' => $roomId, 'new_host_id' => $room->host]);
            } else {
                $room->host = null;
                $room->save();
                $this->pusher->trigger('competitive-rooms', 'room-updated', [
                    'id' => $room->id,
                    'host' => null,
                    'host_username' => 'No Host',
                ]);
                Log::info('Host left, room kept alive without host:', ['room_id' => $roomId]);
            }
        }

        $participant->delete();

        $userProfile = UserProfile::where('user_id', $user->id)->first();
        $this->pusher->trigger("room-{$roomId}", 'user-left', [
            'user_id' => $user->id,
            'username' => $userProfile ? $userProfile->username ?? 'Unknown' : 'Unknown',
            'rating' => $userProfile ? $userProfile->rating : 0,
        ]);

        Log::info('User left room:', ['room_id' => $roomId, 'user_id' => $user->id]);

        return response()->json(['message' => 'Left room successfully']);
    }

    public function getRank(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to get rank');
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userProfile = UserProfile::where('user_id', $user->id)->first();

        Log::debug('UserProfile data:', [
            'user_id' => $user->id,
            'rating' => $userProfile->rating,
        ]);

        $rank = Rank::where('minimum_rating', '<=', $userProfile->rating)
            ->where('maximum_rating', '>=', $userProfile->rating)
            ->first();
        Log::debug('Rank data:', [
            'rank_exists' => !is_null($rank),
            'rank_title' => $rank ? $rank->rank_title : 'Unranked',
            'minimum_rating' => $rank ? $rank->minimum_rating : 0,
            'maximum_rating' => $rank ? $rank->maximum_rating : 999999,
        ]);

        return response()->json([
            'rank_title' => $rank ? $rank->rank_title : 'Unranked',
            'rating' => $userProfile->rating,
            'minimum_rating' => $rank ? $rank->minimum_rating : 0,
            'maximum_rating' => $rank ? $rank->maximum_rating : 999999,
            'rank_icon' => $rank ? $rank->rank_icon : null,
        ]);
    }

    public function checkPendingRooms(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to check pending rooms');
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $pendingRoom = MatchParticipant::where('user_id', $user->id)
            ->whereHas('room', function ($query) {
                $query->where('status', 'Waiting');
            })
            ->with('room')
            ->first();

        if ($pendingRoom) {
            return response()->json(['room_id' => $pendingRoom->room_id]);
        }

        return response()->json([]);
    }

    public function getMatch($roomId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to get match', ['room_id' => $roomId]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $room = Room::with(['problems.problem.testCases'])->findOrFail($roomId);
        if ($room->status !== 'Started') {
            return response()->json(['message' => 'Match has not started'], 400);
        }

        $problems = $room->problems->map(function ($roomProblem) {
            $problem = $roomProblem->problem;
            return [
                'id' => $problem->id,
                'title' => $problem->title,
                'description' => $problem->description,
                'constraints' => $problem->constraints,
                'difficulty' => $problem->difficulty,
                'test_cases' => $problem->testCases->map(function ($testCase) {
                    return [
                        'id' => $testCase->id,
                        'input' => $testCase->input,
                        'expected_output' => $testCase->expected_output,
                    ];
                })->toArray(),
                'templates' => $problem->templates,
            ];
        });

        $submissions = Submission::where('room_id', $roomId)
            ->where('user_id', $user->id)
            ->get()
            ->map(function ($submission) {
                return [
                    'problem_id' => $submission->problem_id,
                    'language_id' => $submission->language_id,
                    'source_code' => $submission->source_code,
                    'test_case_results' => $submission->test_case_results,
                    'score' => $submission->test_case_results
                        ? array_sum(array_map(fn($result) => $result === 'Accepted' ? 2 : 0, $submission->test_case_results))
                        : 0,
                ];
            });

        return response()->json([
            'room' => [
                'id' => $room->id,
                'room_name' => $room->room_name,
                'status' => $room->status,
                'duration' => $room->room_duration,
            ],
            'problems' => $problems,
            'submissions' => $submissions,
        ]);
    }

    public function submitMatchSolution(Request $request, $roomId)
    {
        $user = Auth::user();
        if (!$user) {
            Log::error('Unauthenticated attempt to submit solution', ['room_id' => $roomId]);
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $room = Room::findOrFail($roomId);
        if ($room->status !== 'Started') {
            return response()->json(['message' => 'Match is not active'], 400);
        }

        $validated = $request->validate([
            'problem_id' => 'required|integer|exists:problems,id',
            'language_id' => 'required|integer',
            'source_code' => 'required|string',
            'test_case_results' => 'required|array',
        ]);

        $submission = Submission::create([
            'user_id' => $user->id,
            'room_id' => $roomId,
            'problem_id' => $validated['problem_id'],
            'language_id' => $validated['language_id'],
            'source_code' => $validated['source_code'],
            'test_case_results' => $validated['test_case_results'],
            'status' => array_sum(array_map(fn($result) => $result === 'Accepted' ? 1 : 0, $validated['test_case_results'])) === count($validated['test_case_results']) ? 'Accepted' : 'Rejected',
        ]);

        $score = array_sum(array_map(fn($result) => $result === 'Accepted' ? 2 : 0, $validated['test_case_results']));

        $this->pusher->trigger("room-{$roomId}", 'submission-updated', [
            'user_id' => $user->id,
            'username' => $user->profile ? $user->profile->username ?? 'Unknown' : 'Unknown',
            'problem_id' => $submission->problem_id,
            'score' => $score,
        ]);

        Log::info('Solution submitted:', [
            'room_id' => $roomId,
            'user_id' => $user->id,
            'problem_id' => $submission->problem_id,
            'score' => $score,
        ]);

        return response()->json([
            'message' => 'Solution submitted successfully',
            'submission' => [
                'problem_id' => $submission->problem_id,
                'language_id' => $submission->language_id,
                'source_code' => $submission->source_code,
                'test_case_results' => $submission->test_case_results,
                'score' => $score,
            ],
        ]);
    }
}