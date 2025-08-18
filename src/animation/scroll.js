import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

// Minimal Lenis + ScrollTrigger setup using .page-wrap and .content-wrap
export function initLenis(root = document) {
  const wrapper =
    root.querySelector('.page-wrap') || document.querySelector('.page-wrap')
  const content =
    root.querySelector('.content-wrap') ||
    document.querySelector('.content-wrap')
  if (!wrapper || !content) return null

  const lenis = new Lenis({ wrapper, content })
  window.lenis = lenis
  window.__lenisWrapper = wrapper

  // Synchronize Lenis with ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update)

  // Drive Lenis with GSAP's ticker
  const ticker = (time) => {
    lenis.raf(time * 1000)
  }
  gsap.ticker.add(ticker)
  gsap.ticker.lagSmoothing(0)
  window.__lenisTicker = ticker

  // Let ScrollTrigger know how to handle the custom scroller (wrapper)
  ScrollTrigger.scrollerProxy(wrapper, {
    scrollTop(value) {
      if (arguments.length) {
        try {
          lenis.scrollTo(value, { immediate: true })
        } catch (err) {
          wrapper.scrollTop = value
        }
      }
      return wrapper.scrollTop
    },
    getBoundingClientRect() {
      return {
        top: 0,
        left: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      }
    },
    pinType:
      getComputedStyle(wrapper).transform !== 'none' ? 'transform' : 'fixed',
  })

  // Default all ScrollTriggers to use the Lenis wrapper as scroller
  ScrollTrigger.defaults({ scroller: wrapper })
  ScrollTrigger.refresh()

  return lenis
}

export function destroyLenis() {
  try {
    if (window.__lenisTicker) {
      gsap.ticker.remove(window.__lenisTicker)
      window.__lenisTicker = null
    }
  } catch (err) {
    // ignore
  }
  try {
    if (window.lenis && typeof window.lenis.destroy === 'function') {
      window.lenis.destroy()
    }
  } catch (err) {
    // ignore
  }
  try {
    window.lenis = null
  } catch (err) {
    // ignore
  }
}
