<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Data directory
$dataDir = __DIR__ . '/data';
$kbFile = $dataDir . '/kb.json';

// Create data directory if it doesn't exist
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Route handling
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

try {
    if (preg_match('/\/api\/kb\/save/', $path) && $method === 'POST') {
        handleSave();
    } elseif (preg_match('/\/api\/kb\/load/', $path) && $method === 'GET') {
        handleLoad();
    } elseif (preg_match('/\/api\/kb\/export/', $path) && $method === 'GET') {
        handleExport();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Not found']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

/**
 * Save knowledge base data
 */
function handleSave() {
    global $kbFile;
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    // Validate data structure
    if (!isset($data['articles']) || !isset($data['directories'])) {
        throw new Exception('Missing required fields: articles, directories');
    }
    
    // Write to file with pretty printing
    $result = file_put_contents(
        $kbFile,
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );
    
    if ($result === false) {
        throw new Exception('Failed to save knowledge base');
    }
    
    // Also create individual article files for backup
    $articlesDir = dirname($kbFile) . '/articles';
    if (!is_dir($articlesDir)) {
        mkdir($articlesDir, 0755, true);
    }
    
    foreach ($data['articles'] as $id => $article) {
        $filename = sanitizeFilename($article['title'] ?? $id);
        file_put_contents(
            $articlesDir . '/' . $id . '_' . $filename . '.json',
            json_encode($article, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Knowledge base saved successfully',
        'timestamp' => date('c')
    ]);
}

/**
 * Load knowledge base data
 */
function handleLoad() {
    global $kbFile;
    
    if (!file_exists($kbFile)) {
        // Return empty KB structure
        http_response_code(200);
        echo json_encode([
            'articles' => [],
            'directories' => []
        ]);
        return;
    }
    
    $data = json_decode(file_get_contents($kbFile), true);
    
    if (!$data) {
        throw new Exception('Failed to parse knowledge base');
    }
    
    http_response_code(200);
    echo json_encode($data);
}

/**
 * Export knowledge base as downloadable file
 */
function handleExport() {
    global $kbFile;
    
    if (!file_exists($kbFile)) {
        throw new Exception('Knowledge base not found');
    }
    
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="kb_export_' . date('Y-m-d_His') . '.json"');
    
    readfile($kbFile);
}

/**
 * Sanitize filename
 */
function sanitizeFilename($filename) {
    $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
    $filename = preg_replace('/_+/', '_', $filename);
    $filename = trim($filename, '_');
    return substr($filename, 0, 100) ?: 'article';
}
?>
