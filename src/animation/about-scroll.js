import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

gsap.registerPlugin(ScrollTrigger)

export function initAboutValuesScroll(root = document) {
  const scope = root || document
  let page = null
  try {
    const isSelfContainer =
      scope &&
      scope.getAttribute &&
      scope.getAttribute('data-barba-namespace') === 'About us' &&
      scope.getAttribute('data-barba') === 'container'
    if (isSelfContainer) {
      page = scope
    } else if (scope && scope.querySelector) {
      page = scope.querySelector(
        '[data-barba-namespace="About us"][data-barba="container"]'
      )
    }
  } catch (e) {
    // ignore
  }
  if (!page) return

  const sections = Array.from(page.querySelectorAll('.section_values'))
  if (!sections.length) return

  sections.forEach((section) => {
    const indicators = Array.from(
      section.querySelectorAll('.content_column > .scroll-indicator')
    )
    if (indicators.length) {
      // Store lightweight metadata to detect real changes and avoid unnecessary work
      const indicatorMeta = new WeakMap()
      let isRebuilding = false
      const scheduleRebuild = (() => {
        let t
        return () => {
          clearTimeout(t)
          t = setTimeout(() => {
            if (isRebuilding) return
            isRebuilding = true
            requestAnimationFrame(() => {
              const changed = buildAllIndicators(
                indicators,
                section,
                indicatorMeta
              )
              if (changed) ScrollTrigger.refresh()
              isRebuilding = false
            })
          }, 120)
        }
      })()

      buildAllIndicators(indicators, section, indicatorMeta)

      // Rebuild on resize, orientation, and after window load (images/webfonts)
      // Attach initial listeners (they may be wrapped later to also update metrics)
      window.addEventListener('resize', scheduleRebuild)
      window.addEventListener('orientationchange', scheduleRebuild)
      window.addEventListener('load', scheduleRebuild, { once: true })

      // Observe dynamic content height changes within the section
      const list = section.querySelector('.scroll-list')
      if (window.ResizeObserver && list) {
        const ro = new ResizeObserver(() => scheduleRebuild())
        ro.observe(list)
      }

      // Recalculate when the section reaches 120vh from the top of the viewport
      ScrollTrigger.create({
        trigger: section,
        start: 'top 120%',
        end: 'bottom 120%',
        onEnter: scheduleRebuild,
        onEnterBack: scheduleRebuild,
      })

      const api = setupTickHighlighting(section, indicators)

      // Wrap schedule to also recalc metrics + update once
      const wrapped = () => {
        scheduleRebuild()
        requestAnimationFrame(() => {
          api && api.recalc && api.recalc()
          api && api.update && api.update()
        })
      }
      // Add extra listeners that call wrapped (we keep the base ones as well)
      window.addEventListener('resize', wrapped)
      window.addEventListener('orientationchange', wrapped)
    }
  })
}

function buildAllIndicators(indicators, section, metaMap) {
  let anyChanged = false
  indicators.forEach((indicator) => {
    const changed = buildIndicator(indicator, section, metaMap)
    if (changed) anyChanged = true
  })
  return anyChanged
}

function buildIndicator(indicator, section, metaMap) {
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

  const tickRect = sample.getBoundingClientRect()
  const tickHeight = tickRect && tickRect.height ? tickRect.height : 0

  let containerHeight = indicator.clientHeight
  if (!containerHeight || containerHeight <= 0) {
    const r = indicator.getBoundingClientRect()
    containerHeight = (r && r.height) || 0
  }
  if (section) {
    const list = section.querySelector('.scroll-list')
    if (list) {
      const lr = list.getBoundingClientRect()
      const listH = Math.max(
        (lr && lr.height) || 0,
        list.clientHeight || 0,
        list.scrollHeight || 0
      )
      if (listH && listH > 0) containerHeight = listH
    }
  }
  if (!containerHeight || containerHeight <= tickHeight * 2) {
    let sectionH = 0
    if (section) {
      const cs = Math.max(section.clientHeight || 0, section.scrollHeight || 0)
      const rs = section.getBoundingClientRect()
      sectionH = Math.max(cs, (rs && rs.height) || 0)
    }
    let viewportH = window.innerHeight || 0
    if (!viewportH) {
      viewportH = document.documentElement
        ? document.documentElement.clientHeight
        : 0
    }
    const baseH = containerHeight || 0
    const max1 = baseH > sectionH ? baseH : sectionH
    const max2 = max1 > viewportH ? max1 : viewportH
    containerHeight = max2 > tickHeight ? max2 : tickHeight
  }

  const column = indicator.closest('.content_column')
  if (column) {
    const colRect = column.getBoundingClientRect()
    const colRectH = (colRect && colRect.height) || 0
    const colClientH = Math.max(
      column.clientHeight || 0,
      column.scrollHeight || 0
    )
    const colH = colRectH > colClientH ? colRectH : colClientH
    // Only write when meaningfully different to avoid layout thrash
    if (!colH || Math.abs(colH - containerHeight) > 2) {
      column.style.height = containerHeight + 'px'
    }
  }

  const perUnit = tickHeight + rowGap
  let count =
    perUnit > 0
      ? Math.max(1, Math.floor((containerHeight + rowGap) / perUnit))
      : 1

  // Skip rebuild if count did not change
  const prev = metaMap ? metaMap.get(indicator) : undefined
  if (!prev || prev.count !== count) {
    indicator.innerHTML = ''
    const frag = document.createDocumentFragment()
    for (let i = 0; i < count; i++) {
      const t = document.createElement('div')
      t.className = 'scroll-tick'
      frag.appendChild(t)
    }
    indicator.appendChild(frag)
    if (metaMap) metaMap.set(indicator, { count })
    return true
  }

  if (createdTemp) {
    // no-op
  }
  return false
}

function setupTickHighlighting(section, indicators) {
  const wrapper =
    document.querySelector('.page-wrap') ||
    section.closest('.page-wrap') ||
    window

  const isTabletOrMobile =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(max-width: 991px)').matches
      : false

  let cachedSVH = 0
  const measureSVH = () => {
    try {
      const el = document.createElement('div')
      el.style.position = 'fixed'
      el.style.top = '0'
      el.style.left = '0'
      el.style.height = '100svh'
      el.style.width = '0'
      el.style.pointerEvents = 'none'
      el.style.opacity = '0'
      el.style.visibility = 'hidden'
      document.documentElement.appendChild(el)
      const h = el.getBoundingClientRect().height || el.offsetHeight || 0
      el.remove()
      return h
    } catch (e) {
      return 0
    }
  }

  const refreshSVH = () => {
    cachedSVH = measureSVH()
  }

  if (isTabletOrMobile) {
    refreshSVH()
    const svhResizeHandler = () => {
      clearTimeout(svhResizeHandler._t)
      svhResizeHandler._t = setTimeout(refreshSVH, 100)
    }
    window.addEventListener('resize', svhResizeHandler)
    window.addEventListener('orientationchange', svhResizeHandler)
  }

  // Maintain only last active index per indicator; compute positions on demand
  const lastIndexByIndicator = new Map()
  let updateScheduled = false
  let forcedIndex = null
  let forceNoAnimOnce = false

  // Initial state: hide all body-s inside scroll items until activation
  try {
    const allItems = Array.from(
      section.querySelectorAll('.scroll-list .scroll-item-h')
    )
    allItems.forEach((el) => {
      const p = el.querySelector('.body-s')
      if (p) p.style.opacity = '0'
    })
    // Pre-activate first item content so it's immediately visible on arrival
    const firstItem = allItems[0]
    if (firstItem) {
      firstItem.classList.add('is-active')
      const p = firstItem.querySelector('.body-s')
      if (p) {
        try {
          p.style.opacity = '1'
          if (!p.__split) {
            p.__split = new SplitType(p, { types: 'lines', tagName: 'span' })
          }
          let lines = (p.__split && p.__split.lines) || []
          if (!lines.length) lines = [p]
          const inners = []
          lines.forEach((line) => {
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
          if (inners.length) gsap.set(inners, { yPercent: 0 })
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore
  }

  const doUpdate = () => {
    let viewportRect
    const viewportHeight =
      isTabletOrMobile && cachedSVH > 0 ? cachedSVH : window.innerHeight

    if (wrapper === window) {
      viewportRect = { top: 0, height: viewportHeight }
    } else {
      const rect = wrapper.getBoundingClientRect()
      if (isTabletOrMobile) {
        viewportRect = { top: 0, height: viewportHeight }
      } else {
        viewportRect = { top: rect.top, height: rect.height }
      }
    }
    const viewportCenter = viewportRect.top + viewportRect.height / 2

    indicators.forEach((indicator) => {
      const ticks = Array.from(indicator.querySelectorAll('.scroll-tick'))
      if (!ticks.length) return

      // Find closest tick center to viewport center
      let closestIndex = ticks.length - 1
      let closestDist = Infinity
      for (let i = 0; i < ticks.length; i++) {
        const r = ticks[i].getBoundingClientRect()
        const center = r.top + r.height / 2
        const d = Math.abs(center - viewportCenter)
        if (d < closestDist) {
          closestDist = d
          closestIndex = i
        }
      }

      // Allow forcing a specific index (e.g., when entering the section)
      const selectedIndex =
        typeof forcedIndex === 'number' ? forcedIndex : closestIndex

      const prev = lastIndexByIndicator.get(indicator)
      if (prev === selectedIndex) return
      lastIndexByIndicator.set(indicator, selectedIndex)

      // Update classes only when index changed
      ticks.forEach((tick) => {
        tick.classList.remove('is-xxl', 'is-xl', 'is-l', 'is-m')
      })
      const set = (i, cls) => {
        if (i >= 0 && i < ticks.length) ticks[i].classList.add(cls)
      }
      set(selectedIndex, 'is-xxl')
      set(selectedIndex - 1, 'is-xl')
      set(selectedIndex + 1, 'is-xl')
      set(selectedIndex - 2, 'is-l')
      set(selectedIndex + 2, 'is-l')
      set(selectedIndex - 3, 'is-m')
      set(selectedIndex + 3, 'is-m')
    })

    const items = Array.from(
      section.querySelectorAll('.scroll-list .scroll-item-h')
    )
    if (items.length) {
      let closest = { index: 0, dist: Infinity }
      items.forEach((el, idx) => {
        const r = el.getBoundingClientRect()
        const center = r.top + r.height / 2
        const d = Math.abs(center - viewportCenter)
        if (d < closest.dist) closest = { index: idx, dist: d }
      })
      const targetIndex =
        typeof forcedIndex === 'number' ? forcedIndex : closest.index
      items.forEach((el, idx) => {
        const isTarget = idx === targetIndex
        const wasActive = el.classList.contains('is-active')
        if (isTarget) {
          if (!wasActive) {
            el.classList.add('is-active')
            // Split and animate body-s lines on activation
            const p = el.querySelector('.body-s')
            if (p) {
              try {
                // Ensure paragraph is visible for the duration of the line reveal
                gsap.set(p, { opacity: 1 })
                // Split only once per paragraph
                if (!p.__split) {
                  p.__split = new SplitType(p, {
                    types: 'lines',
                    tagName: 'span',
                  })
                }
                let lines = (p.__split && p.__split.lines) || []
                const inners = []
                if (!lines.length) {
                  // Fallback: treat the whole paragraph as one line
                  lines = [p]
                }
                lines.forEach((line) => {
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
                if (forceNoAnimOnce) {
                  gsap.set(inners, { display: 'block', yPercent: 0 })
                } else {
                  gsap.set(inners, {
                    display: 'block',
                    yPercent: 100,
                    willChange: 'transform',
                  })
                  gsap.to(inners, {
                    yPercent: 0,
                    duration: 0.35,
                    ease: 'power2.out',
                    stagger: 0.06,
                    clearProps: 'willChange',
                  })
                }
              } catch (e) {
                // ignore split errors
              }
            }
          }
        } else if (wasActive) {
          el.classList.remove('is-active')
          const p = el.querySelector('.body-s')
          if (p) {
            // Hide paragraph when item is not active and reset inner transforms
            p.style.opacity = '0'
            try {
              const lines = (p.__split && p.__split.lines) || []
              const inners = lines.map((line) => line.__inner).filter(Boolean)
              if (inners.length) gsap.set(inners, { yPercent: 100 })
            } catch (e) {
              // ignore
            }
          }
        }
      })
    }
  }

  const update = () => {
    if (updateScheduled) return
    updateScheduled = true
    requestAnimationFrame(() => {
      updateScheduled = false
      doUpdate()
    })
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom -50%',
    onUpdate: update,
    onEnter: () => {
      forcedIndex = 0
      forceNoAnimOnce = true
      update()
      forcedIndex = null
      forceNoAnimOnce = false
    },
    onEnterBack: () => {
      forcedIndex = Infinity // will clamp to last by logic
      forceNoAnimOnce = true
      update()
      forcedIndex = null
      forceNoAnimOnce = false
    },
  })

  update()
  return { recalc: update, update }
}
