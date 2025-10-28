<?php
header('Content-Type: application/json');
session_start();

// Destroy the session to log out the user
session_destroy();

// Return success response
echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
?>