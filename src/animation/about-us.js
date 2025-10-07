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
    const storyIntros = Array.from(root.querySelectorAll('.intro.is-story'))
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
    const videoEls = vids.map((w) => getVideoEl(w))
    const hasPlayed = new Array(vids.length).fill(false)
    const indexByWrap = new Map()
    vids.forEach((wrap, i) => wrap && indexByWrap.set(wrap, i))

    const prepareForAutoplay = (video) => {
      if (!video) return
      try {
        video.muted = true
        video.playsInline = true
      } catch (e) {
        // ignore
      }
    }

    const pauseAllExcept = (exceptIndex) => {
      for (let i = 0; i < videoEls.length; i += 1) {
        const el = videoEls[i]
        if (!el || i === exceptIndex) continue
        try {
          el.pause()
        } catch (e) {
          // ignore
        }
      }
    }

    const playAtIndex = (idx) => {
      try {
        const el = videoEls[idx]
        if (!el) return
        prepareForAutoplay(el)
        // Only reset to start on first play to avoid jumpy behavior on re-entry
        if (!hasPlayed[idx] && typeof el.currentTime === 'number') {
          el.currentTime = 0
        }
        const p = el.play()
        if (p && typeof p.then === 'function') {
          p.then(undefined, handlePlayRejection)
        }
        hasPlayed[idx] = true
        pauseAllExcept(idx)
      } catch (e) {
        // ignore
      }
    }
    if (!storyContent) return null

    let currentActive = -1
    const setActive = (idx) => {
      if (typeof idx !== 'number' || idx < 0 || idx >= vids.length) return
      if (currentActive === idx) return
      currentActive = idx
      vids.forEach((wrap, i) => {
        if (!wrap) return
        if (i === idx) fadeIn(wrap)
        else fadeOut(wrap)
      })
      playAtIndex(idx)
    }

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
      const s = getAfterIntroProgressPx()
      // Toggle 100svh on .intro.is-story when .story_intro_inner has exited the top of the viewport
      try {
        storyIntros.forEach((intro) => {
          if (!intro || !intro.style) return
          if (s > 0) intro.style.height = '100svh'
          else intro.style.height = ''
        })
      } catch (e) {
        // ignore
      }
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
      // Determine active video based on scroll progress through the 400vh story section
      try {
        const rect = storyContent.getBoundingClientRect()
        const viewportH =
          (typeof window !== 'undefined' && window.innerHeight) ||
          (document.documentElement && document.documentElement.clientHeight) ||
          0
        // Work only after intro has started
        if (viewportH > 0 && s > 0) {
          const rectHeight = rect && rect.height ? rect.height : 0
          const totalRange = Math.max(1, rectHeight - viewportH)
          const clampedTop = Math.max(-rect.top, 0)
          const scrolled = Math.min(clampedTop, totalRange)
          const segment = totalRange / vids.length
          const idx = Math.min(vids.length - 1, Math.floor(scrolled / segment))
          setActive(idx)
        }
      } catch (e) {
        // ignore
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
