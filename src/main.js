import './styles/style.css'
import { heroAnimation } from './animation/landing.js'
import { initMinerals } from './animation/minerals.js'
import { initializeNav2 } from './animation/nav.js'
import { initializePageTransitionNav } from './animation/page-transition-nav.js'
import { initParallax } from './animation/parallax.js'
import { initLenis } from './animation/scroll.js'
import { initServiceCards } from './animation/service-cards.js'
import { initTextReveal } from './animation/text-reveal.js'

document.addEventListener('DOMContentLoaded', () => {
  initializePageTransitionNav()
  initLenis()
  initializeNav2()
  initParallax()
  initServiceCards()
  heroAnimation()
  initTextReveal()
  initMinerals()
})
