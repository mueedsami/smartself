<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class KdsAuthMiddleware
{
    public function handle($request, Closure $next)
    {
        $provided = $request->header('x-kds-key') ?? $request->header('x-cashier-key');

        if ($provided !== env('KDS_KEY', 'smartself2025chef') && $provided !== env('CASHIER_KEY', 'smartself2025cashier')) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }

}
