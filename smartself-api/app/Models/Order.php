<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'table_id',
        'guest_session_id',
        'order_code',
        'status',
        'payment_status',
        'subtotal',
        'tax',
        'total',
        'notes',
        'pickup_token',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'tax' => 'float',
        'total' => 'float',
    ];


    protected static function booted()
    {
        static::creating(function ($order) {
            if (empty($order->order_code)) {
                $order->order_code = strtoupper(Str::random(10)); // auto-generate if missing
            }
        });
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function table()
    {
        return $this->belongsTo(Table::class);
    }

    public function guestSession()
    {
        return $this->belongsTo(GuestSession::class);
    }

    public function ensurePickupToken(): void
    {
        if ($this->pickup_token) return;

        do {
            $token = Str::upper(Str::random(6)); // e.g., “7FQG9K”
            $query = static::query()->where('pickup_token', $token);
            if (isset($this->tenant_id)) {
                $query->where('tenant_id', $this->tenant_id);
            }
        } while ($query->exists());

        $this->pickup_token = $token;
        $this->save();

        // (Optional) record in order_events
        if (class_exists(\App\Models\OrderEvent::class)) {
            \App\Models\OrderEvent::create([
                'order_id' => $this->id,
                'event' => 'pickup_token_generated',
                'meta'  => json_encode(['token' => $token]),
            ]);
        }
    }
}
