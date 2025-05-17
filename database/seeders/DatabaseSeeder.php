<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        $admin = User::create([
            'email' => 'admin@example.com',
            'password' => Hash::make('admin123'), // Secure password hashing
            'role' => 'Admin',
            'email_verified_at' => now(),
        ]);

        // Create Admin Profile
        UserProfile::create([
            'user_id' => $admin->id,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'username' => 'admin',
            'gender' => 'Male',
            'bio' => 'Administrator',
        ]);

        $this->call([
            RankSeeder::class,
            LevelSeeder::class,
        ]);
    }
}