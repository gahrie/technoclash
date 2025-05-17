<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'room_name',
        'room_duration',
        'minimum_rating',
        'maximum_rating',
        'is_public',
        'password',
        'host',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_public' => 'boolean',
        'minimum_rating' => 'integer',
        'maximum_rating' => 'integer',
        'room_duration' => 'integer',
    ];

    /**
     * Get the host user of the room.
     */
    public function hostUser()
    {
        return $this->belongsTo(User::class, 'host');
    }

    /**
     * Get the participants of the room.
     */
    public function participants()
    {
        return $this->hasMany(MatchParticipant::class, 'room_id');
    }

    /**
     * Get the problems associated with the room.
     */
    public function problems()
    {
        return $this->hasMany(RoomProblem::class, 'room_id')->with('problem');
    }
}