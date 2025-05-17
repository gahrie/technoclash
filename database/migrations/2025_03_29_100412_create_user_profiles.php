<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('username')->unique()->nullable();
            $table->enum('gender', ['Male', 'Female', 'Other'])->default('Other');
            $table->string('avatar')->nullable();
            $table->string('bio')->nullable();
            $table->string('university')->nullable();
            $table->integer('exp')->default(0); // Experience points for leveling
            $table->integer('level')->default(1); // User level based on EXP
            $table->integer('rating')->default(1000); // Rating for Competitive mode
            $table->integer('win_streak')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};