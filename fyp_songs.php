<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

session_start(); // Start session to access username

// Check if user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'Not logged in']);
    mysqli_close($conn);
    exit;
}

$username = $_SESSION['username'];

// Check for genre parameter
$genre = isset($_GET['genre']) ? $_GET['genre'] : '';

// Fetch user's genres if no specific genre is requested
$genres = [];
if (!$genre) {
    $stmt = $conn->prepare("SELECT genres FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result) {
        echo json_encode(['success' => false, 'error' => 'Error fetching user: ' . $conn->error]);
        $stmt->close();
        mysqli_close($conn);
        exit;
    }

    $userData = $result->fetch_assoc();
    $genres = ($userData && $userData['genres'] !== '["none"]') ? json_decode($userData['genres'], true) : [];
    $stmt->close();
}

// Fetch songs
$songs = [];
if ($genre) {
    // Fetch songs for the specific genre
    $query = "SELECT id, title, artist, song_path, thumbnail_path, genre 
              FROM fyp_songs 
              WHERE genre = ? 
              ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $genre);
} elseif (!empty($genres)) {
    // Prioritize user's genres
    $placeholders = implode(',', array_fill(0, count($genres), '?'));
    $query = "SELECT id, title, artist, song_path, thumbnail_path, genre 
              FROM fyp_songs 
              ORDER BY genre IN ($placeholders) DESC, created_at DESC";
    $stmt = $conn->prepare($query);
    $stmt->bind_param(str_repeat('s', count($genres)), ...$genres);
} else {
    // Fetch all songs if no genre or user genres
    $query = "SELECT id, title, artist, song_path, thumbnail_path, genre 
              FROM fyp_songs 
              ORDER BY created_at DESC";
    $stmt = $conn->prepare($query);
}

$stmt->execute();
$result = $stmt->get_result();

if (!$result) {
    echo json_encode(['success' => false, 'error' => 'Error fetching songs: ' . $conn->error]);
    $stmt->close();
    mysqli_close($conn);
    exit;
}

// Fetch all songs
while ($row = $result->fetch_assoc()) {
    $songs[] = $row;
}

$stmt->close();

// Return songs as JSON
echo json_encode(['success' => true, 'songs' => $songs]);

// Close connection
mysqli_close($conn);
?>