<?php
header('Content-Type: application/json');
require_once 'db_connect.php';
session_start();

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'error' => 'All fields are required']);
    exit;
}

// Check if username exists
$stmt = $conn->prepare("SELECT password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();
$stmt->close();

if (!$user) {
    echo json_encode(['success' => false, 'error' => 'Invalid username']);
    exit;
}

// Verify password
if (password_verify($password, $user['password'])) {
    $_SESSION['username'] = $username;
    echo json_encode(['success' => true, 'message' => 'Login successful']);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid password']);
}

$conn->close();
?>