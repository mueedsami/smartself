<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GuestSession extends Model
{
    protected $fillable = ['tenant_id', 'table_id', 'guest_token', 'expires_at'];
    public $timestamps = false;

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function table() {
        return $this->belongsTo(Table::class);
    }
}
