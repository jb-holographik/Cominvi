import './styles/style.css'
import { heroAnimation } from './animation/landing.js'
import { initLoader } from './animation/loader.js'
import { initMinerals } from './animation/minerals.js'
import { initializeNav2 } from './animation/nav.js'
import { initializePageTransitionNav } from './animation/page-transition-nav.js'
import { initParallax } from './animation/parallax.js'
import { initScrollList } from './animation/scroll-list.js'
import { initLenis } from './animation/scroll.js'
import { initServiceCards } from './animation/service-cards.js'
import { initTestimonials } from './animation/testimonials.js'
import { initTextReveal } from './animation/text-reveal.js'
// (deduped)

document.addEventListener('DOMContentLoaded', () => {
  initializePageTransitionNav()
  initLoader()
  initLenis()
  initializeNav2()
  initParallax()
  initServiceCards()
  heroAnimation()
  initTextReveal()
  initMinerals()
  initScrollList()
  initTestimonials()
})
