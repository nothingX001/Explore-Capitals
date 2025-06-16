// js/main.js – shared across pages

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// TODO: Replace with your own project values
const SUPABASE_URL = 'https://szfisafwnkztsnfhyxwl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6ZmlzYWZ3bmt6dHNuZmh5eHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMzUxODUsImV4cCI6MjA2NTYxMTE4NX0.SV6Nn5KmlmktYv1siNfATPTx7CxIwFxXgrI7I8jmhDs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/* ------------------------------------------------------------------
   Routing helpers – The same module is loaded on every page. We call
   a different init function depending on the pathname.
-------------------------------------------------------------------*/

const routes = {
  '/index.html': initHome,
  '/': initHome, // Netlify/Pages default
  '/country.html': initCountry,
  '/quiz.html': initQuiz,
  '/profiles.html': initProfiles,
  '/world-map.html': initMap
}

const path = window.location.pathname.endsWith('/')
  ? '/'
  : window.location.pathname

routes[path]?.();

/* ----------------------------- Home page ----------------------------- */
async function initHome () {
  // Year in footer
  document.getElementById('year').textContent = new Date().getFullYear()

  const searchInput = document.getElementById('search-input')
  const resultsContainer = document.getElementById('results-container')

  if (!searchInput) return // defensive

  let debounceTimer
  searchInput.addEventListener('input', e => {
    const value = e.target.value.trim()
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      handleSearch(value)
    }, 300)
  })

  async function handleSearch (query) {
    resultsContainer.innerHTML = ''

    if (!query) return

    const { data, error } = await supabase
      .from('countries')
      .select('id, "Country Name", "Flag Emoji"')
      .ilike('Country Name', `%${query}%`)
      .limit(20)

    if (error) {
      console.error(error)
      resultsContainer.textContent = 'Error fetching countries.'
      return
    }

    if (!data.length) {
      resultsContainer.textContent = 'No countries found.'
      return
    }

    // Log search statistics (best-effort)
    supabase.rpc('increment_search', { p_country: query }).catch(() => {})

    data.forEach(country => {
      const card = document.createElement('article')
      card.className = 'result-card'
      card.innerHTML = `
        <h3>${country['Country Name']} ${country['Flag Emoji'] || ''}</h3>
        <small>Click for details</small>
      `
      card.addEventListener('click', () => {
        window.location.href = `country.html?id=${country.id}`
      })
      resultsContainer.appendChild(card)
    })
  }
}

/* -------------------------- Country page ------------------------------ */
async function initCountry () {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  if (!id) {
    document.body.textContent = 'Missing country id.'
    return
  }

  const main = document.querySelector('main') || document.body
  main.innerHTML = '<p>Loading…</p>'

  const { data: country, error } = await supabase
    .from('countries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(error)
    main.textContent = 'Error loading country.'
    return
  }

  const { data: capitals, error: capErr } = await supabase
    .from('capitals')
    .select('capital_name')
    .eq('country_code', id)

  if (capErr) {
    console.error(capErr)
  }

  const capitalList = (capitals || [])
    .map(c => c.capital_name)
    .join(', ')

  main.innerHTML = `
    <section id="country-details">
      <h2>${country['Country Name']} ${country['Flag Emoji'] || ''}</h2>
      <p><strong>Official name:</strong> ${country['Official Name'] || '—'}</p>
      <p><strong>Capital${capitals && capitals.length > 1 ? 's' : ''}:</strong> ${capitalList || '—'}</p>
      <a href="index.html">← Back to search</a>
    </section>
  `
}

/* ----------------------------- Quiz page ----------------------------- */
async function initQuiz () {
  const main = document.querySelector('main') || document.body
  main.innerHTML = '<p>Loading quiz…</p>'

  // Fetch random 10 countries with capitals via Postgres 'order by random' (server side)
  const { data, error } = await supabase.rpc('get_random_countries_with_capitals', { count: 10 })

  if (error) {
    console.error(error)
    main.textContent = 'Error loading quiz.'
    return
  }

  let current = 0
  let score = 0

  const quizContainer = document.createElement('section')
  quizContainer.id = 'quiz-container'
  main.innerHTML = ''
  main.appendChild(quizContainer)

  nextQuestion()

  function nextQuestion () {
    if (current >= data.length) {
      quizContainer.innerHTML = `<h2>Your score: ${score}/${data.length}</h2>`
      return
    }

    const item = data[current]
    const correctAnswer = item.capital_name
    const choices = shuffle([
      correctAnswer,
      ...getRandomOtherCapitals(correctAnswer, 3)
    ])

    quizContainer.innerHTML = `
      <div class="question">
        <h2>Question ${current + 1} of ${data.length}</h2>
        <p>What is the capital of <strong>${item.country_name}</strong>?</p>
      </div>
      <div class="options">
        ${choices
          .map(
            c => `<button type="button" data-choice="${c}">${c}</button>`
          )
          .join('')}
      </div>
    `

    const buttons = quizContainer.querySelectorAll('button')
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const chosen = btn.dataset.choice
        const isCorrect = chosen === correctAnswer
        btn.classList.add(isCorrect ? 'correct' : 'incorrect')
        if (isCorrect) score++
        buttons.forEach(b => (b.disabled = true))
        setTimeout(() => {
          current++
          nextQuestion()
        }, 1000)
      })
    })
  }

  // Helpers ------------------------------------------------------------
  function shuffle (array) {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
  }

  function getRandomOtherCapitals (excludeCapital, count) {
    // naive: will fetch additional capitals from dataset already loaded (not ideal), fallback static
    const pool = data
      .map(d => d.capital_name)
      .filter(c => c !== excludeCapital)
    const shuffled = shuffle(pool)
    return shuffled.slice(0, count)
  }
}

/* -------------------------- Profiles page ---------------------------- */
async function initProfiles () {
  const main = document.querySelector('main') || document.body
  main.innerHTML = '<p>Loading profiles…</p>'

  // Helper to render a list section
  const renderSection = (title, rows) => {
    const section = document.createElement('section')
    const h2 = document.createElement('h2')
    h2.textContent = title
    section.appendChild(h2)

    if (!rows.length) {
      const p = document.createElement('p')
      p.textContent = 'No entries found.'
      section.appendChild(p)
      return section
    }

    const ul = document.createElement('ul')
    rows.forEach(r => {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = `country.html?id=${r.id}`
      a.textContent = `${r.country_name} ${r.flag_emoji || ''}`
      li.appendChild(a)
      ul.appendChild(li)
    })
    section.appendChild(ul)
    return section
  }

  // Fetch all three groups concurrently
  const [countriesRes, terrRes, deFactoRes] = await Promise.all([
    supabase
      .from('countries')
      .select('id, "Country Name", "Flag Emoji"')
      .in('entity_type', ['member_state', 'observer_state'])
      .order('Country Name'),
    supabase
      .from('countries')
      .select('id, "Country Name", "Flag Emoji"')
      .eq('entity_type', 'territory')
      .order('Country Name'),
    supabase
      .from('countries')
      .select('id, "Country Name", "Flag Emoji"')
      .eq('entity_type', 'de_facto_state')
      .order('Country Name')
  ])

  if (countriesRes.error || terrRes.error || deFactoRes.error) {
    console.error(countriesRes.error || terrRes.error || deFactoRes.error)
    main.textContent = 'Error loading country profiles.'
    return
  }

  main.innerHTML = ''
  main.appendChild(renderSection('Countries', countriesRes.data.map(r => ({
    id: r.id,
    country_name: r['Country Name'],
    flag_emoji: r['Flag Emoji']
  }))))
  main.appendChild(renderSection('Territories', terrRes.data.map(r => ({
    id: r.id,
    country_name: r['Country Name'],
    flag_emoji: r['Flag Emoji']
  }))))
  main.appendChild(renderSection('De Facto States', deFactoRes.data.map(r => ({
    id: r.id,
    country_name: r['Country Name'],
    flag_emoji: r['Flag Emoji']
  }))))
}

/* ----------------------------- Map page ------------------------------ */
async function initMap () {
  const main = document.querySelector('main') || document.body
  main.innerHTML = `
    <h2>World Map</h2>
    <p>Explore countries and their capitals around the world.</p>
    <div class="search-bar-container"><input type="text" id="map-search" placeholder="Search for a country or capital…"></div>
    <div id="map" style="height:500px;width:100%;border-radius:15px;margin-top:20px;"></div>
  `

  // dynamic import MAPBOX js + css via CDN (only when this page loaded)
  const mapboxJsUrl = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js'
  const mapboxCssUrl = 'https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css'
  await Promise.all([
    new Promise(res => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = mapboxCssUrl
      document.head.appendChild(link)
      link.onload = res
    }),
    new Promise(res => {
      const script = document.createElement('script')
      script.src = mapboxJsUrl
      script.onload = res
      document.head.appendChild(script)
    })
  ])

  // eslint-disable-next-line no-undef
  mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN'
  // eslint-disable-next-line no-undef
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [0, 20],
    zoom: 1.5,
    projection: 'globe'
  })

  // Add fog for globe
  map.on('style.load', () => {
    map.setFog({
      range: [0.5, 10],
      color: 'rgba(135,206,235,0.15)',
      'high-color': 'rgba(255,255,255,0.1)',
      'space-color': 'rgba(0,0,0,1)',
      'horizon-blend': 0.1,
      'star-intensity': 0.1
    })
  })

  // Fetch countries + capitals to plot markers
  const { data, error } = await supabase
    .from('capitals')
    .select('capital_name, latitude, longitude, countries(id, "Country Name", "Flag Emoji")')

  if (error) {
    console.error(error)
  }

  // eslint-disable-next-line no-undef
  const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })

  data?.forEach(row => {
    if (row.latitude === null || row.longitude === null) return
    // eslint-disable-next-line no-undef
    const marker = new mapboxgl.Marker()
      .setLngLat([row.longitude, row.latitude])
      .addTo(map)
    marker.getElement().addEventListener('mouseenter', () => {
      popup
        .setLngLat([row.longitude, row.latitude])
        .setHTML(`<strong>${row.capital_name}</strong><br>${row.countries['Country Name']} ${row.countries['Flag Emoji'] || ''}`)
        .addTo(map)
    })
    marker.getElement().addEventListener('mouseleave', () => popup.remove())
    marker.getElement().addEventListener('click', () => {
      window.location.href = `country.html?id=${row.countries.id}`
    })
  })

  // Search bar behavior
  const searchInput = document.getElementById('map-search')
  searchInput.addEventListener('keyup', e => {
    if (e.key !== 'Enter') return
    const q = e.target.value.trim().toLowerCase()
    if (!q) return
    const match = data.find(
      d => d.capital_name.toLowerCase() === q || d.countries['Country Name'].toLowerCase() === q
    )
    if (match) {
      map.flyTo({ center: [match.longitude, match.latitude], zoom: 5 })
    }
  })
}