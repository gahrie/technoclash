<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Level;
use Illuminate\Support\Facades\DB;

class LevelController extends Controller
{
    public function show($level)
    {
        $levelData = Level::where('level', $level)->first();

        if (!$levelData) {
            return response()->json(['message' => 'Level not found'], 404);
        }

        return response()->json([
            'level' => $levelData->level,
            'minimum_exp' => $levelData->minimum_exp,
            'maximum_exp' => $levelData->maximum_exp,
        ], 200);
    }
}