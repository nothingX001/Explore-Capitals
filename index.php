<?php
// index.php

session_start(); // Needed for CSRF tokens

include 'config.php';
include 'the-countries.php'; // "the" country list

// Generate CSRF token if not yet present
if (!isset($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Basic validation (letters, spaces, punctuation) – tweak as needed
function validate_country_input($input) {
    // For example, only letters/apostrophes/hyphens/parentheses/spaces
    // Return TRUE if valid, FALSE otherwise
    return (
        strlen(trim($input)) > 0 
        && preg_match('/^[A-Za-z\'\-\s\(\)]+$/', $input)
    );
}

// Normalize user input (handle "the " prefix, capitalization, etc.)
function normalize_country_input($input) {
    global $the_countries;
    $input = strtolower(trim($input));
    // Remove any leading "the "
    $input_without_the = preg_replace('/^the\s+/i', '', $input);

    // If it's in the "the_countries" array, convert to "The X"
    if (in_array($input_without_the, $the_countries)) {
        return ucwords($input_without_the, " \t\r\n\f\v-()/'");
    }
    // Otherwise just do normal capitalizing
    return ucwords($input, " \t\r\n\f\v-()/'");
}

function format_country_name_in_sentence($country_name, $the_countries) {
    $country_lower = strtolower($country_name);
    $needs_the = in_array($country_lower, $the_countries);
    return $needs_the ? "the " . $country_name : $country_name;
}

// This will hold our main user-facing message about the search
$message = null;

// Handle form submission
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Check CSRF
    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
        die("Invalid CSRF token.");
    }

    $country_input = $_POST['country'] ?? '';
    // Validate user input
    if (!validate_country_input($country_input)) {
        $message = "Invalid country name or format.";
    } else {
        // Normalize for DB lookup
        $country = normalize_country_input($country_input);

        try {
            // 1) Look up the country
            $stmt = $conn->prepare('
                SELECT
                    id,
                    "Country Name" AS country_name,
                    "Flag Emoji"   AS flag_emoji,
                    "Official Name" AS official_name
                FROM countries
                WHERE "Country Name" ILIKE ?
                LIMIT 1
            ');
            $stmt->execute([$country]);
            $country_result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($country_result) {
                $country_id   = $country_result['id'];
                $country_name = htmlspecialchars($country_result['country_name']);
                $flag         = htmlspecialchars($country_result['flag_emoji'] ?? '');
                $official_name = htmlspecialchars($country_result['official_name'] ?? '');

                // 2) Fetch matching capitals
                $cap_stmt = $conn->prepare('
                    SELECT capital_name
                    FROM capitals
                    WHERE country_id = ?
                ');
                $cap_stmt->execute([$country_id]);
                $capitals = $cap_stmt->fetchAll(PDO::FETCH_COLUMN);

                // 3) Build a message
                if ($capitals) {
                    $boldCapitals = array_map(function($cap) use ($country_id) {
                        return '<a href="country-detail.php?id=' . urlencode($country_id) . '"><strong>' 
                               . htmlspecialchars($cap) . '</strong></a>';
                    }, $capitals);

                    // Format multiple capitals
                    if (count($capitals) === 1) {
                        $capital_names = $boldCapitals[0];
                    } else if (count($capitals) === 2) {
                        $capital_names = $boldCapitals[0] . ' or ' . $boldCapitals[1];
                    } else {
                        $lastCapital = array_pop($boldCapitals);
                        $capital_names = implode(', ', $boldCapitals) . ' and ' . $lastCapital;
                    }

                    $capital_count = count($capitals);
                    $capital_word  = ($capital_count > 1) ? 'capitals' : 'capital';
                    $verb          = ($capital_count > 1) ? 'are' : 'is';

                    $formatted_country_name = format_country_name_in_sentence($country_name, $the_countries);
                    $message = "The {$capital_word} of <a href='country-detail.php?id=" 
                               . urlencode($country_id) . "'>{$formatted_country_name}</a> {$verb} "
                               . $capital_names . ". <span class=\"flag-emoji\">{$flag}</span>";
                } else {
                    $formatted_country_name = format_country_name_in_sentence($country_name, $the_countries);
                    $message = "No capitals found for <a href='country-detail.php?id=" 
                               . urlencode($country_id) . "'>{$formatted_country_name}</a>.";
                }

                // 4) Update site statistics
                try {
                    $stats_stmt = $conn->prepare('
                        INSERT INTO site_statistics (country_name, search_count, last_searched_at)
                        VALUES (?, 1, NOW())
                        ON CONFLICT (country_name)
                        DO UPDATE SET
                            search_count = site_statistics.search_count + 1,
                            last_searched_at = NOW()
                    ');
                    $stats_stmt->execute([$country_name]);
                } catch (Exception $e) {
                    error_log("[DB ERROR] " . $e->getMessage());
                }

            } else {
                $message = "Sorry, the country you entered is not in our database.";
            }
        } catch (Exception $ex) {
            // Log DB error
            error_log("[DB ERROR] " . $ex->getMessage());
            if (getenv('APP_ENV') === 'development') {
                $message = "Database error: " . $ex->getMessage();
            } else {
                $message = "A database error occurred. Please try again later.";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ExploreCapitals | The World Capital Finder</title>
    <link rel="icon" type="image/jpeg" href="images/explore-capitals-logo.jpg">
    <meta name="viewport" content="width=device-width, viewport-fit=cover">
    <meta name="description" content="Find the capital city of any country or territory in the world. Search by country name to discover its capital(s).">
    <meta name="keywords" content="capital cities, world capitals, country capitals, geography quiz, world geography">
    <meta name="author" content="ExploreCapitals">
    <meta property="og:title" content="ExploreCapitals - Find Any Country's Capital City">
    <meta property="og:description" content="Find the capital city of any country or territory in the world. Search by country name to discover its capital(s).">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <?php include 'navbar.php'; ?>

    <div class="page-content home">
        <h1>ExploreCapitals</h1>
        <h3>Enter a country to find its capital:</h3>
        <form action="index.php" method="post" id="searchForm">
            <!-- CSRF token -->
            <input type="hidden" name="csrf_token" value="<?php echo $_SESSION['csrf_token']; ?>">

            <div class="search-bar-container">
                <input type="text" name="country" placeholder="Search..." novalidate>
            </div>
            <input type="submit" value="SUBMIT" class="button">
        </form>

        <?php if (isset($message)): ?>
            <p class="message"><?php echo $message; ?></p>
        <?php endif; ?>
    </div>

    <!-- Autocomplete script, unchanged except for removing default browser autocomplete -->
    <script src="autocomplete.js" defer></script>
    <script>
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        const input = this.querySelector('input[name="country"]');
        if (input && !input.value.trim()) {
            e.preventDefault();
            input.setCustomValidity('Please enter a country name');
            input.reportValidity();
        } else if (input) {
            input.setCustomValidity('');
            input.blur();
        }
    });

    // Clear validation if user modifies input
    document.querySelector('input[name="country"]').addEventListener('input', function() {
        this.setCustomValidity('');
    });
    </script>
</body>
</html>


