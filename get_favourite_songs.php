<?php
// get_favourite_songs.php
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
debug_log("get_favourite_songs - Fetching favorites for username: '$username'");

// Fetch favorite songs by joining with fyp_songs
$stmt = $conn->prepare("
    SELECT fs.title, fs.artist, fs.song_path, fs.thumbnail_path
    FROM favourites f
    JOIN fyp_songs fs ON f.song_title = fs.title
    WHERE f.username = ?
");
if (!$stmt) {
    debug_log('Prepare failed: ' . $conn->error);
    ob_end_clean();
    echo json_encode(['success' => false, 'error' => 'Database error']);
    exit;
}
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

$songs = [];
while ($row = $result->fetch_assoc()) {
    $songs[] = [
        'title' => $row['title'],
        'artist' => $row['artist'],
        'song_path' => $row['song_path'],
        'thumbnail_path' => $row['thumbnail_path']
    ];
}
$stmt->close();

debug_log('Fetched ' . count($songs) . ' favorite songs');

$conn->close();
ob_end_clean();
echo json_encode(['success' => true, 'songs' => $songs]);
?>