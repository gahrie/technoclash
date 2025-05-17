<?php
use App\Http\Controllers\API\CompetitiveController;
use App\Models\Room;
use Carbon\Carbon;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::call(function () {
    $rooms = Room::where('status', 'Started')
        ->whereNotNull('started_at')
        ->get();

    $controller = new CompetitiveController();

    foreach ($rooms as $room) {
        $endTime = Carbon::parse($room->started_at)->addMinutes($room->room_duration);
        if (Carbon::now()->greaterThanOrEqualTo($endTime)) {
            $controller->timeoutMatch($room->id);
            \Illuminate\Support\Facades\Log::info("Timed out match: Room ID {$room->id}");
        }
    }
})->everyMinute()->description('Timeout expired competitive matches');