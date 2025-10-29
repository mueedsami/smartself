<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\Table;
use App\Models\GuestSession;
use Carbon\Carbon;

class GuestSessionController extends Controller
{
    /**
     * Start a new guest session based on table QR token
     */
    public function start(Request $request)
    {
        $request->validate([
            'tenant_slug' => 'required|string',
            'qr_token' => 'required|string'
        ]);

        // Get tenant
        $tenant = \App\Models\Tenant::where('slug', $request->tenant_slug)->firstOrFail();

        // Find table
        $table = Table::where('tenant_id', $tenant->id)
                      ->where('qr_token', $request->qr_token)
                      ->first();

        if (!$table) {
            return response()->json(['error' => 'Invalid QR token'], 404);
        }

        // Create guest session
        $guest = new GuestSession();
        $guest->tenant_id = $tenant->id;
        $guest->table_id = $table->id;
        $guest->guest_token = Str::uuid();
        $guest->expires_at = Carbon::now()->addHour();
        $guest->save();

        return response()->json([
            'success' => true,
            'guest_token' => $guest->guest_token,
            'table' => $table->table_name,
            'expires_at' => $guest->expires_at
        ]);
    }

    /**
     * Check if a guest session is still valid
     */
    public function check(Request $request)
    {
        $request->validate(['guest_token' => 'required|string']);

        $guest = GuestSession::where('guest_token', $request->guest_token)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$guest) {
            return response()->json(['valid' => false]);
        }

        return response()->json([
            'valid' => true,
            'tenant_id' => $guest->tenant_id,
            'table_id' => $guest->table_id,
            'expires_at' => $guest->expires_at
        ]);
    }
}
