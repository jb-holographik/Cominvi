import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initScrollList(root = document) {
  const section =
    root.querySelector('.section_partners') ||
    document.querySelector('.section_partners')
  if (!section) return

  // 1) Activate the .scroll-item which crosses the viewport center
  initScrollItems(section)

  // 2) Build ticks to fill height on each side indicators
  const indicators = Array.from(
    section.querySelectorAll('.content_column > .scroll-indicator')
  )
  if (indicators.length) {
    buildAllIndicators(indicators)
    setupTickHighlighting(section, indicators)

    // Rebuild on resize
    let resizeTimer
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        buildAllIndicators(indicators)
        ScrollTrigger.refresh()
      }, 150)
    })
  }
}

function initScrollItems(section) {
  const items = Array.from(
    section.querySelectorAll('.scroll-list .scroll-item')
  )
  if (!items.length) return

  const spans = items.map((el) => el.querySelector('.body-xl')).filter(Boolean)

  // Ensure initial state: all dimmed
  spans.forEach((span) => {
    span.classList.remove('is-active')
    if (!span.classList.contains('is-o-20')) span.classList.add('is-o-20')
  })

  let currentActive = null

  items.forEach((item, index) => {
    const span = spans[index]
    if (!span) return
    ScrollTrigger.create({
      trigger: item,
      start: 'top center',
      end: 'bottom center',
      onToggle(self) {
        if (self.isActive) {
          if (currentActive && currentActive !== span) {
            currentActive.classList.remove('is-active')
            if (!currentActive.classList.contains('is-o-20'))
              currentActive.classList.add('is-o-20')
          }
          span.classList.remove('is-o-20')
          span.classList.add('is-active')
          currentActive = span
        } else if (currentActive === span) {
          // If leaving with nothing else active yet
          span.classList.remove('is-active')
          if (!span.classList.contains('is-o-20')) span.classList.add('is-o-20')
          currentActive = null
        }
      },
    })
  })
}

function buildAllIndicators(indicators) {
  indicators.forEach((indicator) => buildIndicator(indicator))
}

function buildIndicator(indicator) {
  // Measure container and a sample tick
  const style = getComputedStyle(indicator)
  const rowGap = parseFloat(
    style.rowGap || style.getPropertyValue('row-gap') || style.gridRowGap || 0
  )

  // Create a temporary sample tick to measure if needed
  let sample = indicator.querySelector('.scroll-tick')
  let createdTemp = false
  if (!sample) {
    sample = document.createElement('div')
    sample.className = 'scroll-tick'
    indicator.appendChild(sample)
    createdTemp = true
  }

  const tickHeight = sample.getBoundingClientRect().height
  const containerHeight = indicator.clientHeight

  // Compute number of ticks so that ticks + gaps fill the height
  const perUnit = tickHeight + rowGap
  let count =
    perUnit > 0
      ? Math.max(1, Math.floor((containerHeight + rowGap) / perUnit))
      : 1

  // Clear and rebuild ticks
  indicator.innerHTML = ''
  const frag = document.createDocumentFragment()
  for (let i = 0; i < count; i++) {
    const t = document.createElement('div')
    t.className = 'scroll-tick'
    frag.appendChild(t)
  }
  indicator.appendChild(frag)

  // Cleanup temp (already removed by innerHTML = '')
  if (createdTemp) {
    // no-op
  }
}

function setupTickHighlighting(section, indicators) {
  const wrapper =
    document.querySelector('.page-wrap') ||
    section.closest('.page-wrap') ||
    window

  const updateTicks = () => {
    const viewportRect =
      wrapper === window
        ? { top: 0, height: window.innerHeight }
        : wrapper.getBoundingClientRect()
    const viewportCenter = viewportRect.top + viewportRect.height / 2

    indicators.forEach((indicator) => {
      const ticks = Array.from(indicator.querySelectorAll('.scroll-tick'))
      if (!ticks.length) return

      // Find the tick whose center is closest to viewport center
      let closestIndex = 0
      let closestDist = Infinity
      ticks.forEach((tick, idx) => {
        const r = tick.getBoundingClientRect()
        const center = r.top + r.height / 2
        const d = Math.abs(center - viewportCenter)
        if (d < closestDist) {
          closestDist = d
          closestIndex = idx
        }
      })

      // Reset classes
      ticks.forEach((tick) => {
        tick.classList.remove('is-xxl', 'is-xl', 'is-l', 'is-m')
      })

      // Apply gradient classes around the closest tick
      const set = (i, cls) => {
        if (i >= 0 && i < ticks.length) ticks[i].classList.add(cls)
      }
      set(closestIndex, 'is-xxl')
      set(closestIndex - 1, 'is-xl')
      set(closestIndex + 1, 'is-xl')
      set(closestIndex - 2, 'is-l')
      set(closestIndex + 2, 'is-l')
      set(closestIndex - 3, 'is-m')
      set(closestIndex + 3, 'is-m')
    })
  }

  // Update while the partners section is near the viewport
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: updateTicks,
    onEnter: updateTicks,
    onEnterBack: updateTicks,
  })

  // Initial update once
  updateTicks()
}
