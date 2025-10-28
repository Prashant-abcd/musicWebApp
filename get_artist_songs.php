<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$artist = isset($_GET['artist']) ? $_GET['artist'] : '';

if (empty($artist)) {
    echo json_encode(['success' => false, 'error' => 'No artist specified']);
    mysqli_close($conn);
    exit;
}

$query = "SELECT id, title, artist, file_path, album_art_path, genre 
          FROM artistSongs 
          WHERE artist = ? 
          ORDER BY created_at DESC";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $artist);
$stmt->execute();
$result = $stmt->get_result();

if (!$result) {
    echo json_encode(['success' => false, 'error' => 'Error fetching songs: ' . $conn->error]);
    $stmt->close();
    mysqli_close($conn);
    exit;
}

$songs = [];
while ($row = $result->fetch_assoc()) {
    $songs[] = $row;
}

$stmt->close();
echo json_encode(['success' => true, 'songs' => $songs]);
mysqli_close($conn);
?>