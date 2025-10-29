<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuCategory extends Model
{
    protected $fillable = [
        'tenant_id', 'category_name', 'sort_order', 'is_active'
    ];

    public $timestamps = false;

    public function items()
    {
        return $this->hasMany(MenuItem::class, 'category_id');
    }
}
