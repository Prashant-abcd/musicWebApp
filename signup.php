<?php
header('Content-Type: application/json');
require_once 'db_connect.php';

session_start(); // Start session for login after signup

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form data
    $username = trim($_POST['username'] ?? '');
    $firstName = trim($_POST['firstName'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $password = $_POST['password'] ?? '';
    $genres = $_POST['genres'] ?? '[]'; // JSON string of selected genres

    // If genres is empty or not provided, default to ["none"]
    $genres = ($genres === '[]' || empty($genres)) ? '["none"]' : $genres;

    // Validate username: starts with letter or underscore, followed by 2-19 alphanumeric or underscore
    if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]{2,19}$/', $username)) {
        echo json_encode(['success' => false, 'error' => 'Invalid username. Must be 3-20 characters, start with a letter or underscore, and contain only letters, numbers, or underscores.']);
        $conn->close();
        exit;
    }

    // Validate other fields
    if (empty($firstName) || empty($lastName)) {
        echo json_encode(['success' => false, 'error' => 'First name and last name are required.']);
        $conn->close();
        exit;
    }

    if (strlen($password) < 8) {
        echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters long.']);
        $conn->close();
        exit;
    }

    // Validate genres is a valid JSON array
    if (!json_decode($genres, true)) {
        echo json_encode(['success' => false, 'error' => 'Invalid genres format.']);
        $conn->close();
        exit;
    }

    // Check if username already exists
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    if ($row['count'] > 0) {
        echo json_encode(['success' => false, 'error' => 'Username already exists.']);
        $stmt->close();
        $conn->close();
        exit;
    }
    $stmt->close();

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert user into the database
    $stmt = $conn->prepare("INSERT INTO users (username, first_name, last_name, password, genres) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $username, $firstName, $lastName, $hashedPassword, $genres);

    if ($stmt->execute()) {
        // Set session variables for auto-login
        $_SESSION['user_id'] = $conn->insert_id;
        $_SESSION['username'] = $username;
        echo json_encode(['success' => true, 'message' => 'User registered successfully.', 'username' => $username]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to register user: ' . $conn->error]);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method. Use POST.']);
}

$conn->close();
?>