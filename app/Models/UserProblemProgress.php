<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProblemProgress extends Model
{
    protected $table = 'user_problem_progress';
    protected $fillable = ['user_id', 'problem_id', 'status', 'accepted_count'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function problem()
    {
        return $this->belongsTo(Problem::class);
    }
}