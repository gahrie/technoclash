<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'username',
        'gender',
        'avatar',
        'bio',
        'university',
        'exp',
        'level',
        'rating',
        'win_streak',
    ];

    // Relationship with User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // // Relationship with Rank
    // public function rank()
    // {
    //     return $this->hasOne(Rank::class);
    // }

    // // Relationship with Badges (Many-to-Many)
    // public function badges()
    // {
    //     return $this->belongsToMany(Badge::class, 'user_profile_badges')
    //         ->withPivot('earned_at');
    // }

    // // Relationship with Rewards (Many-to-Many)
    // public function rewards()
    // {
    //     return $this->belongsToMany(Reward::class, 'user_profile_rewards')
    //         ->withPivot('earned_at');
    // }
}
