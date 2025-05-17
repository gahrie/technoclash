<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('reward_type', ['Badge', 'Currency', 'Cosmetic', 'Title']);
            $table->enum('requirement_type', ['Level', 'Rank', 'Win Streak']);
            $table->string('requirement_value'); // e.g., "5" for level, "Bronze" for rank
            $table->text('description')->nullable();
            $table->integer('value')->nullable(); // e.g., 500 for currency amount
            $table->string('icon')->nullable(); // Path to reward icon
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
};