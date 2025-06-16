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
  '/quiz.html': initQuiz
}

const path = window.location.pathname.endsWith('/')
  ? '/'
  : window.location.pathname

if (routes[path]) {
  routes[path]()
}

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
    .eq('country_id', id)

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