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

  images.forEach((img) => {
    try {
      gsap.set(img, { willChange: 'transform' })
      const tween = gsap.fromTo(
        img,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
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

  window.__parallaxTweens = tweens
  ScrollTrigger.refresh()
  return tweens
}
