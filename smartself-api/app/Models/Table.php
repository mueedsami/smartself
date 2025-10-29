<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    protected $fillable = [
        'tenant_id', 'location_id', 'table_name', 'qr_token', 'is_active'
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
