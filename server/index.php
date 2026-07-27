<?php
// Simple index - serves static files or redirects to api.php
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// If it's an API request, route to api.php
if (strpos($requestUri, '/api/') !== false) {
    include 'api.php';
    exit;
}

// Otherwise return 404
header('HTTP/1.0 404 Not Found');
echo json_encode(['error' => 'Not found']);
?>