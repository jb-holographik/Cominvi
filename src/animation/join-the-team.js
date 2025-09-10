import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function buildIndicator(indicator) {
  const style = getComputedStyle(indicator)
  const rowGap = parseFloat(
    style.rowGap || style.getPropertyValue('row-gap') || style.gridRowGap || 0
  )

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
  const perUnit = tickHeight + rowGap
  let count =
    perUnit > 0
      ? Math.max(1, Math.floor((containerHeight + rowGap) / perUnit))
      : 1

  indicator.innerHTML = ''
  const frag = document.createDocumentFragment()
  for (let i = 0; i < count; i++) {
    const t = document.createElement('div')
    t.className = 'scroll-tick'
    frag.appendChild(t)
  }
  indicator.appendChild(frag)

  if (createdTemp) {
    // no-op
  }
}

function buildAllIndicators(indicators) {
  indicators.forEach((indicator) => buildIndicator(indicator))
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

      ticks.forEach((tick) => {
        tick.classList.remove('is-xxl', 'is-xl', 'is-l', 'is-m')
      })

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

  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: updateTicks,
    onEnter: updateTicks,
    onEnterBack: updateTicks,
  })

  updateTicks()
}

function initWorkTeamSection(section) {
  if (!section) return

  const items = Array.from(
    section.querySelectorAll('.scroll-list .scroll-item')
  )
  if (items.length) {
    const spans = items
      .map((el) => el.querySelector('.body-xl, .body-xxl, .body-next'))
      .filter(Boolean)

    spans.forEach((span) => {
      span.classList.remove('is-active')
      const dimClass = span.classList.contains('is-o-15')
        ? 'is-o-15'
        : 'is-o-20'
      span.dataset.dimClass = dimClass
      if (
        !span.classList.contains('is-o-15') &&
        !span.classList.contains('is-o-20')
      ) {
        span.classList.add(dimClass)
      }
    })

    let currentActive = null
    const activateSpan = (span) => {
      if (!span) return
      if (currentActive && currentActive !== span) {
        currentActive.classList.remove('is-active')
        const prevDim = currentActive.dataset.dimClass || 'is-o-20'
        if (!currentActive.classList.contains(prevDim))
          currentActive.classList.add(prevDim)
      }
      const dim = span.dataset.dimClass || 'is-o-20'
      if (span.classList.contains(dim)) span.classList.remove(dim)
      span.classList.add('is-active')
      currentActive = span
    }
    const deactivateSpan = (span) => {
      if (!span) return
      span.classList.remove('is-active')
      const dim = span.dataset.dimClass || 'is-o-20'
      if (!span.classList.contains(dim)) span.classList.add(dim)
      if (currentActive === span) currentActive = null
    }
    items.forEach((item, index) => {
      const span = spans[index]
      if (!span) return
      ScrollTrigger.create({
        trigger: item,
        start: 'top center',
        end: 'bottom center',
        onToggle(self) {
          if (self.isActive) {
            activateSpan(span)
          } else if (currentActive === span) {
            const isLast = index === items.length - 1
            const isFirst = index === 0
            // Keep last active when scrolling down past the list
            if (isLast && self.direction > 0) return
            // Keep first active when scrolling up past the list
            if (isFirst && self.direction < 0) return
            deactivateSpan(span)
          }
        },
      })
    })

    // Initial: first item active on page load/entering from above
    if (spans[0]) activateSpan(spans[0])

    // Section-level guard: maintain boundary actives
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => {
        if (spans[0]) activateSpan(spans[0])
      },
      onEnterBack: () => {
        if (spans[spans.length - 1]) activateSpan(spans[spans.length - 1])
      },
      onLeave: () => {
        if (spans[spans.length - 1]) activateSpan(spans[spans.length - 1])
      },
      onLeaveBack: () => {
        if (spans[0]) activateSpan(spans[0])
      },
    })
  }

  const indicators = Array.from(
    section.querySelectorAll('.content_column > .scroll-indicator')
  )
  if (indicators.length) {
    buildAllIndicators(indicators)
    setupTickHighlighting(section, indicators)

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

function initEquitySlider(section) {
  if (!section) return
  const column = section.querySelector('.equity-slider_slide_column')
  if (!column) return

  gsap.set(column, { yPercent: 0 })

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: section,
      start: 'top bottom', // begins when top reaches viewport bottom (no anim in first 100vh)
      end: '+=200%', // 0-1: hold (no-op), 1-2: animate like before
      scrub: true,
    },
  })
  // Hold for first 100vh (no-op), then animate column to -50% over next 100vh
  tl.to(column, { yPercent: -50, duration: 1 }, 1)

  // Circle tick reveal (like minerals): drive conic mask arc (start/end) in two phases
  const darkSvg = section.querySelector('.circle.is-2')
  if (darkSvg) {
    const maskCSS =
      'conic-gradient(from 0deg at 50% 50%, transparent 0deg var(--start, 0deg), #fff var(--start, 0deg) var(--end, 0deg), transparent var(--end, 0deg) 360deg)'
    darkSvg.style.webkitMaskImage = maskCSS
    darkSvg.style.maskImage = maskCSS
    darkSvg.style.maskMode = 'luminance'
    darkSvg.style.webkitMaskRepeat = 'no-repeat'
    darkSvg.style.maskRepeat = 'no-repeat'
    darkSvg.style.webkitMaskPosition = 'center'
    darkSvg.style.maskPosition = 'center'
    darkSvg.style.setProperty('--start', '0deg')
    darkSvg.style.setProperty('--end', '0deg')
    darkSvg.style.willChange = 'transform, -webkit-mask-image, mask-image'

    // Color active ticks to var(--accent)
    try {
      const accent = 'var(--accent)'
      const lines = darkSvg.querySelectorAll('line')
      lines.forEach((ln) => {
        ln.style.stroke = accent
      })
    } catch (e) {
      // ignore
    }

    const arc = { start: 0, end: 0 }
    tl.to(
      arc,
      {
        end: 126, // 35% of 360°
        duration: 0.5,
        onUpdate: () => {
          try {
            darkSvg.style.setProperty('--start', arc.start + 'deg')
            darkSvg.style.setProperty('--end', arc.end + 'deg')
          } catch (e) {
            // ignore
          }
        },
      },
      0 // animate immediately when section enters view
    )
    tl.to(
      arc,
      {
        start: 234, // 65%
        end: 360, // continue to 100%
        duration: 1, // across the next 100vh
        onUpdate: () => {
          try {
            darkSvg.style.setProperty('--start', arc.start + 'deg')
            darkSvg.style.setProperty('--end', arc.end + 'deg')
          } catch (e) {
            // ignore
          }
        },
      },
      1
    )
  }

  const labels = Array.from(
    section.querySelectorAll('.equity-slider_slide.is-2 .body-l')
  )
  if (labels.length) {
    gsap.set(labels, { yPercent: 0 })
    // Animate labels over the second phase
    tl.to(labels, { yPercent: -100, duration: 1 }, 1)
  }
}

export function initTeam(root = document) {
  const teamSection = (root || document).querySelector('.section_work-team')
  if (teamSection) initWorkTeamSection(teamSection)

  const equityInner = (root || document).querySelector('.equity-inner')
  if (equityInner) initEquitySlider(equityInner)

  // Abbreviate eyebrows in positions section (first word → 3 letters)
  const positionsSection = (root || document).querySelector(
    '.section_positions'
  )
  if (positionsSection) abbreviatePositionsEyebrows(positionsSection)
}

function abbreviatePositionsEyebrows(section) {
  try {
    const eyebrowElements = Array.from(
      section.querySelectorAll('.sissmac-row .eyebrow-wrapper .eyebrow-m')
    )
    if (!eyebrowElements.length) return
    eyebrowElements.forEach((element) => {
      if (element.dataset.abbrevApplied === '1') return
      const originalText = element.textContent || ''
      if (!originalText.trim()) return
      const match = originalText.match(/^(\s*)(\S+)([\s\S]*)$/)
      if (!match) return
      const prefix = match[1] || ''
      const firstWord = match[2] || ''
      const tail = match[3] || ''
      const abbreviated = firstWord.slice(0, 3)
      let result = prefix + abbreviated + tail
      // Insert a line break after the first comma
      result = result.replace(/,\s*/, ',<br> ')
      element.innerHTML = result
      element.dataset.abbrevApplied = '1'
    })
  } catch (e) {
    // ignore
  }
}
