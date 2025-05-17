// database/migrations/2025_05_16_203400_add_host_and_status_to_rooms_table.php
<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddHostAndStatusToRoomsTable extends Migration
{
    public function up()
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->unsignedBigInteger('host')->nullable()->after('password');
            $table->foreign('host')->references('id')->on('users')->onDelete('set null');
            $table->enum('status', ['Waiting', 'Started', 'Finished'])->default('Waiting')->after('host');
        });
    }

    public function down()
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropForeign(['host']);
            $table->dropColumn(['host', 'status']);
        });
    }
}