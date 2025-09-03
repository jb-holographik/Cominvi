import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Initialise/rafraîchit le parallax des images (GSAP + ScrollTrigger, compatible Lenis)
export function initParallax(root = document) {
  try {
    if (
      Array.isArray(window.__parallaxTweens) &&
      window.__parallaxTweens.length
    ) {
      window.__parallaxTweens.forEach((tw) => {
        try {
          if (tw && tw.scrollTrigger) tw.scrollTrigger.kill()
          if (tw) tw.kill()
        } catch (err) {
          // ignore
        }
      })
    }
    // Detach previous resize handler if any
    if (window.__parallaxResizeHandler) {
      window.removeEventListener('resize', window.__parallaxResizeHandler)
    }
  } catch (err) {
    // ignore
  }

  const scope = root && root.querySelector ? root : document
  const images = scope.querySelectorAll('.image-p')
  if (!images.length) {
    window.__parallaxTweens = []
    return []
  }

  const scroller = window.__lenisWrapper || undefined
  const tweens = []

  const layoutImage = (img) => {
    try {
      const container =
        img.closest('.image-wrapper, .machine-card_bg') || img.parentElement
      if (!container) return null

      // Ensure container can clip the parallax overflow
      const cs = window.getComputedStyle(container)
      if (cs.position === 'static') container.style.position = 'relative'
      container.style.overflow = 'hidden'

      // Compute container height from image intrinsic ratio
      const containerWidth = container.clientWidth || img.clientWidth
      let ratio = 0
      if (img.naturalWidth && img.naturalHeight) {
        ratio = img.naturalHeight / img.naturalWidth
      } else if (img.clientWidth && img.clientHeight) {
        ratio = img.clientHeight / img.clientWidth
      } else {
        ratio = 9 / 16
      }
      if (containerWidth) {
        container.style.height = `${Math.round(containerWidth * ratio)}px`
      }

      // Image should be larger than container to avoid gaps during travel
      // Use absolute positioning + calibrated top offset so that at the
      // extreme (+A) there is no top gap. With amplitude A=10%, height is
      // (1 + 2A) and top is -(A * (1 + 2A)). For A=0.10 → height:120%, top:-12%.
      const amplitude = 10 // percent used in tween below
      const overscanFactor = 1 + (2 * amplitude) / 100 // 1.2 when A=10
      const topCompPercent = -((amplitude / 100) * overscanFactor * 100) // -12 when A=10

      img.style.position = 'absolute'
      img.style.left = '0'
      img.style.right = '0'
      img.style.top = `${topCompPercent}%`
      img.style.width = '100%'
      img.style.height = `${overscanFactor * 100}%`
      img.style.objectFit = 'cover'
      img.style.willChange = 'transform'

      return container
    } catch (e) {
      return null
    }
  }

  const ensureLaidOut = (img) => {
    if (img.complete && img.naturalWidth) {
      return layoutImage(img)
    }
    // If not loaded yet, layout once it loads
    let laidOutContainer = null
    const onLoad = () => {
      laidOutContainer = layoutImage(img)
      img.removeEventListener('load', onLoad)
      ScrollTrigger.refresh()
    }
    img.addEventListener('load', onLoad)
    return laidOutContainer
  }

  images.forEach((img) => {
    try {
      gsap.set(img, { willChange: 'transform' })

      const triggerEl = ensureLaidOut(img) || img
      const tween = gsap.fromTo(
        img,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: triggerEl,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            scroller,
          },
        }
      )
      tweens.push(tween)
    } catch (err) {
      // ignore per-image failure
    }
  })

  // Handle resize: re-layout containers and refresh triggers
  const resizeHandler = () => {
    images.forEach((img) => layoutImage(img))
    ScrollTrigger.refresh()
  }
  // Debounce a bit to avoid thrashing
  let resizeTimer
  window.__parallaxResizeHandler = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resizeHandler, 100)
  }
  window.addEventListener('resize', window.__parallaxResizeHandler)

  window.__parallaxTweens = tweens
  ScrollTrigger.refresh()
  return tweens
}

// Parallax for hero background .background-inner inside .hero-background
// Does not modify element sizes; only translates along Y to create depth
export function initHeroBackgroundParallax(root = document) {
  try {
    if (window.__heroBgParallax) {
      try {
        if (window.__heroBgParallax.scrollTrigger)
          window.__heroBgParallax.scrollTrigger.kill()
      } catch (e) {
        // ignore
      }
      try {
        window.__heroBgParallax.kill()
      } catch (e) {
        // ignore
      }
      window.__heroBgParallax = null
    }
  } catch (err) {
    // ignore
  }

  const scope = root && root.querySelector ? root : document
  const bgInner =
    (scope.querySelector &&
      scope.querySelector('.hero-background .background-inner')) ||
    document.querySelector('.hero-background .background-inner')
  if (!bgInner) return null

  const scroller = window.__lenisWrapper || undefined
  // Small translation range to avoid revealing edges while preserving size
  const amplitudePx = 40

  try {
    gsap.set(bgInner, { willChange: 'transform' })
  } catch (e) {
    // ignore
  }

  const triggerEl = bgInner.parentElement || bgInner
  let baseY = Number(gsap.getProperty(bgInner, 'y')) || 0
  const tween = gsap.to(bgInner, {
    y: () => baseY + amplitudePx,
    ease: 'none',
    immediateRender: false,
    scrollTrigger: {
      trigger: triggerEl,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      scroller,
      invalidateOnRefresh: true,
      onRefresh: () => {
        baseY = Number(gsap.getProperty(bgInner, 'y')) || 0
      },
    },
  })
  try {
    window.__heroBgParallax = tween
  } catch (e) {
    // ignore
  }
  return tween
}
