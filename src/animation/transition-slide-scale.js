import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

import { heroAnimation } from './landing.js'
import { addMenuLinksCloseToTimeline } from './nav.js'

gsap.registerPlugin(CustomEase)

let lastTopOffsetPx = 0
const easeCurve = 'M0,0 C0.6,0 0,1 1,1 '

export function slideScaleLeave({ current }) {
  const currentPage =
    current.container.querySelector('.page-wrap') || current.container
  const rect = currentPage.getBoundingClientRect()
  lastTopOffsetPx = Math.max(0, Math.round(rect.top))

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
    y: lastTopOffsetPx,
  })

  return gsap.to(currentPage, {
    xPercent: -100,
    duration: 1.2,
    ease: gsap.parseEase(`custom(${easeCurve})`),
  })
}

export function slideScaleEnter({ next }) {
  const nextPage = next.container.querySelector('.page-wrap') || next.container

  // Ensure next container is on top and visible while we animate its page
  gsap.set(next.container, {
    opacity: 1,
    visibility: 'visible',
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    y: lastTopOffsetPx,
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
  tl.to(nextPage, {
    xPercent: 0,
    duration: 1.2,
    ease: gsap.parseEase(`custom(${easeCurve})`),
  })
  tl.addLabel('lift')
  // Ramène la navbar à 2em/2em en synchro avec le "descale" (lift)
  let navbar = document.querySelector('.navbar')
  if (!navbar && next && next.container && next.container.querySelector) {
    navbar = next.container.querySelector('.navbar')
  }
  if (navbar) {
    tl.to(
      navbar,
      {
        left: '2em',
        right: '2em',
        pointerEvents: 'auto',
        duration: 1.2,
        ease: gsap.parseEase(`custom(${easeCurve})`),
        overwrite: 'auto',
      },
      'lift'
    )
  }
  // Normalize background-inner scale perceptually by compensating page pre-scale
  try {
    const bgInner =
      nextPage.querySelector('.background-inner') ||
      document.querySelector('.background-inner')
    if (bgInner) {
      gsap.set(bgInner, { transformOrigin: '50% 50%' })
      // Scale by 1.2 relative to perceived page scale so effect matches loader
      const targetScale = 1.2
      const compensated = targetScale // page descale will visually cancel pre-scale
      tl.to(
        bgInner,
        {
          scale: compensated,
          transformOrigin: '50% 50%',
          duration: 1.2,
          ease: gsap.parseEase(`custom(${easeCurve})`),
          overwrite: 'auto',
        },
        'lift'
      )
    }
  } catch (err) {
    // ignore
  }
  // Pendant la descale, refermer visuellement les liens du menu
  addMenuLinksCloseToTimeline(tl, 'lift')
  // Anime les h1 spans de la page destination en synchro
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
    'lift'
  )
  // Scale background-inner during descale (lift)
  try {
    const bgInner =
      nextPage.querySelector('.background-inner') ||
      document.querySelector('.background-inner')
    if (bgInner) {
      gsap.set(bgInner, { transformOrigin: '50% 50%', scale: 1 })
      tl.to(
        bgInner,
        {
          scale: 1.2,
          transformOrigin: '50% 50%',
          duration: 1.2,
          ease: gsap.parseEase(`custom(${easeCurve})`),
          overwrite: 'auto',
        },
        'lift'
      )
    }
  } catch (err) {
    // ignore
  }
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
  tl.to(
    [next.container, nextPage],
    {
      duration: 1.2,
      ease: gsap.parseEase(`custom(${easeCurve})`),
      onComplete: () => {
        gsap.set(next.container, {
          clearProps: 'position,top,left,right,zIndex,visibility,opacity,y',
        })
      },
      y: (i, target) => (target === next.container ? 0 : undefined),
      borderRadius: (i, target) => (target === nextPage ? '0rem' : undefined),
      scale: (i, target) => (target === nextPage ? 1 : undefined),
    },
    'lift'
  )
  return tl
}
