/* Unchanged from your original */
document.addEventListener('DOMContentLoaded', () => {
    const input = document.querySelector('input[name="country"]');
    if (!input) return;

    input.setAttribute('autocomplete', 'off');
    const dropdown = document.createElement('ul');
    dropdown.className = 'autocomplete-dropdown';
    input.parentNode.appendChild(dropdown);

    let activeIndex = -1;
    function normalizeCountryName(countryName) {
        return countryName.replace(/^The\s+/i, '');
    }

    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('li');
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (items.length > 0) {
                    activeIndex = (activeIndex + 1) % items.length;
                    items.forEach((item, i) => {
                        item.classList.toggle('active', i === activeIndex);
                    });
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (items.length > 0) {
                    activeIndex = (activeIndex - 1 + items.length) % items.length;
                    items.forEach((item, i) => {
                        item.classList.toggle('active', i === activeIndex);
                    });
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (items.length > 0 && activeIndex >= 0 && items[activeIndex]) {
                    input.value = normalizeCountryName(items[activeIndex].textContent);
                    dropdown.style.display = 'none';
                    input.form.submit();
                } else if (input.value.trim()) {
                    input.value = normalizeCountryName(input.value);
                    input.form.submit();
                }
                break;
            case 'Escape':
                dropdown.style.display = 'none';
                activeIndex = -1;
                break;
        }
    });

    input.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        activeIndex = -1;
        if (!query) {
            dropdown.style.display = 'none';
            return;
        }
        try {
            const response = await fetch(`fetch-country-data.php?type=autocomplete&query=${encodeURIComponent(query)}`);
            const countries = await response.json();
            dropdown.innerHTML = '';
            if (countries.length > 0) {
                countries.forEach((country) => {
                    const item = document.createElement('li');
                    item.textContent = country;
                    item.addEventListener('click', () => {
                        input.value = normalizeCountryName(country);
                        dropdown.style.display = 'none';
                        input.form.submit();
                    });
                    dropdown.appendChild(item);
                });
                dropdown.style.display = 'block';
            } else {
                dropdown.style.display = 'none';
            }
        } catch (error) {
            console.error("Autocomplete fetch error:", error);
            dropdown.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
            activeIndex = -1;
        }
    });

    if (!('ontouchstart' in window)) {
        input.focus();
    }

    input.form.addEventListener('submit', (e) => {
        input.value = normalizeCountryName(input.value);
    });

    let touchMoved = false;
    input.addEventListener('touchstart', () => {
        touchMoved = false;
    });
    input.addEventListener('touchmove', () => {
        touchMoved = true;
    });
    input.addEventListener('touchend', (e) => {
        if (!touchMoved) {
            e.preventDefault();
            input.focus();
        }
        touchMoved = false;
    });
});


