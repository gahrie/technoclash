<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TestCase extends Model
{
    protected $fillable = [
        'challenge_problem_id',
        'input',
        'expected_output',
        'is_sample',
    ];

    protected $casts = [
        'is_sample' => 'boolean', 
    ];

    public function problem()
    {
        return $this->belongsTo(ChallengeProblem::class, 'challenge_problem_id');
    }
}