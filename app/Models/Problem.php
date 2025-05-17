<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Problem extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'difficulty',
        'exp_reward',
        'constraints',
        'tags',
        'status',
    ];

    protected $casts = [
        'tags' => 'array', // Automatically cast JSON to/from array
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($challenge) {
            // Set points based on difficulty
            switch ($challenge->difficulty) {
                case 'Easy':
                    $challenge->exp_reward = 100;
                    break;
                case 'Medium':
                    $challenge->exp_reward = 300;
                    break;
                case 'Hard':
                    $challenge->exp_reward = 500;
                    break;
            }
        });

        static::updating(function ($challenge) {
            // Update points if difficulty changes
            if ($challenge->isDirty('difficulty')) {
                switch ($challenge->difficulty) {
                    case 'Easy':
                        $challenge->exp_reward = 100;
                        break;
                    case 'Medium':
                        $challenge->exp_reward = 300;
                        break;
                    case 'Hard':
                        $challenge->exp_reward = 500;
                        break;
                }
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function testCases()
    {
        return $this->hasMany(TestCase::class);
    }
}