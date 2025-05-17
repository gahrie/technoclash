<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MatchParticipant extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'room_id',
        'user_id',
        'placement',
        'exp_earned',
        'rating_change',
        'submission_count',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'placement' => 'integer',
        'exp_earned' => 'integer',
        'rating_change' => 'integer',
        'submission_count' => 'integer',
    ];

    /**
     * Get the room that the participant belongs to.
     */
    public function room()
    {
        return $this->belongsTo(Room::class, 'room_id');
    }

    /**
     * Get the user who is the participant.
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
