<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    protected $fillable = [
        'user_id',
        'challenge_problem_id',
        'language_id',
        'source_code',
        'status',
        'stdout',
        'stderr',
        'execution_time',
        'memory_used',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function challengeProblem()
    {
        return $this->belongsTo(ChallengeProblem::class);
    }
}
