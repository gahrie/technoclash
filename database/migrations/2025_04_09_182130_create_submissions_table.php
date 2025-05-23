<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('challenge_problem_id')->constrained()->onDelete('cascade');
            $table->integer('language_id');
            $table->text('source_code');
            $table->string('status');
            $table->text('stdout')->nullable();
            $table->text('stderr')->nullable();
            $table->float('execution_time')->nullable();
            $table->integer('memory_used')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
