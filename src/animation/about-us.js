import { initWorkshopsStickyImages } from './workshops.js'
export function initAbout(root = document) {
  // Scope to About Us page
  try {
    const container = root && root.nodeType === 1 ? root : document
    const isSelfAbout =
      container &&
      container.getAttribute &&
      container.getAttribute('data-barba-namespace') === 'About us'
    const page = isSelfAbout
      ? container
      : container.querySelector('[data-barba-namespace="About us"]')
    if (!page) return
    root = page
  } catch (err) {
    return
  }

  const withFadeHelpers = (el) => {
    if (!el) return
    try {
      const cs = window.getComputedStyle(el)
      // Ensure element is not display:none; we only animate opacity
      if (cs.display === 'none' || el.style.display === 'none') {
        el.style.display = 'block'
      }
      el.style.willChange = 'opacity'
      if (!el.style.transition || !el.style.transition.includes('opacity')) {
        el.style.transition = 'opacity 0.5s ease'
      }
      if (!el.style.opacity) el.style.opacity = '1'
    } catch (e) {
      // ignore
    }
  }

  const fadeOut = (el) => {
    if (!el) return
    try {
      el.style.opacity = '0'
    } catch (e) {
      // ignore
    }
  }

  const fadeIn = (el) => {
    if (!el) return
    try {
      // Only animate opacity; do not toggle display
      el.style.opacity = '1'
    } catch (e) {
      // ignore
    }
  }

  // Removed unused initEyebrowsStyle (dynamic handled in update)

  const initVideos = () => {
    const storyContent = root.querySelector('.story_content')
    const introInner = root.querySelector('.story_intro_inner')
    const v1 = root.querySelector('.story_videos.is-1')
    const v2 = root.querySelector('.story_videos.is-2')
    const v3 = root.querySelector('.story_videos.is-3')
    const v4 = root.querySelector('.story_videos.is-4')
    const vids = [v1, v2, v3, v4]
    vids.forEach(withFadeHelpers)
    // Ensure scroll-items on About page use opacity-only animations and never display:none
    try {
      const scrollItems = Array.from(root.querySelectorAll('.scroll-item'))
      scrollItems.forEach(withFadeHelpers)
    } catch (e) {
      // ignore
    }
    const getVideoEl = (wrap) => {
      try {
        if (!wrap) return null
        const bg = wrap.querySelector('.story_video') || wrap
        return bg ? bg.querySelector('video') : null
      } catch (e) {
        return null
      }
    }
    const handlePlayRejection = () => void 0
    const playVideo = (idx) => {
      try {
        const v = getVideoEl(vids[idx])
        if (v && typeof v.play === 'function') {
          // Defer without Promise chaining to avoid formatter/lint churn on save
          setTimeout(() => {
            try {
              const maybePromise = v.play()
              // Avoid .catch; some environments flag it in formatting rules
              if (maybePromise && typeof maybePromise.then === 'function') {
                maybePromise.then(undefined, handlePlayRejection)
              }
            } catch (err) {
              handlePlayRejection()
            }
          }, 0)
        }
      } catch (e) {
        // ignore
      }
    }
    let wasStarted = false
    const wasHidden = new Array(vids.length).fill(false)
    const hasPlayed = new Array(vids.length).fill(false)
    if (!storyContent) return null

    const getAfterIntroProgressPx = () => {
      // Start counting when the bottom of story_intro reaches the top (0)
      try {
        if (!introInner) return 0
        const r = introInner.getBoundingClientRect()
        const bottom = r.top + r.height
        return bottom <= 0 ? -bottom : 0
      } catch (e) {
        return 0
      }
    }

    const eyebrowsGroups = Array.from(
      root.querySelectorAll(
        '.intro.is-story > .eyebrows, .intro.is-story .eyebrows'
      )
    )
    // ensure transitions on eyebrows for smooth 0.5s both ways
    eyebrowsGroups.forEach((ey) => {
      try {
        ey.style.transition =
          'color 0.5s ease, background-color 0.5s ease, border-color 0.5s ease'
      } catch (e) {
        // ignore
      }
      try {
        const items = ey.querySelectorAll('.is-eyebrow')
        items.forEach((it) => {
          try {
            it.style.transition =
              'color 0.5s ease, background-color 0.5s ease, border-color 0.5s ease'
          } catch (e2) {
            // ignore
          }
        })
      } catch (e1) {
        // ignore
      }
    })
    let prevEyebrowsStarted = null

    const update = () => {
      const vh = (() => {
        try {
          const base =
            (typeof window !== 'undefined' && window.innerHeight) ||
            document.documentElement.clientHeight ||
            0
          // Some setups use rem/em scaling; prefer computed 1vh of the content itself
          const probe = document.documentElement
          const oneVh = Math.max(1, probe.clientHeight / 100)
          // If base is suspiciously small relative to computed oneVh, fallback to 100*oneVh
          if (base < oneVh * 0.5) return Math.round(oneVh * 100)
          return base
        } catch (e) {
          return 0
        }
      })()
      const s = getAfterIntroProgressPx()
      const eyebrowsStarted = s > 0
      if (prevEyebrowsStarted !== eyebrowsStarted) {
        // toggle eyebrows classes with smooth transitions
        eyebrowsGroups.forEach((ey) => {
          try {
            if (eyebrowsStarted) ey.classList.add('is-white')
            else ey.classList.remove('is-white')
          } catch (e) {
            // ignore
          }
          try {
            const items = ey.querySelectorAll('.is-eyebrow')
            const last = items && items.length ? items[items.length - 1] : null
            if (last) {
              if (eyebrowsStarted) last.classList.remove('is-black')
              else last.classList.add('is-black')
            }
          } catch (e2) {
            // ignore
          }
        })
        prevEyebrowsStarted = eyebrowsStarted
      }
      const t100 = 1 * vh
      const t200 = 2 * vh
      const t300 = 3 * vh
      const started = s > 0
      if (started && !wasStarted) {
        if (!hasPlayed[0]) {
          playVideo(0)
          hasPlayed[0] = true
        }
      }
      wasStarted = started

      const hiddenNow = [s >= t100, s >= t200, s >= t300]
      if (hiddenNow[0]) fadeOut(v1)
      else fadeIn(v1)
      if (hiddenNow[1]) fadeOut(v2)
      else fadeIn(v2)
      if (hiddenNow[2]) fadeOut(v3)
      else fadeIn(v3)
      for (let i = 0; i < hiddenNow.length; i += 1) {
        if (hiddenNow[i] && !wasHidden[i]) {
          const nextIdx = i + 1
          if (nextIdx < vids.length && !hasPlayed[nextIdx]) {
            playVideo(nextIdx)
            hasPlayed[nextIdx] = true
          }
        }
        wasHidden[i] = hiddenNow[i]
      }
    }

    update()
    const onScroll = () => update()
    const onResize = () => update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // Also listen on Lenis wrapper if present
    const scroller =
      (typeof window !== 'undefined' && window.__lenisWrapper) || null
    if (scroller && scroller.addEventListener) {
      scroller.addEventListener('scroll', onScroll, { passive: true })
    }
    // rAF loop to catch transform-driven scroll changes
    let rafId = null
    const tick = () => {
      update()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (scroller && scroller.removeEventListener) {
        scroller.removeEventListener('scroll', onScroll)
      }
      if (rafId != null) cancelAnimationFrame(rafId)
    }
  }

  try {
    initVideos()
    // Initialize workshops sticky images/texts like workshops.js
    try {
      initWorkshopsStickyImages(root)
    } catch (e2) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}
