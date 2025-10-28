<?php
header('Content-Type: application/json');
require_once 'db_connect.php';
session_start();

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    exit;
}

$username = $_SESSION['username'];

// Get user's first_name + last_name for display
$stmt = $conn->prepare("
    SELECT first_name, last_name FROM users WHERE username = ?
");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

$artist = $user ? trim($user['first_name'] . ' ' . $user['last_name']) : $username;

// Get ONLY this user's uploads
$stmt = $conn->prepare("
    SELECT song_title AS title,
           '$artist' AS artist,
           thumbnail_path AS thumbnail_path,
           song_path AS song_path
    FROM useruploads
    WHERE username = ?
    ORDER BY uploaded_at DESC
");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();

$songs = [];

while ($row = $res->fetch_assoc()) {
    $songs[] = $row;
}
$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'songs' => $songs]);
?>