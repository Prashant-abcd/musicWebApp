<?php
header('Content-Type: application/json');
require_once 'db_connect.php';
session_start();

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$username = $_SESSION['username'];
$input = json_decode(file_get_contents('php://input'), true);
$songTitle = $input['songTitle'] ?? '';

if (empty($songTitle)) {
    echo json_encode(['success' => false, 'error' => 'Song title is required']);
    exit;
}

// Get song details to delete files
$stmt = $conn->prepare("SELECT song_path, thumbnail_path FROM useruploads WHERE username = ? AND song_title = ?");
$stmt->bind_param("ss", $username, $songTitle);
$stmt->execute();
$result = $stmt->get_result();
$song = $result->fetch_assoc();
$stmt->close();

if (!$song) {
    echo json_encode(['success' => false, 'error' => 'Song not found']);
    exit;
}

// Delete files from server
if (file_exists($song['song_path'])) {
    unlink($song['song_path']);
}
if (file_exists($song['thumbnail_path'])) {
    unlink($song['thumbnail_path']);
}

// Delete from useruploads table
$stmt = $conn->prepare("DELETE FROM useruploads WHERE username = ? AND song_title = ?");
$stmt->bind_param("ss", $username, $songTitle);
$userSuccess = $stmt->execute();
$stmt->close();

// Delete from fyp_songs table (optional, to remove from main feed)
$stmt = $conn->prepare("DELETE FROM fyp_songs WHERE title = ? AND artist = (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE username = ?)");
$stmt->bind_param("ss", $songTitle, $username);
$fypSuccess = $stmt->execute();
$stmt->close();

$conn->close();

if ($userSuccess) {
    echo json_encode(['success' => true, 'message' => 'Song deleted successfully']);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to delete song from database']);
}
?>