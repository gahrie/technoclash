<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Level extends Model
{
    protected $fillable = [
        'level',
        'minimum_exp',
        'maximum_exp',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
