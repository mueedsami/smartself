<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MenuItem extends Model
{
    protected $fillable = [
        'tenant_id', 'category_id', 'item_name', 'description',
        'price', 'image_url', 'is_active'
    ];

    public $timestamps = false;

    public function category()
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }
}
