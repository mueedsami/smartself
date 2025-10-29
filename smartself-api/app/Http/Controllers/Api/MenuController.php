<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MenuCategory;
use App\Models\MenuItem;

class MenuController extends Controller
{
    // Fetch all active menu categories and items for the tenant
    public function index(Request $request)
    {
        $tenantId = $request->tenant_id ?? $request->header('X-Tenant-ID');

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant ID missing'], 400);
        }

        $categories = MenuCategory::where('tenant_id', $tenantId)
            ->orderBy('sort_order', 'asc')
            ->get();

        $menuItems = MenuItem::where('tenant_id', $tenantId)
            // ->where('is_active', true)
            ->orderBy('category_id')
            ->get();

        return response()->json([
            'categories' => $categories,
            'items' => $menuItems,
        ]);
    }
}
