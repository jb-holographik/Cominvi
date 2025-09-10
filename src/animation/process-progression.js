import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function initProcessProgression(root = document) {
  const section =
    root.querySelector('.section_process') ||
    document.querySelector('.section_process')
  if (!section) return

  const sticky = section.querySelector('.process-progression-inner')
  const track = section.querySelector('.process-progression')
  if (!sticky || !track) return

  // Clean up any existing triggers from a previous page to avoid duplicates
  try {
    const wrapEl =
      section.querySelector('.process-progression-wrap') ||
      sticky.parentElement ||
      section
    const all = ScrollTrigger.getAll()
    all.forEach((st) => {
      try {
        if (
          st &&
          st.vars &&
          (st.vars.trigger === wrapEl || st.vars.trigger === sticky)
        ) {
          st.kill()
        }
      } catch (e) {
        // ignore
      }
    })
  } catch (e) {
    // ignore
  }

  // Optional number track and readout (support both 'process' and 'procress' typos)
  const numberTrack =
    section.querySelector('.process-progression_number') ||
    section.querySelector('.procress-progression_number') ||
    null
  let numberInner = null
  if (numberTrack) {
    numberInner = numberTrack.querySelector('.process-progression_number-inner')
    if (!numberInner) {
      numberInner = numberTrack.querySelector(
        '.procress-progression_number-inner'
      )
    }
  }
  let progressReadout = section.querySelector(
    '.process-progression #process-progress'
  )
  if (!progressReadout) {
    progressReadout = section.querySelector(
      '.procress-progression #process-progress'
    )
  }
  if (!progressReadout) {
    progressReadout = section.querySelector('#process-progress')
  }

  // Ensure the number indicator can move using absolute positioning
  try {
    if (numberTrack && !numberTrack.style.position) {
      numberTrack.style.position = 'relative'
    }
    if (numberInner) {
      numberInner.style.position = 'absolute'
      numberInner.style.left = '0%'
      numberInner.style.top = '50%'
      numberInner.style.transform = 'translateY(-50%)'
      numberInner.style.willChange = 'left'
    }
  } catch (e) {
    // ignore
  }

  try {
    track.style.height = '100%'
    track.style.flexDirection = 'row'
    track.style.justifyContent = 'flex-start'
    track.style.alignItems = 'flex-end'
  } catch (e) {
    // ignore
  }

  buildVerticalTicks(track, sticky)

  // De-dupe resize listener across transitions
  try {
    if (window.__processResizeHandler) {
      window.removeEventListener('resize', window.__processResizeHandler)
    }
  } catch (e) {
    // ignore
  }
  let resizeTimer
  window.__processResizeHandler = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      buildVerticalTicks(track, sticky)
      ScrollTrigger.refresh()
    }, 150)
  }
  window.addEventListener('resize', window.__processResizeHandler)

  setupVerticalTickHighlighting(section, sticky, track, {
    numberTrack,
    numberInner,
    progressReadout,
  })
}

function buildVerticalTicks(track, sticky) {
  const style = getComputedStyle(track)
  const gap = parseFloat(
    style.columnGap || style.getPropertyValue('column-gap') || style.gap || 0
  )

  let sample = track.querySelector('.scroll-tick.vertical')
  let createdTemp = false
  if (!sample) {
    sample = document.createElement('div')
    sample.className = 'scroll-tick vertical'
    track.appendChild(sample)
    createdTemp = true
  }

  const tickRect = sample.getBoundingClientRect()
  const tickWidth = tickRect.width || 2
  let containerWidth = track.clientWidth
  if (!containerWidth && sticky) {
    try {
      const s = getComputedStyle(sticky)
      const pl = parseFloat(s.paddingLeft || 0)
      const pr = parseFloat(s.paddingRight || 0)
      containerWidth = Math.max(0, sticky.clientWidth - pl - pr)
    } catch (e) {
      containerWidth = sticky.clientWidth || 0
    }
  }
  const perUnit = tickWidth + gap
  const count =
    perUnit > 0 ? Math.max(1, Math.floor((containerWidth + gap) / perUnit)) : 1

  track.innerHTML = ''
  const frag = document.createDocumentFragment()
  for (let i = 0; i < count; i++) {
    const t = document.createElement('div')
    t.className = 'scroll-tick vertical'
    frag.appendChild(t)
  }
  track.appendChild(frag)

  if (createdTemp) {
    // no-op
  }
}

function setupVerticalTickHighlighting(section, sticky, track, extras = {}) {
  // Map progress exactly as requested:
  // 0% when the first .process enters the viewport, stays 0 until its top hits the viewport top,
  // progresses from there, and reaches 100% when the bottom of the last .process hits the viewport bottom.

  const ticks = Array.from(track.querySelectorAll('.scroll-tick.vertical'))
  if (!ticks.length) return

  const processes = Array.from(section.querySelectorAll('.process'))
  const firstProcess = processes.length ? processes[0] : null
  const lastProcess = processes.length ? processes[processes.length - 1] : null

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

  const update = () => {
    const scrollY =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight || 0

    // Derive start and end in absolute coordinates
    let startAbs = 0
    let endAbs = 0
    if (firstProcess) {
      const r1 = firstProcess.getBoundingClientRect()
      startAbs = r1.top + scrollY // when first .process top reaches viewport top
    }
    if (lastProcess) {
      const r2 = lastProcess.getBoundingClientRect()
      const lastBottomAbs = r2.bottom + scrollY
      endAbs = lastBottomAbs - viewportH // when last .process bottom reaches viewport bottom
    }
    if (endAbs <= startAbs) endAbs = startAbs + 1 // prevent division by zero

    // Keep 0 until the first .process actually reaches the top of the viewport
    const progress = clamp01((scrollY - startAbs) / (endAbs - startAbs))

    // Highlight ticks around the current progress
    const exactIndex = progress * (ticks.length - 1)
    const activeIndex = Math.round(exactIndex)
    ticks.forEach((t) => t.classList.remove('is-xxl', 'is-xl', 'is-l', 'is-m'))
    const set = (i, cls) => {
      if (i >= 0 && i < ticks.length) ticks[i].classList.add(cls)
    }
    set(activeIndex, 'is-xxl')
    set(activeIndex - 1, 'is-xl')
    set(activeIndex + 1, 'is-xl')
    set(activeIndex - 2, 'is-l')
    set(activeIndex + 2, 'is-l')
    set(activeIndex - 3, 'is-m')
    set(activeIndex + 3, 'is-m')

    // Drive the number indicator and textual %
    try {
      const pct = Math.round(progress * 100)
      if (extras && extras.numberInner) {
        const container = extras.numberInner.parentElement
        if (container) {
          const cw =
            container.clientWidth ||
            container.getBoundingClientRect().width ||
            0
          const iw = extras.numberInner.getBoundingClientRect().width || 0
          const travel = Math.max(0, cw - iw)
          const posPx = Math.min(travel, Math.max(0, travel * progress))
          extras.numberInner.style.left = `${posPx}px`
        }
      }
      if (extras && extras.progressReadout) {
        extras.progressReadout.textContent = String(pct)
      }
    } catch (e) {
      // ignore
    }
  }

  const wrapEl =
    section.querySelector('.process-progression-wrap') ||
    sticky.parentElement ||
    section

  ScrollTrigger.create({
    trigger: wrapEl,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: () => update(),
    onEnter: () => update(),
    onEnterBack: () => update(),
    onLeave: () => update(),
    onLeaveBack: () => update(),
    // Explicitly avoid pinning to ensure no scroll blocking
    pin: false,
  })

  // Also listen to sticky position changes (smoother reaction when sticking/unsticking)
  ScrollTrigger.create({
    trigger: sticky,
    start: 'top top',
    end: () => 'bottom bottom',
    onUpdate: () => update(),
    pin: false,
  })

  update()
}
