import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

import { heroAnimation } from './landing.js'
import { addMenuLinksCloseToTimeline } from './nav.js'

gsap.registerPlugin(CustomEase)

// keep for parity with slide-scale if needed later
let lastTopOffsetPx = 0 // eslint-disable-line no-unused-vars
let baseTopPx = 0
const easeCurve = 'M0,0 C0.6,0 0,1 1,1 '

function formatNamespaceName(ns) {
  try {
    return (ns || 'home')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase())
  } catch (err) {
    return ns || 'Home'
  }
}

export function slideScaleLeave({ current }) {
  const currentPage =
    current.container.querySelector('.page-wrap') || current.container
  const rect = currentPage.getBoundingClientRect()
  lastTopOffsetPx = Math.max(0, Math.round(rect.top))
  const pageInfo = document.querySelector('.page-info')
  baseTopPx = pageInfo
    ? Math.max(0, Math.round(pageInfo.getBoundingClientRect().height))
    : 0

  // Update #page-from with current page name
  try {
    const fromEl = document.querySelector('#page-from')
    if (fromEl) {
      const ns = current.container.getAttribute('data-barba-namespace') || ''
      fromEl.textContent = formatNamespaceName(ns)
    }
  } catch (err) {
    // ignore
  }

  if (window.lenis && typeof window.lenis.stop === 'function') {
    try {
      window.lenis.stop()
    } catch (err) {
      // ignore
    }
  }

  gsap.set(current.container, {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    y: 0,
  })

  // Pre-scale like nav open, then slide
  const viewportWidth = window.innerWidth
  const targetWidth = Math.max(0, viewportWidth - 64)
  const startScale = targetWidth > 0 ? targetWidth / viewportWidth : 1
  gsap.set(currentPage, { transformOrigin: '50% 0%' })

  const tl = gsap.timeline()
  const preDur = 1.2
  const slideDur = 1.2
  // Phase 1: top + scale + radius like nav open
  tl.to(
    currentPage,
    {
      top: baseTopPx,
      scale: startScale,
      borderRadius: '1rem',
      duration: preDur,
      ease: gsap.parseEase(`custom(${easeCurve})`),
      overwrite: 'auto',
    },
    0
  )
  // Phase 2: slide out
  tl.to(currentPage, {
    xPercent: -100,
    duration: slideDur,
    ease: gsap.parseEase(`custom(${easeCurve})`),
  })
  return tl
}

export function slideScaleEnter({ next }) {
  const nextPage = next.container.querySelector('.page-wrap') || next.container

  // Update #page-to with destination page name
  try {
    const toEl = document.querySelector('#page-to')
    if (toEl) {
      const ns = next.container.getAttribute('data-barba-namespace') || ''
      toEl.textContent = formatNamespaceName(ns)
    }
  } catch (err) {
    // ignore
  }

  // Ensure next container is on top and visible while we animate its page
  gsap.set(next.container, {
    opacity: 0,
    visibility: 'hidden',
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    top: 0,
    y: 0,
  })

  const viewportWidth = window.innerWidth
  const targetWidth = Math.max(0, viewportWidth - 64)
  const startScale = targetWidth > 0 ? targetWidth / viewportWidth : 1

  // Next page starts to the right and slightly scaled, with rounded corners
  gsap.set(nextPage, { transformOrigin: '50% 0%' })
  gsap.set(nextPage, {
    scale: startScale,
    xPercent: 100,
    borderRadius: '1rem',
  })

  const tl = gsap.timeline()
  const preDur = 1.2
  const slideDur = 1.2
  // Reveal destination only when sliding starts so Phase 1 remains visible
  tl.set(next.container, { visibility: 'visible', opacity: 1 }, preDur)
  // Ensure destination page sits at the same top offset as the departure before descale
  tl.set(nextPage, { top: baseTopPx }, preDur)
  // Delay the incoming slide to start AFTER the current page pre-scale
  tl.to(
    nextPage,
    {
      xPercent: 0,
      duration: slideDur,
      ease: gsap.parseEase(`custom(${easeCurve})`),
    },
    preDur
  )
  tl.addLabel('lift', preDur)
  tl.addLabel('descale', preDur + slideDur)
  // Pendant la descale, refermer visuellement les liens du menu
  addMenuLinksCloseToTimeline(tl, 'lift')
  // Anime les h1 spans de la page destination en synchro (au moment du descale)
  tl.call(
    () => {
      try {
        heroAnimation(next && next.container, {
          duration: 1.2,
          ease: gsap.parseEase(`custom(${easeCurve})`),
        })
      } catch (err) {
        // ignore
      }
    },
    [],
    'descale'
  )
  // Compute and apply destination theme at the same moment bars close
  tl.call(
    () => {
      try {
        if (
          window.__theme &&
          typeof window.__theme.setDestination === 'function'
        ) {
          window.__theme.setDestination(next && next.container)
        }
        if (
          window.__theme &&
          typeof window.__theme.applyDestination === 'function'
        ) {
          window.__theme.applyDestination(false)
        }
      } catch (err) {
        // ignore
      }
    },
    [],
    'lift'
  )
  // Animate menu icon back to closed state while destination page descales
  const menuIconElement = document.querySelector('.menu-icon')
  const menuIconBar1 = document.querySelector(
    '.menu-icon_bar.is-1, .menu-icon_bar .is-1'
  )
  const menuIconBar2 = document.querySelector(
    '.menu-icon_bar.is-2, .menu-icon_bar .is-2'
  )
  if (menuIconElement) {
    tl.to(
      menuIconElement,
      {
        gap: '5px',
        duration: 1.2,
        ease: gsap.parseEase(`custom(${easeCurve})`),
      },
      'lift'
    )
  }
  if (menuIconBar1) {
    tl.to(
      menuIconBar1,
      {
        rotation: 0,
        yPercent: 0,
        top: '42%',
        duration: 1.2,
        ease: gsap.parseEase(`custom(${easeCurve})`),
      },
      'lift'
    )
  }
  if (menuIconBar2) {
    tl.to(
      menuIconBar2,
      {
        rotation: 0,
        yPercent: 0,
        bottom: '42%',
        duration: 1.2,
        ease: gsap.parseEase(`custom(${easeCurve})`),
      },
      'lift'
    )
  }
  // Animate page-info during the slide window
  tl.to(
    '.page-info_inner',
    {
      y: '-4.5em',
      duration: slideDur,
      ease: gsap.parseEase(`custom(${easeCurve})`),
    },
    'lift'
  )
  // Descale destination AFTER the slide
  tl.to(
    nextPage,
    {
      top: 0,
      borderRadius: 0,
      scale: 1,
      duration: preDur,
      ease: gsap.parseEase(`custom(${easeCurve})`),
      overwrite: 'auto',
      onComplete: () => {
        gsap.set(next.container, {
          clearProps: 'position,top,left,right,zIndex,visibility,opacity,y',
        })
        try {
          gsap.set('.page-info_inner', { y: 0 })
        } catch (err) {
          // ignore
        }
      },
    },
    preDur + slideDur
  )
  return tl
}
