<?php
// toggle_favourite.php
ob_start();
header('Content-Type: application/json');
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', 'php_errors.log');

require_once 'db_connect.php';
session_start();

function debug_log($message) {
    file_put_contents('debug.log', date('Y-m-d H:i:s') . ': ' . $message . "\n", FILE_APPEND);
}

if (!isset($_SESSION['username'])) {
    debug_log('Not logged in');
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$username = $_SESSION['username'];
$input = json_decode(file_get_contents('php://input'), true);
$songTitle = $input['songTitle'] ?? '';

debug_log("toggle_favourite - Received songTitle: '$songTitle', username: '$username'");

if (empty($songTitle)) {
    debug_log('Song title is empty');
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'Song title is required']);
    exit;
}

// Check if song exists in fyp_songs
$stmt = $conn->prepare("SELECT 1 FROM fyp_songs WHERE title = ?");
if (!$stmt) {
    debug_log('Prepare failed: ' . $conn->error);
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}
$stmt->bind_param("s", $songTitle);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    debug_log('Song not found in fyp_songs');
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'Song not found']);
    exit;
}
$stmt->close();

// Check if song is already favorited
$stmt = $conn->prepare("SELECT 1 FROM favourites WHERE username = ? AND song_title = ?");
if (!$stmt) {
    debug_log('Prepare failed: ' . $conn->error);
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}
$stmt->bind_param("ss", $username, $songTitle);
$stmt->execute();
$result = $stmt->get_result();
$isFavorited = $result->num_rows > 0;
$stmt->close();

if ($isFavorited) {
    // Remove from favourites
    $stmt = $conn->prepare("DELETE FROM favourites WHERE username = ? AND song_title = ?");
    if (!$stmt) {
        debug_log('Prepare failed: ' . $conn->error);
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Database error']);
        exit;
    }
    $stmt->bind_param("ss", $username, $songTitle);
    $success = $stmt->execute();
    $stmt->close();
    debug_log('Removed from favourites: ' . ($success ? 'success' : 'failed'));
} else {
    // Add to favourites
    $stmt = $conn->prepare("INSERT INTO favourites (username, song_title) VALUES (?, ?)");
    if (!$stmt) {
        debug_log('Prepare failed: ' . $conn->error);
        ob_end_clean();
        echo json_encode(['success' => false, 'error' => 'Database error']);
        exit;
    }
    $stmt->bind_param("ss", $username, $songTitle);
    $success = $stmt->execute();
    $stmt->close();
    debug_log('Added to favourites: ' . ($success ? 'success' : 'failed'));
}

$conn->close();
ob_end_clean();
echo json_encode(['success' => $success, 'isFavorited' => !$isFavorited]);
?>