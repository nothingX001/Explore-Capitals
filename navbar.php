<!-- navbar.php -->
<nav class="navbar">
  <div class="navbar-container">
    <button class="navbar-toggle" id="navbarToggle" aria-label="Toggle navigation"></button>
    <!-- Logo -->
    <div class="navbar-logo">
      <a href="index.php">
        <img src="images/explore-capitals-logo.jpg" alt="ExploreCapitals Logo">
      </a>
    </div>

    <ul class="navbar-list" id="navbarList">
      <li><a href="index.php">HOME</a></li>
      <li><a href="country-profiles.php">COUNTRY PROFILES</a></li>
      <li><a href="quiz.php">QUIZ</a></li>
      <li><a href="world-map.php">WORLD MAP</a></li>
      <li><a href="about.php">ABOUT</a></li>
    </ul>
  </div>
</nav>

<script>
// INLINED NAVBAR JS
(() => {
    const navbar       = document.querySelector('.navbar');
    const navbarToggle = document.getElementById('navbarToggle');
    const navbarList   = document.getElementById('navbarList');

    let isMenuOpen = false;

    function setMenuState(open) {
        isMenuOpen = open;
        if (open) {
            document.body.classList.add('menu-open');
            navbar.classList.add('menu-active');
            navbarList.classList.add('open');
        } else {
            document.body.classList.remove('menu-open');
            navbar.classList.remove('menu-active');
            navbarList.classList.remove('open');
        }
    }

    navbarToggle.addEventListener('click', () => {
        setMenuState(!isMenuOpen);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isMenuOpen) {
            setMenuState(false);
        }
    });
})();
</script>

<style>
/* Navbar Styles (unchanged) */
.navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 80px;
    z-index: 9999;
    transition: background-color 0.3s ease;
}

.navbar.menu-active {
    background-color: #2F3B44 !important;
}

.navbar-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
}

.navbar-logo {
    position: relative;
    z-index: 10000;
}

.navbar-logo img {
    height: 30px;
    width: auto;
    border-radius: 8px;
}

.navbar-toggle {
    position: relative;
    z-index: 10000;
    width: 30px;
    height: 30px;
    background: none;
    border: none;
    cursor: pointer;
}

.navbar-toggle::before {
    content: '☰';
    font-size: 1.5rem;
    color: #ECECEC;
}

/* Full screen menu */
.navbar-list {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: #2F3B44;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 0;
    margin: 0;
    z-index: 9999;
}

.navbar-list.open {
    display: flex;
}

.navbar-list li {
    list-style: none;
    text-align: center;
}

.navbar-list li a {
    color: #ECECEC;
    text-decoration: none;
    font-size: 1.5rem;
    padding: 1rem 2rem;
    display: block;
    transition: color 0.3s ease;
}

.navbar-list li a:hover {
    color: #DCCB9C;
}

/* Prevent scrolling when menu is open */
body.menu-open {
    overflow: hidden;
    position: fixed;
    width: 100%;
    height: 100%;
}

/* iOS Safe Area Support */
@supports (padding-top: env(safe-area-inset-top)) {
    .navbar {
        padding-top: env(safe-area-inset-top);
        height: calc(80px + env(safe-area-inset-top));
    }

    .navbar-list {
        padding-top: env(safe-area-inset-top);
    }
}
</style>


