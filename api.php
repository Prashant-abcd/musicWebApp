<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

$sql = "SELECT id, title, artist, file_path, album_art_path FROM trendingSongs";
$result = $conn->query($sql);

$songs = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $songs[] = $row;
    }
}

echo json_encode($songs);
$conn->close();
?>