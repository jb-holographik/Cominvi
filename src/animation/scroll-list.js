import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

gsap.registerPlugin(ScrollTrigger)

export function initScrollList(root = document) {
  // Support multiple sections that share the same behavior
  const sections = Array.from(
    (root || document).querySelectorAll('.section_partners, .section_values')
  )
  if (!sections.length) return

  sections.forEach((section) => {
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
  })
}

function initScrollItems(section) {
  const items = Array.from(
    section.querySelectorAll('.scroll-list .scroll-item')
  )
  if (!items.length) return

  // Values section: sync descriptions visibility with active title
  const isValues = section.classList.contains('section_values')
  const descContainer = isValues ? section.querySelector('.scroll-desc') : null
  const descItems = descContainer
    ? Array.from(descContainer.querySelectorAll('.scroll-item'))
    : []
  // Initial state: all descriptions hidden via opacity only (never display:none)
  if (descItems.length) {
    descItems.forEach((el) => {
      el.style.willChange = 'opacity'
      el.style.transition = el.style.transition?.includes('opacity')
        ? el.style.transition
        : 'opacity 0.3s ease'
      el.style.opacity = '0'
      if (getComputedStyle(el).display === 'none') el.style.display = 'block'
    })
  }

  const splitAndAnimateLines = (container, skipAnimation = false) => {
    const paragraphs = Array.from(container.querySelectorAll('p'))
    const targets = paragraphs.length ? paragraphs : [container]
    targets.forEach((el) => {
      try {
        if (!el.__splitLines) {
          const split = new SplitType(el, { types: 'lines', tagName: 'span' })
          el.__splitLines = split
          el.__lines = split.lines || []
        }
        const lines = el.__lines || []
        if (lines.length) {
          // Wrap line contents in an inner span (once) and apply overflow hidden to line
          const inners = []
          lines.forEach((line) => {
            // Ensure block and overflow hidden on the line wrapper
            line.style.display = 'block'
            line.style.overflow = 'hidden'
            if (!line.__inner) {
              const inner = document.createElement('span')
              inner.className = 'line-inner'
              while (line.firstChild) inner.appendChild(line.firstChild)
              line.appendChild(inner)
              line.__inner = inner
            }
            inners.push(line.__inner)
          })
          if (skipAnimation) {
            gsap.set(inners, { display: 'block', yPercent: 0 })
          } else {
            gsap.set(inners, {
              display: 'block',
              yPercent: 100,
              willChange: 'transform',
            })
            gsap.to(inners, {
              yPercent: 0,
              duration: 0.2,
              ease: 'power1.inOut',
              stagger: 0.03,
              clearProps: 'willChange',
            })
          }
        }
      } catch (e) {
        // ignore
      }
    })
  }

  const showDescForIndex = (idx, skipAnimation = false) => {
    if (!descItems.length) return
    descItems.forEach((el, i) => {
      if (i === idx) {
        if (getComputedStyle(el).display === 'none') el.style.display = 'block'
        // Skip animation only when explicitly requested
        splitAndAnimateLines(el, skipAnimation)
        // fade in
        el.style.opacity = '1'
      } else {
        // fade out only
        el.style.opacity = '0'
      }
    })
    // Keep headings (.body-xxl, etc.) in sync with desc index
    try {
      const item = items[idx]
      const span = item
        ? item.querySelector('.body-xl, .body-xxl, .body-next')
        : null
      if (span) {
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
    } catch (e) {
      // ignore
    }
  }

  // Support different typography sizes used across sections
  const spans = items.map((el) =>
    el.querySelector('.body-xl, .body-xxl, .body-next')
  )

  // Ensure initial state: all dimmed (respect existing dim classes)
  spans.forEach((span) => {
    if (!span) return
    span.classList.remove('is-active')
    const dimClass = span.classList.contains('is-o-15') ? 'is-o-15' : 'is-o-20'
    span.dataset.dimClass = dimClass
    if (
      !span.classList.contains('is-o-15') &&
      !span.classList.contains('is-o-20')
    ) {
      span.classList.add(dimClass)
    }
  })

  let currentActive = null
  const lastIndex = items.length - 1

  // (removed unused helper)

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
            const prevDim = currentActive.dataset.dimClass || 'is-o-20'
            if (!currentActive.classList.contains(prevDim))
              currentActive.classList.add(prevDim)
          }
          const dim = span.dataset.dimClass || 'is-o-20'
          if (span.classList.contains(dim)) span.classList.remove(dim)
          span.classList.add('is-active')
          currentActive = span
          // Skip animation if: scrolling upward onto the last item, OR
          // scrolling downward onto the first item (initial downward passes)
          const skip =
            (self.direction === -1 && index === lastIndex) ||
            (self.direction === 1 && index === 0)
          showDescForIndex(index, skip)
        } else {
          // No-op on deactivate; active state is managed centrally by showDescForIndex
        }
      },
    })
  })

  // Ensure first/last desc visible when entering/leaving the section
  if (isValues && descItems.length) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      onEnter: () => {
        showDescForIndex(0, true) // arriving from top → skip first anim
      },
      onEnterBack: () => {
        showDescForIndex(lastIndex, true) // arriving from bottom → last active, skip anim
      },
      onLeave: () => {
        showDescForIndex(lastIndex) // leaving downward keeps last
      },
      onLeaveBack: () => {
        showDescForIndex(0) // leaving upward keeps first
      },
    })
  }
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
