<?php
// config.php

// 1) Switch error display based on environment (development vs production)
if (getenv('APP_ENV') === 'development') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    ini_set('display_startup_errors', 0);
    error_reporting(0);
}

// 2) Parse DATABASE_URL
$databaseUrl = getenv('DATABASE_URL');
if (!$databaseUrl) {
    die("DATABASE_URL environment variable not set.");
}

$dbopts = parse_url($databaseUrl);
$host = $dbopts["host"];
$port = $dbopts["port"];
$user = $dbopts["user"];
$password = $dbopts["pass"];
$dbname = ltrim($dbopts["path"], '/'); // Should match your DB name

try {
    // 3) Create PDO with error handling
    $conn = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // 4) Log the error; do not expose details in production
    error_log("[DB ERROR] " . $e->getMessage());
    if (getenv('APP_ENV') === 'development') {
        die("Connection failed: " . $e->getMessage());
    } else {
        die("A database error occurred. Please try again later.");
    }
}
?>


