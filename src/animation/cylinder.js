import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initCylinder(root = document) {
  const scope = root && root.querySelector ? root : document

  // Scope EVERYTHING to the first visible cylinder wrapper on the page
  const wrapper = scope.querySelector('.cylindar__wrapper')
  if (!wrapper) return
  const items = wrapper.querySelectorAll('.cylindar__text__item')
  const textWrapper = wrapper.querySelector('.cylindar__text__wrapper')
  // Some pages may not have a title element; fall back to wrapper
  const triggerEl = wrapper.querySelector('.cylindar__text') || wrapper

  if (!items || !items.length || !textWrapper || !wrapper || !triggerEl) return
  // Zones configuration (defaults): divide circle into N zones, then choose how many zones to span
  const zoneCount = (() => {
    const v = parseInt(wrapper?.dataset?.cylinderZones, 10)
    return Number.isFinite(v) && v > 0 ? v : 10
  })()
  const textZones = (() => {
    const v = parseInt(
      wrapper?.dataset?.textZones ?? wrapper?.dataset?.zones,
      10
    )
    return Number.isFinite(v) && v > 0 ? v : 7 // ≈252° by default (close to existing 250°)
  })()
  const tickZones = (() => {
    const v = parseInt(
      wrapper?.dataset?.tickZones ?? wrapper?.dataset?.textZones,
      10
    )
    return Number.isFinite(v) && v > 0 ? v : textZones
  })()
  const tickMultiplier = (() => {
    const v = parseInt(
      wrapper?.dataset?.tickMultiplier ??
        wrapper?.dataset?.tickFactor ??
        wrapper?.dataset?.tickDensity,
      10
    )
    return Number.isFinite(v) && v > 0 ? v : 1
  })()

  try {
    if (wrapper.__cylinderCleanup) wrapper.__cylinderCleanup()
  } catch (e) {
    // ignore
  }

  // Build dense tick rings inside scroll indicators and cache refs
  const scrollIndicators = Array.from(
    wrapper.querySelectorAll('.scroll-indicator_c')
  )

  const ensureTicks = (container, desiredCount) => {
    if (!container) return []
    // Ensure ticks are positioned relative to their left/right containers
    try {
      container.style.position = 'relative'
      container.style.transformStyle = 'preserve-3d'
      container.style.pointerEvents = 'none'
    } catch (e) {
      // ignore
    }

    // Create or clone a base tick element
    const base =
      container.querySelector('.scroll-tick') ||
      (() => {
        const el = document.createElement('div')
        el.className = 'scroll-tick'
        return el
      })()

    // If we already have EXACTLY the desired count, reuse; otherwise rebuild
    let ticks = Array.from(container.querySelectorAll('.scroll-tick'))
    if (ticks.length === desiredCount) {
      // Ensure absolute centering within the column so transforms match text origin
      ticks.forEach((t) => {
        t.style.position = 'absolute'
        t.style.top = '50%'
        t.style.left = '50%'
        t.style.transformStyle = 'preserve-3d'
      })
      return ticks
    }

    // Rebuild the list to guarantee contiguous indices and consistent styling
    try {
      container.innerHTML = ''
    } catch (e) {
      // ignore
    }
    const frag = document.createDocumentFragment()
    for (let i = 0; i < desiredCount; i += 1) {
      const tick = base.cloneNode(true)
      tick.style.position = 'absolute'
      tick.style.top = '50%'
      tick.style.left = '50%'
      tick.style.transformStyle = 'preserve-3d'
      frag.appendChild(tick)
    }
    container.appendChild(frag)
    return Array.from(container.querySelectorAll('.scroll-tick'))
  }

  // Match number of ticks to number of text items times multiplier
  const desiredTickCount = Math.max(items.length * tickMultiplier, 1)
  // Materialize ticks for each indicator now so we can position them
  const indicatorToTicks = new Map()
  scrollIndicators.forEach((ind) => {
    indicatorToTicks.set(ind, ensureTicks(ind, desiredTickCount))
  })

  const calculatePositions = () => {
    const count = items.length || 1
    const offset = 0.4
    const radius = Math.min(window.innerWidth, window.innerHeight) * offset
    const zoneAngle = 360 / zoneCount
    const textSweep = zoneAngle * textZones
    const tickSweep = zoneAngle * tickZones
    // Use identical spacing for texts/ticks when zones equal
    // 14 items => 14 slots; use sweep/(count-1) so first/last align to sweep ends
    const textSpacing = count > 1 ? textSweep / (count - 1) : textSweep

    items.forEach((item, index) => {
      const angle = (index * textSpacing * Math.PI) / 180
      const rotationAngle = index * -textSpacing
      const x = 0
      const y = Math.sin(angle) * radius
      const z = Math.cos(angle) * radius
      item.style.transform = `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, ${z}px) rotateX(${rotationAngle}deg)`
    })

    // Ticks spacing: strictly equal to texts when zones equal, else proportional
    const tickCount = desiredTickCount
    const tickSpacing =
      tickZones === textZones
        ? textSpacing / tickMultiplier
        : tickCount > 1
        ? tickSweep / (tickCount - 1)
        : tickSweep
    indicatorToTicks.forEach((ticks) => {
      ticks.forEach((tick, idx) => {
        const tAngle = (idx * tickSpacing * Math.PI) / 180
        const tRot = idx * -tickSpacing
        const x = 0
        const y = Math.sin(tAngle) * radius
        const z = Math.cos(tAngle) * radius
        tick.style.transform = `translate3d(-50%, -50%, 0) translate3d(${x}px, ${y}px, ${z}px) rotateX(${tRot}deg)`
      })
    })
  }

  calculatePositions()

  // Build a unified timeline so ticks and texts rotate together
  const tl = gsap.timeline({ defaults: { ease: 'none' } })
  // Aligner l'origine de rotation des conteneurs
  try {
    gsap.set([textWrapper, ...Array.from(scrollIndicators)], {
      transformOrigin: '50% 50% 0',
      force3D: true,
    })
  } catch (e) {
    // ignore
  }
  tl.fromTo(textWrapper, { rotateX: 0 }, { rotateX: 160 }, 0)
  // Animer aussi les conteneurs de ticks pour faire tourner l'ensemble du cylindre
  const indicatorNodes = Array.from(
    wrapper.querySelectorAll('.scroll-indicator_c')
  )
  if (indicatorNodes.length)
    tl.fromTo(indicatorNodes, { rotateX: 0 }, { rotateX: 160 }, 0)

  const trigger = ScrollTrigger.create({
    trigger: triggerEl,
    start: 'center center',
    end: '+=2000svh',
    pin: wrapper,
    // pinSpacing: false,
    scrub: true,
    animation: tl,
  })

  // Highlight: enlarge ticks closest to viewport center (like scroll-list)
  const updateTickHighlight = () => {
    const viewportCenter = window.innerHeight / 2
    // Highlight text item at viewport center with .is-active
    try {
      const textSpans = Array.from(items).map((el) =>
        el.querySelector('.body-xl, .body-xxl, .body-next')
      )
      if (textSpans.length) {
        let closestIdx = 0
        let best = Infinity
        textSpans.forEach((span, idx) => {
          if (!span) return
          const r = span.getBoundingClientRect()
          const c = r.top + r.height / 2
          const d = Math.abs(c - viewportCenter)
          if (d < best) {
            best = d
            closestIdx = idx
          }
        })
        textSpans.forEach(
          (s) => s && s.classList && s.classList.remove('is-active')
        )
        const active = textSpans[closestIdx]
        if (active) {
          active.classList.add('is-active')
          // Remove dimming combos if present when active
          active.classList.remove('is-o-15', 'is-o-20')
        }
        // Re-apply dim class to non-active items
        textSpans.forEach((s, idx) => {
          if (!s || idx === closestIdx) return
          s.classList.remove('is-active')
          if (!s.classList.contains('is-o-20')) s.classList.add('is-o-20')
        })
      }
    } catch (e) {
      // ignore
    }
    indicatorNodes.forEach((indicator) => {
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
      // Reset classes
      ticks.forEach((t) => {
        t.classList.remove('is-xxl', 'is-xl', 'is-l', 'is-m')
      })
      const add = (i, cls) => {
        if (i >= 0 && i < ticks.length) ticks[i].classList.add(cls)
      }
      add(closestIndex, 'is-xxl')
      add(closestIndex - 1, 'is-xl')
      add(closestIndex + 1, 'is-xl')
      add(closestIndex - 2, 'is-l')
      add(closestIndex + 2, 'is-l')
      add(closestIndex - 3, 'is-m')
      add(closestIndex + 3, 'is-m')
    })
  }

  // Dedicated ScrollTrigger for tick highlighting (mirrors scroll-list logic)
  const highlightTrigger = ScrollTrigger.create({
    trigger: wrapper,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: updateTickHighlight,
    onEnter: updateTickHighlight,
    onEnterBack: updateTickHighlight,
  })
  // Also tick on every RAF to keep highlight smooth while pinned
  const tickerFn = () => updateTickHighlight()
  try {
    gsap.ticker.add(tickerFn)
  } catch (e) {
    // ignore
  }
  updateTickHighlight()

  const onResize = () => calculatePositions()
  window.addEventListener('resize', onResize)

  wrapper.__cylinderCleanup = () => {
    try {
      if (trigger && typeof trigger.kill === 'function') trigger.kill()
    } catch (e) {
      // ignore
    }
    try {
      if (tl && typeof tl.kill === 'function') tl.kill()
    } catch (e) {
      // ignore
    }
    try {
      window.removeEventListener('resize', onResize)
    } catch (e) {
      // ignore
    }
    try {
      if (highlightTrigger && typeof highlightTrigger.kill === 'function')
        highlightTrigger.kill()
    } catch (e) {
      // ignore
    }
    try {
      if (tickerFn && gsap && gsap.ticker) gsap.ticker.remove(tickerFn)
    } catch (e) {
      // ignore
    }
    try {
      wrapper.__cylinderCleanup = null
    } catch (e) {
      // ignore
    }
  }
}
