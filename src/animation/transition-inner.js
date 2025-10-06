import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

import { initContact, initContactHero } from './contact.js'
import { heroAnimation } from './landing.js'
import { addMenuLinksCloseToTimeline } from './nav.js'
import {
  createViewportClipOverlay,
  resetOverlayClipBaseState,
  createClipForHost,
  resetHostClipBaseState,
  tweenHostClipSlideX,
} from './svg-clip-overlay.js'

gsap.registerPlugin(CustomEase)

// keep for parity with slide-scale if needed later
let lastTopOffsetPx = 0 // eslint-disable-line no-unused-vars
let baseTopPx = 0
const easeCurve = 'M0,0 C0.6,0 0,1 1,1 '

function setMaskOverlayActive(active) {
  try {
    let container = document.querySelector('.mask-overlay')
    let created = null
    if (!container) {
      created = createViewportClipOverlay({ repeat: 0, yoyo: false })
      container = created && created.container
    }
    if (!container) return
    // Keep a global ref to overlay and its clip timeline
    try {
      const tlRef =
        (created && created.tl) ||
        (container && container.__overlay && container.__overlay.tl) ||
        (window.__maskOverlay && window.__maskOverlay.tl) ||
        null
      window.__maskOverlay = { container, tl: tlRef }
    } catch (e) {
      // ignore
    }
    if (active) {
      try {
        container.classList.add('is-active')
      } catch (e) {
        container.className += ' is-active'
      }
    } else {
      try {
        container.classList.remove('is-active')
      } catch (e) {
        container.className = container.className.replace(/\bis-active\b/, '')
      }
    }
  } catch (err) {
    // ignore
  }
}

// Track clicks on .pt-inner to control overlay display/animation
if (!window.__ptInnerClickListenerAttached) {
  window.__ptInnerClickListenerAttached = true
  const handler = (ev) => {
    try {
      const target = ev.target
      if (target && typeof target.closest === 'function') {
        const match = target.closest('.pt-inner')
        if (match) {
          window.__clickedPtInner = true
          console.debug('[mask-overlay] pointer/click on .pt-inner')
          // Reset geometry before making overlay active to ensure correct start state
          try {
            resetOverlayClipBaseState()
          } catch (e) {
            // ignore
          }
          setMaskOverlayActive(true)
          try {
            const container = document.querySelector('.mask-overlay')
            if (container) container.style.left = '0px'
            try {
              const clone = container.querySelector('.mask-overlay_page-info')
              if (clone) clone.style.display = 'flex'
            } catch (e) {
              // ignore
            }
            console.debug('[mask-overlay] immediate show on pointer', {
              display:
                (window.getComputedStyle &&
                  window.getComputedStyle(container).display) ||
                (container && container.style.display),
              zIndex:
                (window.getComputedStyle &&
                  window.getComputedStyle(container).zIndex) ||
                (container && container.style.zIndex),
            })
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }
  document.addEventListener('pointerdown', handler, true)
  document.addEventListener('mousedown', handler, true)
  document.addEventListener('touchstart', handler, {
    capture: true,
    passive: true,
  })
  document.addEventListener('click', handler, true)
}

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
    zIndex: 3,
    y: 0,
  })

  // Pre-scale like nav open, then slide
  const viewportWidth = window.innerWidth
  gsap.set(currentPage, { transformOrigin: '50% 0%' })

  const tl = gsap.timeline()
  const preDur = 1.2
  const slideDur = 1.2
  // Phase 1: top + scale + radius like nav open
  tl.to(
    currentPage,
    {
      top: baseTopPx,
      // keep scale change as previously defined by nav-open parity
      // remove if not needed
      scale:
        Math.max(0, viewportWidth - 64) > 0
          ? (viewportWidth - 64) / viewportWidth
          : 1,
      borderRadius: '1rem',
      duration: preDur,
      ease: gsap.parseEase(`custom(${easeCurve})`),
      overwrite: 'auto',
    },
    0
  )
  // Phase 2: slide out current page
  tl.to(currentPage, {
    xPercent: -100,
    duration: slideDur,
    ease: gsap.parseEase(`custom(${easeCurve})`),
  })
  // No overlay slide here; mask will be applied on destination during enter
  return tl
}

export function slideScaleEnter({ next }) {
  const nextPage = next.container.querySelector('.page-wrap') || next.container

  // Initialize Contact page SDK map as early as possible for destination
  try {
    initContact(next && next.container)
  } catch (e) {
    // ignore
  }

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

  // Destination under current
  gsap.set(next.container, {
    opacity: 1,
    visibility: 'visible',
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    top: 0,
    y: 0,
  })

  // no-op; previously used values removed
  // Prepare timeline and labels before any calls
  const tl = gsap.timeline()
  const preDur = 1.2
  const slideDur = 1.2
  tl.addLabel('lift', preDur)
  tl.addLabel('descale', preDur + slideDur)

  // Ensure the mask is applied to destination as soon as it appears (t=0)
  tl.call(
    () => {
      try {
        const host = nextPage
        if (host) {
          let tries = 0
          const maxTries = 20 // ~333ms @ 60fps
          const attemptInit = () => {
            try {
              const rect = host.getBoundingClientRect()
              const ready = rect && rect.width > 1 && rect.height > 1
              // eslint-disable-next-line no-console
              console.debug('[host-clip] layout check', {
                w: rect && rect.width,
                h: rect && rect.height,
                tries,
                ready,
              })
              if (!ready && tries < maxTries) {
                tries += 1
                return window.requestAnimationFrame(attemptInit)
              }
              const clip = createClipForHost(host, { repeat: 0, yoyo: false })
              if (clip) {
                resetHostClipBaseState(host, baseTopPx)
                // eslint-disable-next-line no-console
                console.debug('[host-clip] init@enter ready', {
                  tries,
                })
              }
            } catch (e) {
              // ignore
            }
          }
          window.requestAnimationFrame(attemptInit)
        }
      } catch (err) {
        // ignore
      }
    },
    [],
    0
  )

  // Destination appears without pre-scale or top offset (no incoming slide)
  gsap.set(nextPage, { transformOrigin: '50% 0%' })

  // Prepare and slide the clip window horizontally during 'lift'
  tl.call(
    () => {
      try {
        const host = nextPage
        if (host) {
          const clip = createClipForHost(host, { repeat: 0, yoyo: false })
          if (clip && clip.animState) {
            // Reset to base state first
            resetHostClipBaseState(host, baseTopPx)
            // Capture target base x (2em normalized)
            const targetX = clip.animState.x
            // Start from offscreen right: left = 100vw -> x = 1
            clip.animState.x = 1
            try {
              const rectEl = clip.clipRect
              if (rectEl) {
                const derivedY = 1 - clip.animState.h
                rectEl.setAttribute('x', String(clip.animState.x))
                rectEl.setAttribute('y', String(derivedY))
                rectEl.setAttribute('width', String(clip.animState.w))
                rectEl.setAttribute('height', String(clip.animState.h))
                rectEl.setAttribute('rx', String(clip.animState.r))
                rectEl.setAttribute('ry', String(clip.animState.r))
              }
            } catch (e) {
              // ignore
            }
            // Slide window from 100vw to 2em
            tweenHostClipSlideX(host, targetX, preDur, `custom(${easeCurve})`)
          }
        }
      } catch (err) {
        // ignore
      }
    },
    [],
    'lift'
  )

  // Apply clip-path directly on destination page at descale (animate to fullscreen)
  tl.call(
    () => {
      try {
        const host = nextPage
        if (host) {
          const clip = createClipForHost(host, { repeat: 0, yoyo: false })
          if (clip && clip.tl) {
            // Use baseTopPx from leave (page-info height) as the top reference
            resetHostClipBaseState(host, baseTopPx)
            clip.tl.pause(0)
            // Scale background-inner during descale
            try {
              const bgInner =
                host.querySelector('.background-inner') ||
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
                  'descale'
                )
              }
            } catch (e) {
              // ignore
            }
            try {
              clip.tl.eventCallback('onComplete', () => {
                try {
                  // Reset page-info transform only after the transition fully ends
                  gsap.set('.page-info_inner', { y: 0 })
                } catch (e) {
                  // ignore
                }
              })
            } catch (e) {
              // ignore
            }
            clip.tl.play(0)
          }
        }
      } catch (err) {
        // ignore
      }
    },
    [],
    'descale'
  )
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
        // Contact hero width adjustment at descale with matching timing/easing
        initContactHero(next && next.container, {
          animate: true,
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
  const pageInfoLiftY =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(max-width: 991px)').matches
      ? '-2.5em'
      : '-4.5em'
  tl.to(
    '.page-info_inner',
    {
      y: pageInfoLiftY,
      duration: slideDur,
      ease: gsap.parseEase(`custom(${easeCurve})`),
    },
    'lift'
  )
  // After slide window, perform cleanup without descale on destination
  tl.call(
    () => {
      try {
        gsap.set(next.container, {
          clearProps: 'position,top,left,right,zIndex,visibility,opacity,y',
        })
      } catch (e) {
        // ignore
      }
      // Keep page-info transform until it is hidden externally
      // Do NOT remove .is-active here; it is removed in the clip timeline onComplete
    },
    [],
    preDur + slideDur
  )
  return tl
}
