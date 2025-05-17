<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_problem_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('problem_id')->constrained('problems')->onDelete('cascade');
            $table->enum('status', ['Solved', 'Attempted', 'Not Attempted'])->default('Not Attempted');
            $table->unsignedInteger('submission_count')->default(0);
            $table->unsignedInteger('attempt_count')->default(0);
            $table->float('success_rate')->default(0);
            $table->timestamp('first_success_at')->nullable();
            $table->timestamp('last_attempted_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'problem_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_problem_progress');
    }
};