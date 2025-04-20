<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChallengeProblem extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'difficulty',
        'constraints',
        'tags',
        'status',
    ];

    protected $casts = [
        'tags' => 'array', // Automatically cast JSON to/from array
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function testCases()
    {
        return $this->hasMany(TestCase::class, 'challenge_problem_id');
    }
}