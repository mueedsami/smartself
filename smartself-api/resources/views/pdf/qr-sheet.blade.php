<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $tenant->name }} - QR Sheet</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; text-align: center; }
        h1 { font-size: 20px; margin-bottom: 10px; }
        .grid { display: flex; flex-wrap: wrap; justify-content: center; }
        .card {
            width: 45%; margin: 10px; border: 1px solid #ccc;
            padding: 10px; border-radius: 8px; text-align: center;
        }
        .qr svg { width: 180px; height: 180px; margin: 10px auto; }
        .footer { margin-top: 5px; font-size: 12px; color: #555; }
    </style>
</head>
<body>
    <h1>{{ $tenant->name }} — Table QR Codes</h1>
    <div class="grid">
        @foreach ($qrBlocks as $block)
            <div class="card">
                <h3>{{ $block['table_name'] }}</h3>
                <div class="qr">
                    <img src="{{ $block['svg'] }}" alt="QR Code" width="180" height="180">
                </div>
                <div class="footer">Scan to Order<br>{{ $block['url'] }}</div>
            </div>
        @endforeach
    </div>
</body>
</html>
