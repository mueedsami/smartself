<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\GuestSession;
use Carbon\Carbon;

class GuestSessionMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $guestToken = $request->header('X-Guest-Token') ?? $request->input('guest_token');

        if (!$guestToken) {
            return response()->json(['error' => 'Guest token missing'], 401);
        }

        $guest = GuestSession::where('guest_token', $guestToken)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$guest) {
            return response()->json(['error' => 'Session expired or invalid'], 401);
        }

        // Attach guest info to request
        $request->merge([
            'guest_session' => $guest,
            'tenant_id' => $guest->tenant_id,
            'table_id' => $guest->table_id
        ]);

        return $next($request);
    }
}
