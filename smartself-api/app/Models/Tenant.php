<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = [
        'name', 'slug', 'address', 'contact_email', 'contact_phone', 'active'
    ];

    public function tables()
    {
        return $this->hasMany(Table::class);
    }
}
