<?php
// fetch-country-data.php

include 'config.php';
header('Content-Type: application/json');

$type = $_GET['type'] ?? null;
$response = [];

try {
    if ($type === 'all_main_only') {
        $stmt = $conn->query("
            SELECT id, \"Country Name\" AS country_name, \"Flag Emoji\" AS flag_emoji
            FROM countries
            WHERE status IN ('UN member', 'UN observer')
            ORDER BY \"Country Name\" ASC
        ");
        $response = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    else if ($type === 'all_territories') {
        $stmt = $conn->query("
            SELECT id, \"Country Name\" AS country_name, \"Flag Emoji\" AS flag_emoji
            FROM countries
            WHERE status = 'Territory'
            ORDER BY \"Country Name\" ASC
        ");
        $response = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    else if ($type === 'all_de_facto_states') {
        $stmt = $conn->query("
            SELECT id, \"Country Name\" AS country_name, \"Flag Emoji\" AS flag_emoji
            FROM countries
            WHERE status = 'De facto state'
            ORDER BY \"Country Name\" ASC
        ");
        $response = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    else if ($type === 'random_main' && isset($_GET['limit'])) {
        include 'the-countries.php';
        $limit = (int)$_GET['limit'];
        $stmt = $conn->prepare("
            WITH random_countries AS (
                SELECT c.id, 
                       c.\"Country Name\" AS country_name,
                       c.\"Flag Emoji\" AS flag_emoji,
                       array_agg(cap.capital_name) AS capitals,
                       CASE 
                           WHEN LOWER(c.\"Country Name\") = ANY(?) 
                           THEN TRUE 
                           ELSE FALSE 
                       END AS needs_the
                FROM countries c
                JOIN capitals cap ON c.id = cap.country_id
                WHERE c.\"Entity Type\" IN ('UN member', 'UN observer')
                GROUP BY c.id, c.\"Country Name\", c.\"Flag Emoji\"
                ORDER BY RANDOM()
                LIMIT $limit
            )
            SELECT *
            FROM random_countries
            WHERE array_length(capitals, 1) > 0
        ");
        $stmt->execute(['{' . implode(',', $the_countries) . '}']);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            if (!empty($row['capitals']) && is_string($row['capitals'])) {
                $row['capitals'] = array_map('trim', explode(',', trim($row['capitals'], '{}')));
            }
        }
        $response = $rows;
    }
    else if ($type === 'autocomplete' && isset($_GET['query'])) {
        $query = $_GET['query'];
        $stmt = $conn->prepare("
            SELECT \"Country Name\"
            FROM countries
            WHERE \"Country Name\" ILIKE CONCAT('%', ?, '%')
            ORDER BY \"Country Name\" ASC
            LIMIT 20
        ");
        $stmt->execute([$query]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $response = $rows;
    }
    else if ($type === 'map') {
        $stmt = $conn->query("
            SELECT \"Country Name\" AS country_name, \"Capital Name\" AS capital_name,
                   latitude, longitude, iso_code, flag_emoji,
                   min_lat, max_lat, min_lng, max_lng
            FROM location_data
            ORDER BY \"Country Name\"
        ");
        $response = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    else if ($type === 'statistics') {
        $stmt = $conn->query("
            SELECT country_name, search_count, last_searched_at
            FROM site_statistics
            ORDER BY last_searched_at DESC
            LIMIT 1
        ");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $response['most_recent_search'] = $row ? $row['country_name'] : null;
    }
} catch (Exception $e) {
    error_log("[DB ERROR] fetch-country-data: " . $e->getMessage());
    if (getenv('APP_ENV') === 'development') {
        $response['error'] = $e->getMessage();
    } else {
        $response['error'] = 'Database error.';
    }
}

echo json_encode($response);
?>
