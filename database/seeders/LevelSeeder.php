<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [];
        for ($level = 1; $level <= 50; $level++) {
            $minExp = $level == 1 ? 0 : 100 * pow($level - 1, 2);
            $maxExp = $level == 50 ? 999999 : (100 * pow($level, 2) - 1);
            $levels[] = [
                'level' => $level,
                'minimum_exp' => $minExp,
                'maximum_exp' => $maxExp,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('levels')->insert($levels);
    }
}