import 'maplibre-gl/dist/maplibre-gl.css'
import './styles/style.css'
import { initAboutValuesScroll } from './animation/about-scroll.js'
import { initAbout } from './animation/about-us.js'
import { blogArticleInit } from './animation/blog-article.js'
import { initBlog } from './animation/blog.js'
import { initContact } from './animation/contact.js'
import { initCylinder } from './animation/cylinder.js'
import { initTeam } from './animation/join-the-team.js'
import { initLoader } from './animation/loader.js'
import { initMap } from './animation/map.js'
import { initMinerals } from './animation/minerals.js'
import { initializeNav2 } from './animation/nav.js'
import { initializePageTransitionNav } from './animation/page-transition-nav.js'
import {
  initParallax,
  initNextBackgroundParallax,
} from './animation/parallax.js'
import { initVideoClipStickyTransform } from './animation/process-images.js'
import { initProcessProgression } from './animation/process-progression.js'
import { initScrollList } from './animation/scroll-list.js'
import { initLenis } from './animation/scroll.js'
import { initServiceCards } from './animation/service-cards.js'
import { initIcons } from './animation/service-icons.js'
import { createViewportClipOverlay } from './animation/svg-clip-overlay.js'
import { initTechnology } from './animation/technology.js'
import { initTestimonials } from './animation/testimonials.js'
import {
  initTextDisplayReveal,
  // splitIntoWordSpans,
} from './animation/text-display-reveal.js'
import { initTextReveal } from './animation/text-reveal.js'
import { initSticky50 } from './utils/base.js'
// (deduped)

document.addEventListener('DOMContentLoaded', () => {
  try {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    // Defensive: ensure we start at top on hard loads
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  } catch (e) {
    // ignore
  }
  initializePageTransitionNav()
  initLoader()
  initLenis()
  initializeNav2()
  try {
    initCylinder(document)
  } catch (e) {
    // ignore
  }
  initParallax()
  initNextBackgroundParallax()
  initServiceCards()
  try {
    initIcons(document)
  } catch (e) {
    /* ignore */
  }
  initTextReveal()
  initMinerals()
  initScrollList()
  initProcessProgression()
  initTestimonials()
  initTextDisplayReveal()
  initVideoClipStickyTransform()
  // Sticky 50 center across site
  try {
    initSticky50(document)
  } catch (e) {
    // ignore
  }
  // Blog page behaviors (initial load)
  try {
    initBlog(document)
  } catch (e) {
    // ignore
  }
  // Blog article page behaviors (initial load)
  try {
    blogArticleInit(document)
  } catch (e) {
    // ignore
  }
  // Initialize map interactions on first load
  try {
    initMap(document)
  } catch (e) {
    // ignore
  }
  // Technology page behaviors
  try {
    initTechnology(document)
  } catch (e) {
    // ignore
  }

  // Contact page behaviors
  try {
    initContact(document)
  } catch (e) {
    // ignore
  }

  // About Us page behaviors
  try {
    initAbout(document)
  } catch (e) {
    // ignore
  }

  // About Us: values scroll ticks and active item highlighting
  try {
    initAboutValuesScroll(document)
  } catch (e) {
    // ignore
  }

  // Join the Team page behaviors
  try {
    initTeam(document)
  } catch (e) {
    // ignore
  }

  // Pre-instantiate mask overlay in DOM (hidden) so it exists before any transition
  try {
    const { tl } = createViewportClipOverlay({})
    if (tl && typeof tl.pause === 'function') tl.pause(0)
  } catch (err) {
    // ignore
  }
  // Option: you can call splitIntoWordSpans here if you need a manual split elsewhere
})
