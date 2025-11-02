<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class KdsAuthMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $provided = $request->header('x-kds-key');
        $expected = config('services.kds.secret');

        if (!$expected || $provided !== $expected) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
