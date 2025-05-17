<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_competitive_stats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->integer('matches_played')->default(0);
            $table->integer('first_place_count')->default(0);
            $table->integer('second_place_count')->default(0);
            $table->integer('third_place_count')->default(0);
            $table->integer('fourth_place_count')->default(0);
            $table->integer('fifth_place_count')->default(0);
            $table->float('top_three_rate')->default(0);
            $table->float('avg_match_duration')->default(0);
            $table->integer('current_top_three_streak')->default(0);
            $table->integer('longest_top_three_streak')->default(0);
            $table->float('avg_submissions_per_match')->default(0);
            $table->integer('recent_rating_change')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_competitive_stats');
    }
};