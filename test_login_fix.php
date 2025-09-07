<?php

echo "Testing FilHub Backend Login...\n\n";

$url = 'http://127.0.0.1:8000/api/auth/login';
$data = [
    'email' => 'admin@filhub.com',
    'password' => 'admin123'
];

echo "URL: $url\n";
echo "Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_VERBOSE, true);

echo "Sending request...\n";
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n\n";

if (curl_error($ch)) {
    echo "cURL Error: " . curl_error($ch) . "\n";
}

curl_close($ch);
