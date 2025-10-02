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
      const computeAndApplyHeight = () => {
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
      }

      // Special case: images inside RTE fullwidth figures on blog
      // Ensure height is applied after the layout has stabilized on mobile
      const fullwidthFigure = img.closest(
        'figure.w-richtext-figure-type-image.w-richtext-align-fullwidth'
      )
      if (fullwidthFigure) {
        // Defer to next frames so Webflow/layout can size the figure first
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            computeAndApplyHeight()
            try {
              ScrollTrigger.refresh()
            } catch (e) {
              // ignore
            }
          })
        })

        // Install a ResizeObserver once to keep height in sync on device rotate
        if (!container.__rteFwResizeObserver) {
          try {
            const ro = new ResizeObserver(() => {
              computeAndApplyHeight()
              try {
                ScrollTrigger.refresh()
              } catch (e) {
                // ignore
              }
            })
            ro.observe(container)
            container.__rteFwResizeObserver = ro
          } catch (e) {
            // Fallback if RO is unavailable
            setTimeout(() => {
              computeAndApplyHeight()
              try {
                ScrollTrigger.refresh()
              } catch (err) {
                // ignore
              }
            }, 60)
          }
        }
      } else {
        computeAndApplyHeight()
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
      if (
        container.classList &&
        container.classList.contains('machine-card_bg')
      ) {
        img.style.width = '100%'
      } else {
        img.style.width = '120%'
      }
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

// Parallax for the article hero image (.hero_blog-img > img)
// Does not modify element sizes; only translates along Y to create depth
export function initHeroBlogImageParallax(root = document) {
  try {
    if (window.__heroBlogParallax) {
      try {
        if (window.__heroBlogParallax.scrollTrigger)
          window.__heroBlogParallax.scrollTrigger.kill()
      } catch (e) {
        // ignore
      }
      try {
        window.__heroBlogParallax.kill()
      } catch (e) {
        // ignore
      }
      window.__heroBlogParallax = null
    }
  } catch (err) {
    // ignore
  }

  const scope = root && root.querySelector ? root : document
  const hero =
    (scope.querySelector && scope.querySelector('.hero_blog-img')) ||
    document.querySelector('.hero_blog-img')
  if (!hero) return null
  const img = hero.querySelector('img')
  if (!img) return null

  const scroller = window.__lenisWrapper || undefined
  const amplitudePx = 40

  try {
    gsap.set(img, { willChange: 'transform' })
  } catch (e) {
    // ignore
  }

  // Resolve start offset once from CSS (padding-top of the section)
  let startOffsetPx = 376
  try {
    const docEl = document.documentElement
    const bodyEl = document.body
    const sectionEl =
      hero.closest('.section_hero-blog') || hero.parentElement || bodyEl

    const fsSectionStr = getComputedStyle(sectionEl).fontSize
    const fsBodyStr = getComputedStyle(bodyEl).fontSize
    const fsHtmlStr = getComputedStyle(docEl).fontSize

    const fsSection = parseFloat(fsSectionStr)
    const fsBody = parseFloat(fsBodyStr)
    const fsHtml = parseFloat(fsHtmlStr)

    const candidates = [fsSection, fsBody, fsHtml, 16]
    const baseFs = candidates.find((v) => Number.isFinite(v) && v > 0) || 16
    startOffsetPx = Math.round(baseFs * 23.5)
  } catch (e) {
    // keep fallback
  }
  const startExpr = 'top top+=' + startOffsetPx

  // Do not alter the initial position; animate from current state when start is reached
  const tween = gsap.to(img, {
    y: amplitudePx,
    ease: 'none',
    immediateRender: false,
    scrollTrigger: {
      trigger: hero,
      start: startExpr,
      end: 'bottom top',
      scrub: true,
      scroller,
    },
  })
  try {
    window.__heroBlogParallax = tween
  } catch (e) {
    // ignore
  }
  try {
    ScrollTrigger.refresh()
  } catch (e) {
    // ignore
  }
  return tween
}

// Parallax for images inside .section_next .next_background
// Makes the background image translate on scroll while preventing edge gaps
export function initNextBackgroundParallax(root = document) {
  try {
    if (
      Array.isArray(window.__nextBgParallaxTweens) &&
      window.__nextBgParallaxTweens.length
    ) {
      window.__nextBgParallaxTweens.forEach((tw) => {
        try {
          if (tw && tw.scrollTrigger) tw.scrollTrigger.kill()
          if (tw) tw.kill()
        } catch (err) {
          // ignore
        }
      })
    }
    if (window.__nextBgParallaxResizeHandler) {
      window.removeEventListener('resize', window.__nextBgParallaxResizeHandler)
    }
  } catch (e) {
    // ignore
  }

  const scope = root && root.querySelector ? root : document
  const wrappers = scope.querySelectorAll('.section_next .next_background')
  if (!wrappers.length) {
    window.__nextBgParallaxTweens = []
    return []
  }

  const scroller = window.__lenisWrapper || undefined
  const tweens = []

  const layoutWrapper = (bg) => {
    try {
      const section = bg.closest('.section_next') || bg.parentElement
      const cs = window.getComputedStyle(bg)
      if (cs.position === 'static') bg.style.position = 'absolute'
      bg.style.inset = '0%'
      bg.style.overflow = 'hidden'
      // Align with hero logic: animate the wrapper with a base scale(1.2)
      gsap.set(bg, {
        transformOrigin: '50% 50%',
        willChange: 'transform',
        scale: 1.2,
      })
      return section || bg
    } catch (e) {
      return bg
    }
  }

  const ensureLaidOut = (bg) => layoutWrapper(bg)

  wrappers.forEach((bg) => {
    try {
      const triggerEl = ensureLaidOut(bg) || bg
      let baseY = Number(gsap.getProperty(bg, 'y')) || 0
      const tween = gsap.to(bg, {
        y: () => baseY + 40,
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
            baseY = Number(gsap.getProperty(bg, 'y')) || 0
          },
        },
      })
      tweens.push(tween)
    } catch (err) {
      // ignore per-image failure
    }
  })

  const resizeHandler = () => {
    wrappers.forEach((bg) => layoutWrapper(bg))
    ScrollTrigger.refresh()
  }
  let resizeTimer
  window.__nextBgParallaxResizeHandler = () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(resizeHandler, 100)
  }
  window.addEventListener('resize', window.__nextBgParallaxResizeHandler)

  window.__nextBgParallaxTweens = tweens
  ScrollTrigger.refresh()
  return tweens
}
