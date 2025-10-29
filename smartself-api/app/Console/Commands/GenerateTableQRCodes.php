<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Table;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Barryvdh\DomPDF\Facade\Pdf;

class GenerateTableQRCodes extends Command
{
    protected $signature = 'smartself:generate-qrcodes {tenant_slug?}';
    protected $description = 'Generate QR codes (PDF sheet) for each restaurant or specific tenant';

    public function handle()
    {
        $tenantSlug = $this->argument('tenant_slug');

        $tenants = $tenantSlug
            ? Tenant::where('slug', $tenantSlug)->get()
            : Tenant::all();

        if ($tenants->isEmpty()) {
            $this->error('❌ No tenant found.');
            return 1;
        }

        foreach ($tenants as $tenant) {
            $this->info("🏪 Generating QR sheet for {$tenant->name}...");

            $tables = Table::where('tenant_id', $tenant->id)->get();

            if ($tables->isEmpty()) {
                $this->warn("⚠️ No tables found for {$tenant->name}.");
                continue;
            }

            // Build an array of table QRs (as SVGs)
            $qrBlocks = [];
            foreach ($tables as $table) {
                if (!$table->qr_token) {
                    $table->qr_token = Str::upper(Str::random(12));
                    $table->save();
                }

                $url = config('app.frontend_url', 'https://smartself.app') . '?table=' . $table->qr_token;

                // Generate SVG QR (lightweight, print-perfect)
                $svg = QrCode::format('svg')
                    ->size(200)
                    ->margin(1)
                    ->generate($url);
                
                $svgBase64 = 'data:image/svg+xml;base64,' . base64_encode($svg);


                $qrBlocks[] = [
                    'table_name' => $table->table_name,
                    'url' => $url,
                    'svg' => $svgBase64,
                ];
            }

            // Prepare view HTML for DomPDF
            $html = view('pdf.qr-sheet', [
                'tenant' => $tenant,
                'qrBlocks' => $qrBlocks,
            ])->render();

            $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
            $filePath = public_path("qrcodes/{$tenant->slug}_qr-sheet.pdf");

            if (!file_exists(public_path('qrcodes'))) {
                mkdir(public_path('qrcodes'), 0755, true);
            }

            $pdf->save($filePath);

            $this->info("✅ PDF created: {$filePath}");
        }

        $this->info('🎉 All QR sheets generated successfully!');
        return 0;
    }
}
