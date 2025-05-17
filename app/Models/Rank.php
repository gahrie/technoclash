<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rank extends Model
{
    protected $fillable = [
        'rank_title',
        'minimum_rating',
        'maximum_rating',
        'rank_icon',
    ];

    /**
     * Indicates if the model should be timestamped.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get users whose ratings fall within this rank's range.
     */
    public function userProfiles()
    {
        return $this->hasMany(UserProfile::class)
            ->where('rating', '>=', $this->minimum_rating)
            ->where('rating', '<=', $this->maximum_rating);
    }
}