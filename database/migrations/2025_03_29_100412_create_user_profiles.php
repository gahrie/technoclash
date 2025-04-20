<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{   
    public function up()
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('username')->unique();
            $table->string('avatar')->nullable(); // URL to the user's avatar
            $table->string('bio')->nullable(); // Short biography or description
            $table->string('university')->nullable(); // University name
            $table->integer('points')->default(1000);
            $table->integer('win_streak')->default(0); // Track consecutive wins
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_profiles');
    }
};