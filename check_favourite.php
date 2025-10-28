<?php
// check_favourite.php
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

debug_log("check_favourite - Received songTitle: '$songTitle', username: '$username'");

if (empty($songTitle)) {
    debug_log('Song title is empty');
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'Song title is required']);
    exit;
}

// Check if song is in favourites
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

debug_log('Song ' . ($isFavorited ? 'is' : 'is not') . ' favorited');

$conn->close();
ob_end_clean();
echo json_encode(['success' => true, 'isFavorited' => $isFavorited]);
?>