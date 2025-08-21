import './styles/style.css'
import { initLoader } from './animation/loader.js'
import { initMinerals } from './animation/minerals.js'
import { initializeNav2 } from './animation/nav.js'
import { initializePageTransitionNav } from './animation/page-transition-nav.js'
import { initParallax } from './animation/parallax.js'
import { initScrollList } from './animation/scroll-list.js'
import { initLenis } from './animation/scroll.js'
import { initServiceCards } from './animation/service-cards.js'
import { createViewportClipOverlay } from './animation/svg-clip-overlay.js'
import { initTestimonials } from './animation/testimonials.js'
import {
  initTextDisplayReveal,
  // splitIntoWordSpans,
} from './animation/text-display-reveal.js'
import { initTextReveal } from './animation/text-reveal.js'
// (deduped)

document.addEventListener('DOMContentLoaded', () => {
  initializePageTransitionNav()
  initLoader()
  initLenis()
  initializeNav2()
  initParallax()
  initServiceCards()
  initTextReveal()
  initMinerals()
  initScrollList()
  initTestimonials()
  initTextDisplayReveal()
  // Pre-instantiate mask overlay in DOM (hidden) so it exists before any transition
  try {
    const { tl } = createViewportClipOverlay({})
    if (tl && typeof tl.pause === 'function') tl.pause(0)
  } catch (err) {
    // ignore
  }
  // Option: you can call splitIntoWordSpans here if you need a manual split elsewhere
})
