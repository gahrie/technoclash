<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'registration_progress' => $this->registration_progress,
            'verification_code' => $this->verification_code,
            'verification_code_expires_at' => $this->verification_code_expires_at,
            'profile' => [
                'first_name' => $this->profile->first_name ?? null,
                'last_name' => $this->profile->last_name ?? null,
                'username' => $this->profile->username ?? null,
                'gender' => $this->profile->gender ?? null,
                'avatar' => $this->profile->avatar ?? null,
                'bio' => $this->profile->bio ?? null,
                'university' => $this->profile->university ?? null,
                'points' => $this->profile->points ?? 1000,
                'win_streak' => $this->profile->win_streak ?? 0,
            //     'rank' => $this->profile->rank ? [
            //         'tier' => $this->profile->rank->tier,
            //         'division' => $this->profile->rank->division,
            //         'mmr' => $this->profile->rank->mmr,
            //     ] : null,
            //     'badges' => $this->profile->badges->pluck('name'),
            //     'rewards' => $this->profile->rewards->pluck('name'),
            ],
        ];
    }
}
