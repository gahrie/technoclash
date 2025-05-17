<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RankSeeder extends Seeder
{
    public function run(): void
    {
        $ranks = [
            ['rank_title' => 'Iron', 'minimum_rating' => 0, 'maximum_rating' => 999, 'rank_icon' => 'icons/iron.png', 'created_at' => now(), 'updated_at' => now()],
            ['rank_title' => 'Bronze', 'minimum_rating' => 1000, 'maximum_rating' => 1999, 'rank_icon' => 'icons/bronze.png', 'created_at' => now(), 'updated_at' => now()],
            ['rank_title' => 'Silver', 'minimum_rating' => 2000, 'maximum_rating' => 2999, 'rank_icon' => 'icons/silver.png', 'created_at' => now(), 'updated_at' => now()],
            ['rank_title' => 'Gold', 'minimum_rating' => 3000, 'maximum_rating' => 3999, 'rank_icon' => 'icons/gold.png', 'created_at' => now(), 'updated_at' => now()],
            ['rank_title' => 'Platinum', 'minimum_rating' => 4000, 'maximum_rating' => 4999, 'rank_icon' => 'icons/platinum.png', 'created_at' => now(), 'updated_at' => now()],
            ['rank_title' => 'Diamond', 'minimum_rating' => 5000, 'maximum_rating' => 999999, 'rank_icon' => 'icons/diamond.png', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('ranks')->insert($ranks);
    }
}