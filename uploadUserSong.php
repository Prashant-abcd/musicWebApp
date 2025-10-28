<?php
header('Content-Type: application/json');
require_once 'db_connect.php';          // your DB connection file
session_start();

// ------------------------------------------------------------------
// 1. Must be logged in
// ------------------------------------------------------------------
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'error' => 'You must be logged in']);
    exit;
}
$username = $_SESSION['username'];

// ------------------------------------------------------------------
// 2. Get user’s first_name & last_name from the `users` table
// ------------------------------------------------------------------
$stmt = $conn->prepare("SELECT first_name, last_name FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$user   = $result->fetch_assoc();

if (!$user) {
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}
$first_name = $user['first_name'];
$last_name  = $user['last_name'];
$stmt->close();

// ------------------------------------------------------------------
// 3. Server-side validation
// ------------------------------------------------------------------
$songTitle = trim($_POST['songTitle'] ?? '');
$genre     = $_POST['genre'] ?? '';

if ($songTitle === '' || !preg_match('/^[a-zA-Z]{3,30}$/', $songTitle)) {
    echo json_encode(['success' => false, 'error' => 'Song title must be 3-30 letters only']);
    exit;
}
if ($genre === '' || !in_array($genre, ['lofi','pop','hiphop','folk','classical','electronic','jazz','soul','country','rock'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid genre']);
    exit;
}

// ------------------------------------------------------------------
// 4. File validation (song + thumbnail)
// ------------------------------------------------------------------
$allowedSongTypes = ['audio/mpeg', 'audio/mp3'];
$allowedImgTypes  = ['image/jpeg', 'image/jpg'];

$songFile      = $_FILES['songFile'] ?? null;
$thumbFile     = $_FILES['songThumbnailFile'] ?? null;

if (!$songFile || $songFile['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Song file is required']);
    exit;
}
if (!in_array($songFile['type'], $allowedSongTypes)) {
    echo json_encode(['success' => false, 'error' => 'Song must be .mp3']);
    exit;
}
if (!$thumbFile || $thumbFile['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'error' => 'Thumbnail is required']);
    exit;
}
if (!in_array($thumbFile['type'], $allowedImgTypes)) {
    echo json_encode(['success' => false, 'error' => 'Thumbnail must be .jpg/.jpeg']);
    exit;
}

// ------------------------------------------------------------------
// 5. Create safe filenames & directories
// ------------------------------------------------------------------
$uploadDirSong = 'usersUploads/songs/';
$uploadDirThumb = 'usersUploads/thumbnails/';

if (!is_dir($uploadDirSong))  mkdir($uploadDirSong, 0755, true);
if (!is_dir($uploadDirThumb)) mkdir($uploadDirThumb, 0755, true);

$random = bin2hex(random_bytes(8));
$songExt = pathinfo($songFile['name'], PATHINFO_EXTENSION);
$thumbExt = pathinfo($thumbFile['name'], PATHINFO_EXTENSION);

$songPath   = $uploadDirSong . $username . '_' . $random . '.' . $songExt;
$thumbPath  = $uploadDirThumb . $username . '_' . $random . '.' . $thumbExt;

// ------------------------------------------------------------------
// 6. Move uploaded files
// ------------------------------------------------------------------
if (!move_uploaded_file($songFile['tmp_name'], $songPath)) {
    echo json_encode(['success' => false, 'error' => 'Failed to save song']);
    exit;
}
if (!move_uploaded_file($thumbFile['tmp_name'], $thumbPath)) {
    unlink($songPath); // clean up song if thumb fails
    echo json_encode(['success' => false, 'error' => 'Failed to save thumbnail']);
    exit;
}

// ------------------------------------------------------------------
// 7. Insert into `useruploads`
// ------------------------------------------------------------------
$stmt = $conn->prepare("
    INSERT INTO useruploads 
    (username, first_name, last_name, song_title, genre, song_path, thumbnail_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
$stmt->bind_param(
    "sssssss",
    $username, $first_name, $last_name,
    $songTitle, $genre, $songPath, $thumbPath
);
if (!$stmt->execute()) {
    unlink($songPath);
    unlink($thumbPath);
    echo json_encode(['success' => false, 'error' => 'DB error (useruploads)']);
    exit;
}
$stmt->close();

// ------------------------------------------------------------------
// 8. Insert the same song into `fyp_songs` (so it appears in the feed)
// ------------------------------------------------------------------
$stmt = $conn->prepare("
    INSERT INTO fyp_songs 
    (title, artist, song_path, thumbnail_path, genre)
    VALUES (?, ?, ?, ?, ?)
");
$artist = "$first_name $last_name";   // simple artist name
$stmt->bind_param("sssss", $songTitle, $artist, $songPath, $thumbPath, $genre);
if (!$stmt->execute()) {
    // optional: you could delete the row from useruploads here
    echo json_encode(['success' => false, 'error' => 'Failed to add to main feed']);
    exit;
}
$stmt->close();

// ------------------------------------------------------------------
// 9. Success!
// ------------------------------------------------------------------
echo json_encode([
    'success' => true,
    'message' => 'Song uploaded successfully!'
]);

$conn->close();
?>