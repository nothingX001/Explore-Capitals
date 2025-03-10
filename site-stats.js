<!-- Unchanged; for reference -->
// Fetch the most recent search and display it in local time
function fetchMostRecentSearch() {
    fetch('/fetch-country-data.php?type=statistics')
        .then(response => response.json())
        .then(data => {
            const mostRecentSearch = data.most_recent_search || 'No recent searches available.';
            document.getElementById('most-recent-search').textContent = mostRecentSearch;
            console.log('Statistics:', data);
        })
        .catch(error => console.error('Error fetching recent search:', error));
}

window.onload = fetchMostRecentSearch;


