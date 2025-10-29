<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\GuestSession;
use Carbon\Carbon;

class CleanExpiredGuestSessions extends Command
{
    protected $signature = 'smartself:clean-guests';
    protected $description = 'Delete expired guest sessions (older than now)';

    public function handle()
    {
        $count = GuestSession::where('expires_at', '<', Carbon::now())->delete();
        $this->info("🧹 Deleted {$count} expired guest sessions.");
        return 0;
    }
}
