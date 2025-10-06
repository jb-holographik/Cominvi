import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
const easeCurve = 'M0,0 C0.6,0 0,1 1,1'

/**
 * Creates a full-viewport overlay (z-index 999) containing an SVG clipPath.
 * The clip rectangle animates from 50% x 50% to 80% x 80% (centered).
 *
 * Returns an object with elements and timeline so the caller can control/cleanup.
 */
export function createViewportClipOverlay(options = {}) {
  const { repeat = 0, yoyo = false } = options
  // Reuse if already created to keep it in DOM between transitions
  try {
    const existing = document.querySelector('.mask-overlay')
    if (existing && existing.__overlay) {
      try {
        // Debug: existing overlay present
        console.debug('[mask-overlay] reuse existing', {
          left: existing.style.left,
          display: existing.style.display,
          zIndex: existing.style.zIndex,
          rect: existing.getBoundingClientRect(),
        })
      } catch (e) {
        // ignore
      }
      return {
        container: existing,
        wrap: existing.__overlay.wrap,
        maskFill: existing.__overlay.maskFill,
        overlay: existing.__overlay.overlay,
        svg: existing.__overlay.svg,
        tl: existing.__overlay.tl,
      }
    }
  } catch (err) {
    // ignore
  }

  const overlay = document.createElement('div')
  overlay.className = 'viewport-clip-overlay'
  Object.assign(overlay.style, {
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    backgroundColor: 'var(--accent)',
  })

  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')
  svg.setAttribute('xmlns', svgNS)
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.position = 'absolute'
  svg.style.inset = '0'
  svg.style.pointerEvents = 'none'

  const defs = document.createElementNS(svgNS, 'defs')
  const clipPath = document.createElementNS(svgNS, 'clipPath')
  const clipId = `overlay-clip-${Date.now()}-${Math.floor(
    Math.random() * 10000
  )}`
  clipPath.setAttribute('id', clipId)
  // Use objectBoundingBox so path coords are 0..1
  clipPath.setAttribute('clipPathUnits', 'objectBoundingBox')

  // Use a path with even-odd rule (outer full-rect minus inner rounded rect) so the clip creates a HOLE
  const ringPath = document.createElementNS(svgNS, 'path')
  try {
    ringPath.setAttribute('clip-rule', 'evenodd')
  } catch (e) {
    // ignore
  }
  // Compute fixed top offset in em => fraction of viewport height
  let rootFontPx = 16
  try {
    const fs = window.getComputedStyle(document.documentElement).fontSize
    rootFontPx = parseFloat(fs) || rootFontPx
  } catch (err) {
    // ignore
  }
  const topOffsetPx = 12.5 * rootFontPx
  const sideMarginPx = 2 * rootFontPx

  // Geometry will be computed after the container is created and appended
  clipPath.appendChild(ringPath)
  defs.appendChild(clipPath)
  svg.appendChild(defs)
  overlay.appendChild(svg)
  // Apply the clipPath to the overlay itself so the inner rect is a HOLE (pierces the overlay)
  overlay.style.clipPath = `url(#${clipId})`
  overlay.style.webkitClipPath = `url(#${clipId})`

  // Build the requested DOM structure wrapper: .mask-overlay > .mask-overlay_wrap > (.mask-fill, .viewport-clip-overlay)
  const container = document.createElement('div')
  container.className = 'mask-overlay'
  // Base styles now defined in CSS (style.css). Only set class here.
  // .mask-overlay default: z-index:-1; display:none; etc.
  const wrap = document.createElement('div')
  wrap.className = 'mask-overlay_wrap'
  Object.assign(wrap.style, {
    display: 'flex',
    justifyContent: 'flex-start',
    // Avoid vertical centering that would shift the clip
    alignItems: 'flex-start',
    height: '100%',
    width: '100%',
  })
  const maskFill = document.createElement('div')
  maskFill.className = 'overlay-mask-fill'
  Object.assign(maskFill.style, {
    height: '100%',
    width: '100vw',
    flex: '0 0 100vw',
    backgroundColor: 'var(--accent)',
  })
  container.appendChild(wrap)
  wrap.appendChild(maskFill)
  wrap.appendChild(overlay)
  try {
    overlay.style.flex = '0 0 100vw'
  } catch (e) {
    // ignore
  }
  document.body.appendChild(container)
  try {
    // Debug: created overlay
    console.debug('[mask-overlay] created', {
      left: container.style.left,
      display: container.style.display,
      zIndex: container.style.zIndex,
      rect: container.getBoundingClientRect(),
    })
  } catch (e) {
    // ignore
  }

  // Create a fixed, horizontally centered page-info inside the overlay
  // Positioned 4.5em from the top of the viewport
  let pageInfoClone = null
  try {
    const pageInfo = document.querySelector('.page-info')
    if (pageInfo) {
      pageInfoClone = pageInfo.cloneNode(true)
      try {
        pageInfoClone.setAttribute('aria-hidden', 'true')
      } catch (e) {
        // ignore
      }
      pageInfoClone.className = 'page-info mask-overlay_page-info'
      Object.assign(pageInfoClone.style, {
        position: 'fixed',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
        pointerEvents: 'none',
      })
      container.appendChild(pageInfoClone)
    }
  } catch (e) {
    // ignore clone errors
  }

  // Compute geometry based on actual overlay size (not window), then build TL
  const rect1 = container.getBoundingClientRect()
  const overlayW = Math.max(1, rect1.width || window.innerWidth || 1)
  const overlayH = Math.max(1, rect1.height || window.innerHeight || 1)
  const xFrac = Math.max(0, Math.min(1, sideMarginPx / overlayW))
  const widthFrac = Math.max(0, Math.min(1, 1 - 2 * (sideMarginPx / overlayW)))
  const yFrac = Math.max(0, Math.min(1, topOffsetPx / overlayH))
  const startH = Math.max(0, Math.min(1, 1 - yFrac))
  const rxFracX = Math.max(0, Math.min(1, (1 * rootFontPx) / overlayW))
  const rxFracY = Math.max(0, Math.min(1, (1 * rootFontPx) / overlayH))

  // Helper to build an even-odd ring path (outer full rect minus inner rect)
  // Top corners rounded with radius rX/rY; bottom corners square (radius 0)
  const buildD = (x, y, w, h, rX = rxFracX, rY = rxFracY) => {
    const outer = `M0,0 H1 V1 H0 Z`
    const rx = Math.max(0, Math.min(rX, Math.min(w, h) / 2))
    const ry = Math.max(0, Math.min(rY, Math.min(w, h) / 2))
    const x2 = x + w
    const y2 = y + h
    const inner = [
      `M${x + rx},${y}`,
      `H${x2 - rx}`,
      // Top-right rounded
      `A${rx},${ry} 0 0 1 ${x2},${y + ry}`,
      // Right edge straight to bottom-right (square corner)
      `V${y2}`,
      // Bottom edge straight to bottom-left (square bottom corners)
      `H${x}`,
      // Left edge up to start of top-left arc
      `V${y + rx}`,
      // Top-left rounded
      `A${rx},${ry} 0 0 1 ${x + rx},${y}`,
      'Z',
    ].join(' ')
    return `${outer} ${inner}`
  }

  // Initialize ring path to start state (hole inside)
  ringPath.setAttribute('d', buildD(xFrac, 1 - startH, widthFrac, startH))

  // Animate from: top 12.5em, left/right 2em → to: top 0, left/right 0 (full width/height)
  // Constraint: bottom must always be 0 → enforce y = 1 - h during the animation
  const tl = gsap.timeline({ repeat, yoyo })
  const animState = {
    x: xFrac,
    y: 1 - startH,
    w: widthFrac,
    h: startH,
    rX: rxFracX,
    rY: rxFracY,
  }
  // Ensure timeline starts at initial state
  tl.set({}, {}, 0)
  tl.to(animState, {
    x: 0,
    w: 1,
    h: 1,
    rX: 0,
    rY: 0,
    duration: 1.2,
    ease: gsap.parseEase(`custom(${easeCurve})`),
    onUpdate: () => {
      try {
        const derivedY = 1 - animState.h
        ringPath.setAttribute(
          'd',
          buildD(
            animState.x,
            derivedY,
            animState.w,
            animState.h,
            animState.rX,
            animState.rY
          )
        )
      } catch (e) {
        // ignore
      }
    },
  })

  // Attach refs for reuse
  try {
    container.__overlay = {
      wrap,
      maskFill,
      overlay,
      svg,
      tl,
      ringPath,
      animState,
      pageInfoClone,
    }
  } catch (err) {
    // ignore
  }
  return { container, wrap, maskFill, overlay, svg, tl }
}

// Plays the overlay rectangle clip animation exactly once from start.
// If cleanup is true, resets overlay left and removes is-active on clip completion.
export function playOverlayClipOnce(cleanup = true) {
  try {
    let overlay = document.querySelector('.mask-overlay')
    let tl = null
    if (!(overlay && overlay.__overlay && overlay.__overlay.tl)) {
      const created = createViewportClipOverlay({ repeat: 0, yoyo: false })
      overlay = created && created.container
    }
    tl = overlay && overlay.__overlay ? overlay.__overlay.tl : null
    if (!tl) return false
    // Recompute geometry with current overlay size to ensure top is exactly 12.5em
    try {
      const rect = overlay.getBoundingClientRect()
      const overlayW = Math.max(1, rect.width || window.innerWidth || 1)
      const overlayH = Math.max(1, rect.height || window.innerHeight || 1)
      let rootFontPx = 16
      try {
        const cs =
          window.getComputedStyle &&
          window.getComputedStyle(document.documentElement)
        rootFontPx = parseFloat((cs && cs.fontSize) || '16') || 16
      } catch (err) {
        // ignore
      }
      const topOffsetPx = 12.5 * (Number.isFinite(rootFontPx) ? rootFontPx : 16)
      const sideMarginPx = 2 * (Number.isFinite(rootFontPx) ? rootFontPx : 16)
      const xFrac = Math.max(0, Math.min(1, sideMarginPx / overlayW))
      const widthFrac = Math.max(
        0,
        Math.min(1, 1 - 2 * (sideMarginPx / overlayW))
      )
      const yFrac = Math.max(0, Math.min(1, topOffsetPx / overlayH))
      const startH = Math.max(0, Math.min(1, 1 - yFrac))
      // Reset ring to start geometry just before playing
      const ringPath = overlay.__overlay && overlay.__overlay.ringPath
      if (ringPath) {
        ringPath.setAttribute(
          'd',
          (function buildD(x, y, w, h, r = 0.02) {
            const outer = `M0,0 H1 V1 H0 Z`
            const rx = Math.max(0, Math.min(r, Math.min(w, h) / 2))
            const x2 = x + w
            const y2 = y + h
            const inner = [
              `M${x + rx},${y}`,
              `H${x2 - rx}`,
              `A${rx},${rx} 0 0 1 ${x2},${y + rx}`,
              `V${y2 - rx}`,
              `A${rx},${rx} 0 0 1 ${x2 - rx},${y2}`,
              `H${x + rx}`,
              `A${rx},${rx} 0 0 1 ${x},${y2 - rx}`,
              `V${y + rx}`,
              `A${rx},${rx} 0 0 1 ${x + rx},${y}`,
              'Z',
            ].join(' ')
            return `${outer} ${inner}`
          })(xFrac, 1 - startH, widthFrac, startH)
        )
      }
      // Reset animState if available
      if (overlay.__overlay && overlay.__overlay.animState) {
        overlay.__overlay.animState.x = xFrac
        overlay.__overlay.animState.w = widthFrac
        overlay.__overlay.animState.h = startH
        overlay.__overlay.animState.r = 0.02
      }
    } catch (e) {
      // ignore recompute errors
    }
    if (cleanup) {
      try {
        tl.eventCallback('onComplete', () => {
          try {
            if (overlay) {
              overlay.style.left = '0px'
              if (overlay.classList) overlay.classList.remove('is-active')
            }
            try {
              const clone = overlay.querySelector('.mask-overlay_page-info')
              if (clone) clone.style.display = ''
            } catch (e) {
              // ignore
            }
            // Immediately reset geometry to base state (bottom stays 0)
            try {
              const rect = overlay.getBoundingClientRect()
              const overlayW = Math.max(1, rect.width || window.innerWidth || 1)
              const overlayH = Math.max(
                1,
                rect.height || window.innerHeight || 1
              )
              let rootFontPx2 = 16
              try {
                const cs2 =
                  window.getComputedStyle &&
                  window.getComputedStyle(document.documentElement)
                rootFontPx2 = parseFloat((cs2 && cs2.fontSize) || '16') || 16
              } catch (e2) {
                // ignore
              }
              const topOffsetPx2 =
                12.5 * (Number.isFinite(rootFontPx2) ? rootFontPx2 : 16)
              const sideMarginPx2 =
                2 * (Number.isFinite(rootFontPx2) ? rootFontPx2 : 16)
              const xFrac2 = Math.max(0, Math.min(1, sideMarginPx2 / overlayW))
              const widthFrac2 = Math.max(
                0,
                Math.min(1, 1 - 2 * (sideMarginPx2 / overlayW))
              )
              const yFrac2 = Math.max(0, Math.min(1, topOffsetPx2 / overlayH))
              const startH2 = Math.max(0, Math.min(1, 1 - yFrac2))
              const buildD2 = (x, y, w, h, r = 0.02) => {
                const outer = `M0,0 H1 V1 H0 Z`
                const rx = Math.max(0, Math.min(r, Math.min(w, h) / 2))
                const ry = rx
                const x2 = x + w
                const y2 = y + h
                const inner = [
                  `M${x + rx},${y}`,
                  `H${x2 - rx}`,
                  `A${rx},${ry} 0 0 1 ${x2},${y + ry}`,
                  `V${y2}`,
                  `H${x}`,
                  `V${y + rx}`,
                  `A${rx},${ry} 0 0 1 ${x + rx},${y}`,
                  'Z',
                ].join(' ')
                return `${outer} ${inner}`
              }
              const ringPath2 = overlay.__overlay && overlay.__overlay.ringPath
              if (ringPath2) {
                ringPath2.setAttribute(
                  'd',
                  buildD2(xFrac2, 1 - startH2, widthFrac2, startH2)
                )
              }
              if (tl && typeof tl.pause === 'function') tl.pause(0)
              if (overlay.__overlay && overlay.__overlay.animState) {
                overlay.__overlay.animState.x = xFrac2
                overlay.__overlay.animState.w = widthFrac2
                overlay.__overlay.animState.h = startH2
                overlay.__overlay.animState.r = 0.02
              }
            } catch (e3) {
              // ignore
            }
          } catch (err) {
            // ignore
          }
        })
      } catch (err) {
        // ignore
      }
    }
    try {
      tl.pause(0)
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof tl.invalidate === 'function') tl.invalidate()
    } catch (e) {
      /* ignore */
    }
    tl.play(0)
    return true
  } catch (err) {
    return false
  }
}

// Same as playOverlayClipOnce but the top offset is provided in pixels,
// typically the same value used for the current page (e.g., .page-info height)
export function playOverlayClipOnceWithTop(topPx, cleanup = true) {
  try {
    let overlay = document.querySelector('.mask-overlay')
    if (!(overlay && overlay.__overlay && overlay.__overlay.tl)) {
      const created = createViewportClipOverlay({ repeat: 0, yoyo: false })
      overlay = created && created.container
    }
    const tl = overlay && overlay.__overlay ? overlay.__overlay.tl : null
    if (!tl) return false

    // Recompute start geometry using the provided top offset (or .page-info height)
    // and actual overlay size
    try {
      const rect = overlay.getBoundingClientRect()
      const overlayW = Math.max(1, rect.width || window.innerWidth || 1)
      const overlayH = Math.max(1, rect.height || window.innerHeight || 1)
      const rootFontPx = (function () {
        try {
          const cs =
            window.getComputedStyle &&
            window.getComputedStyle(document.documentElement)
          return parseFloat((cs && cs.fontSize) || '16') || 16
        } catch (e) {
          return 16
        }
      })()
      const sideMarginPx = 2 * rootFontPx
      // Resolve topPx from DOM if not provided or zero
      let topPxResolved = Number.isFinite(topPx) && topPx > 0 ? topPx : 0
      if (!topPxResolved) {
        try {
          const pageInfo = document.querySelector('.page-info')
          const h =
            pageInfo && pageInfo.getBoundingClientRect
              ? pageInfo.getBoundingClientRect().height
              : 0
          topPxResolved =
            h && Number.isFinite(h) && h > 0 ? h : 12.5 * rootFontPx
        } catch (e) {
          topPxResolved = 12.5 * rootFontPx
        }
      }
      const xFrac = Math.max(0, Math.min(1, sideMarginPx / overlayW))
      const widthFrac = Math.max(
        0,
        Math.min(1, 1 - 2 * (sideMarginPx / overlayW))
      )
      const yFrac = Math.max(0, Math.min(1, topPxResolved / overlayH))
      const startH = Math.max(0, Math.min(1, 1 - yFrac))
      const ringPath = overlay.__overlay && overlay.__overlay.ringPath
      if (ringPath) {
        ringPath.setAttribute(
          'd',
          (function buildD(x, y, w, h, r = 0.02) {
            const outer = `M0,0 H1 V1 H0 Z`
            const rx = Math.max(0, Math.min(r, Math.min(w, h) / 2))
            const x2 = x + w
            const y2 = y + h
            const inner = [
              `M${x + rx},${y}`,
              `H${x2 - rx}`,
              `A${rx},${rx} 0 0 1 ${x2},${y + rx}`,
              `V${y2 - rx}`,
              `A${rx},${rx} 0 0 1 ${x2 - rx},${y2}`,
              `H${x + rx}`,
              `A${rx},${rx} 0 0 1 ${x},${y2 - rx}`,
              `V${y + rx}`,
              `A${rx},${rx} 0 0 1 ${x + rx},${y}`,
              'Z',
            ].join(' ')
            return `${outer} ${inner}`
          })(xFrac, 1 - startH, widthFrac, startH)
        )
      }
      if (overlay.__overlay && overlay.__overlay.animState) {
        overlay.__overlay.animState.x = xFrac
        overlay.__overlay.animState.w = widthFrac
        overlay.__overlay.animState.h = startH
        overlay.__overlay.animState.r = 0.02
      }
    } catch (e) {
      // ignore recompute errors
    }

    try {
      tl.pause(0)
    } catch (e) {
      /* ignore */
    }
    try {
      if (typeof tl.invalidate === 'function') tl.invalidate()
    } catch (e) {
      /* ignore */
    }
    // Optional cleanup when finished
    if (cleanup) {
      try {
        tl.eventCallback('onComplete', () => {
          try {
            if (overlay) {
              overlay.style.left = '0px'
              if (overlay.classList) overlay.classList.remove('is-active')
            }
          } catch (err) {
            // ignore
          }
        })
      } catch (e) {
        // ignore
      }
    }
    tl.play(0)
    return true
  } catch (err) {
    return false
  }
}

// Resets the clip rectangle to base state immediately (bottom locked to viewport bottom)
// If topPx is provided, uses that; otherwise uses .page-info height or 12.5em
export function resetOverlayClipBaseState(topPx) {
  try {
    let overlay = document.querySelector('.mask-overlay')
    if (!(overlay && overlay.__overlay)) {
      const created = createViewportClipOverlay({ repeat: 0, yoyo: false })
      overlay = created && created.container
    }
    if (!(overlay && overlay.__overlay)) return false
    const rect = overlay.getBoundingClientRect()
    const overlayW = Math.max(1, rect.width || window.innerWidth || 1)
    const overlayH = Math.max(1, rect.height || window.innerHeight || 1)
    const rootFontPx = (function () {
      try {
        const cs =
          window.getComputedStyle &&
          window.getComputedStyle(document.documentElement)
        return parseFloat((cs && cs.fontSize) || '16') || 16
      } catch (e) {
        return 16
      }
    })()
    const sideMarginPx = 2 * rootFontPx
    let topPxResolved = Number.isFinite(topPx) && topPx > 0 ? topPx : 0
    if (!topPxResolved) {
      try {
        const pageInfo = document.querySelector('.page-info')
        const h =
          pageInfo && pageInfo.getBoundingClientRect
            ? pageInfo.getBoundingClientRect().height
            : 0
        topPxResolved = h && Number.isFinite(h) && h > 0 ? h : 12.5 * rootFontPx
      } catch (e) {
        topPxResolved = 12.5 * rootFontPx
      }
    }
    const xFrac = Math.max(0, Math.min(1, sideMarginPx / overlayW))
    const widthFrac = Math.max(
      0,
      Math.min(1, 1 - 2 * (sideMarginPx / overlayW))
    )
    const yFrac = Math.max(0, Math.min(1, topPxResolved / overlayH))
    const startH = Math.max(0, Math.min(1, 1 - yFrac))
    const ringPath = overlay.__overlay && overlay.__overlay.ringPath
    if (ringPath) {
      const buildD = (x, y, w, h, r = 0.02) => {
        const outer = `M0,0 H1 V1 H0 Z`
        const rx = Math.max(0, Math.min(r, Math.min(w, h) / 2))
        const ry = rx
        const x2 = x + w
        const y2 = y + h
        const inner = [
          `M${x + rx},${y}`,
          `H${x2 - rx}`,
          `A${rx},${ry} 0 0 1 ${x2},${y + ry}`,
          `V${y2}`,
          `H${x}`,
          `V${y + rx}`,
          `A${rx},${ry} 0 0 1 ${x + rx},${y}`,
          'Z',
        ].join(' ')
        return `${outer} ${inner}`
      }
      ringPath.setAttribute('d', buildD(xFrac, 1 - startH, widthFrac, startH))
    }
    if (overlay.__overlay && overlay.__overlay.animState) {
      overlay.__overlay.animState.x = xFrac
      overlay.__overlay.animState.w = widthFrac
      overlay.__overlay.animState.h = startH
      overlay.__overlay.animState.r = 0.02
    }
    const tl = overlay.__overlay && overlay.__overlay.tl
    if (tl) {
      try {
        tl.pause(0)
      } catch (e) {
        /* ignore */
      }
      try {
        if (typeof tl.invalidate === 'function') tl.invalidate()
      } catch (e) {
        /* ignore */
      }
    }
    return true
  } catch (err) {
    return false
  }
}

// Host-based clip-path API (Option 2): apply the same even-odd clip to an arbitrary host element
export function createClipForHost(hostEl, options = {}) {
  try {
    if (!hostEl) return null
    if (hostEl.__clip && hostEl.__clip.tl) return hostEl.__clip

    const { repeat = 0, yoyo = false } = options
    const svgNS = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(svgNS, 'svg')
    svg.setAttribute('xmlns', svgNS)
    svg.setAttribute('width', '0')
    svg.setAttribute('height', '0')
    svg.style.position = 'absolute'
    svg.style.inset = '0'
    svg.style.pointerEvents = 'none'

    const defs = document.createElementNS(svgNS, 'defs')
    const clipPath = document.createElementNS(svgNS, 'clipPath')
    const clipId = `host-clip-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`
    clipPath.setAttribute('id', clipId)
    clipPath.setAttribute('clipPathUnits', 'objectBoundingBox')
    // Use a path so we can force square bottom corners and rounded top corners
    const clipPathRect = document.createElementNS(svgNS, 'path')

    // Compute base geometry from host size
    let rootFontPx = 16
    try {
      const fs = window.getComputedStyle(document.documentElement).fontSize
      rootFontPx = parseFloat(fs) || rootFontPx
    } catch (e) {
      // ignore
    }
    const topOffsetPx = 12.5 * rootFontPx
    const sideMarginPx = 2 * rootFontPx

    clipPath.appendChild(clipPathRect)
    defs.appendChild(clipPath)
    svg.appendChild(defs)
    hostEl.appendChild(svg)

    // Apply the clipPath to the host itself
    try {
      hostEl.style.clipPath = `url(#${clipId})`
      hostEl.style.webkitClipPath = `url(#${clipId})`
    } catch (e) {
      // ignore
    }

    const rect = hostEl.getBoundingClientRect()
    const hostW = Math.max(1, rect.width || window.innerWidth || 1)
    const hostH = Math.max(1, rect.height || window.innerHeight || 1)
    const xFrac = Math.max(0, Math.min(1, sideMarginPx / hostW))
    const widthFrac = Math.max(0, Math.min(1, 1 - 2 * (sideMarginPx / hostW)))
    const yFrac = Math.max(0, Math.min(1, topOffsetPx / hostH))
    const startH = Math.max(0, Math.min(1, 1 - yFrac))
    const rxFracX = Math.max(0, Math.min(1, (1 * rootFontPx) / hostW))
    const rxFracY = Math.max(0, Math.min(1, (1 * rootFontPx) / hostH))

    // Build path with rounded top, square bottom (objectBoundingBox units)
    const buildInsidePath = (x, y, w, h, rX = rxFracX, rY = rxFracY) => {
      const rx = Math.max(0, Math.min(rX, Math.min(w, h) / 2))
      const ry = Math.max(0, Math.min(rY, Math.min(w, h) / 2))
      const x2 = x + w
      const y2 = y + h
      return [
        `M${x + rx},${y}`,
        `H${x2 - rx}`,
        `A${rx},${ry} 0 0 1 ${x2},${y + ry}`,
        `V${y2}`,
        `H${x}`,
        `V${y + ry}`,
        `A${rx},${ry} 0 0 1 ${x + rx},${y}`,
        'Z',
      ].join(' ')
    }
    clipPathRect.setAttribute(
      'd',
      buildInsidePath(xFrac, 1 - startH, widthFrac, startH)
    )
    try {
      // eslint-disable-next-line no-console
      console.debug('[host-clip] created', {
        hostW,
        hostH,
        xFrac,
        widthFrac,
        startH,
        rX: rxFracX,
        rY: rxFracY,
      })
    } catch (e) {
      // ignore
    }

    const tl = gsap.timeline({ repeat, yoyo })
    const animState = {
      x: xFrac,
      y: 1 - startH,
      w: widthFrac,
      h: startH,
      rX: rxFracX,
      rY: rxFracY,
    }
    tl.set({}, {}, 0)
    tl.to(animState, {
      x: 0,
      w: 1,
      h: 1,
      rX: 0,
      rY: 0,
      duration: 1.2,
      ease: gsap.parseEase(`custom(${easeCurve})`),
      onUpdate: () => {
        try {
          const derivedY = 1 - animState.h
          clipPathRect.setAttribute(
            'd',
            buildInsidePath(
              animState.x,
              derivedY,
              animState.w,
              animState.h,
              animState.rX,
              animState.rY
            )
          )
          // eslint-disable-next-line no-console
          console.debug('[host-clip] update', {
            x: animState.x,
            y: derivedY,
            w: animState.w,
            h: animState.h,
            rX: animState.rX,
            rY: animState.rY,
          })
        } catch (e) {
          // ignore
        }
      },
    })

    hostEl.__clip = {
      svg,
      defs,
      clipPath,
      clipPathRect,
      buildInsidePath,
      tl,
      animState,
      rxFrac: rxFracX,
    }
    return hostEl.__clip
  } catch (err) {
    return null
  }
}

export function resetHostClipBaseState(hostEl, topPx) {
  try {
    if (!(hostEl && hostEl.__clip)) return false
    const rect = hostEl.getBoundingClientRect()
    const hostW = Math.max(1, rect.width || window.innerWidth || 1)
    const hostH = Math.max(1, rect.height || window.innerHeight || 1)
    const rootFontPx = (function () {
      try {
        const cs =
          window.getComputedStyle &&
          window.getComputedStyle(document.documentElement)
        return parseFloat((cs && cs.fontSize) || '16') || 16
      } catch (e) {
        return 16
      }
    })()
    const sideMarginPx = 2 * rootFontPx
    let topPxResolved = Number.isFinite(topPx) && topPx > 0 ? topPx : 0
    if (!topPxResolved) {
      try {
        const pageInfo = document.querySelector('.page-info')
        const h =
          pageInfo && pageInfo.getBoundingClientRect
            ? pageInfo.getBoundingClientRect().height
            : 0
        topPxResolved = h && Number.isFinite(h) && h > 0 ? h : 12.5 * rootFontPx
      } catch (e) {
        topPxResolved = 12.5 * rootFontPx
      }
    }
    const xFrac = Math.max(0, Math.min(1, sideMarginPx / hostW))
    const widthFrac = Math.max(0, Math.min(1, 1 - 2 * (sideMarginPx / hostW)))
    const yFrac = Math.max(0, Math.min(1, topPxResolved / hostH))
    const startH = Math.max(0, Math.min(1, 1 - yFrac))

    const clipPathRect = hostEl.__clip.clipPathRect
    if (clipPathRect && typeof hostEl.__clip.buildInsidePath === 'function') {
      clipPathRect.setAttribute(
        'd',
        hostEl.__clip.buildInsidePath(xFrac, 1 - startH, widthFrac, startH)
      )
    }
    if (hostEl.__clip.animState) {
      hostEl.__clip.animState.x = xFrac
      hostEl.__clip.animState.w = widthFrac
      hostEl.__clip.animState.h = startH
      hostEl.__clip.animState.r = hostEl.__clip.rxFrac || 0.02
    }
    const tl = hostEl.__clip.tl
    if (tl) {
      try {
        tl.pause(0)
      } catch (e) {
        // ignore
      }
      try {
        if (typeof tl.invalidate === 'function') tl.invalidate()
      } catch (e) {
        // ignore
      }
    }
    return true
  } catch (err) {
    return false
  }
}

export function playClipOnHostOnceWithTop(hostEl, topPx) {
  try {
    if (!(hostEl && hostEl.__clip && hostEl.__clip.tl)) {
      const created = createClipForHost(hostEl, { repeat: 0, yoyo: false })
      if (!created) return false
    }
    resetHostClipBaseState(hostEl, topPx)
    const tl = hostEl.__clip && hostEl.__clip.tl
    if (!tl) return false
    tl.play(0)
    return true
  } catch (err) {
    return false
  }
}

// Tween only the horizontal position of the host clip window over a duration
export function tweenHostClipSlideX(
  hostEl,
  toX,
  duration = 1.2,
  easeStr = `custom(${easeCurve})`
) {
  try {
    if (!(hostEl && hostEl.__clip && hostEl.__clip.animState)) return false
    const animState = hostEl.__clip.animState
    const clipPathRect = hostEl.__clip.clipPathRect
    const clampedToX = Math.max(0, Math.min(1, toX))
    gsap.to(animState, {
      x: clampedToX,
      duration,
      ease: gsap.parseEase(easeStr),
      onUpdate: () => {
        try {
          const derivedY = 1 - animState.h
          if (
            clipPathRect &&
            typeof hostEl.__clip.buildInsidePath === 'function'
          ) {
            clipPathRect.setAttribute(
              'd',
              hostEl.__clip.buildInsidePath(
                animState.x,
                derivedY,
                animState.w,
                animState.h,
                animState.rX,
                animState.rY
              )
            )
          }
          // eslint-disable-next-line no-console
          console.debug('[host-clip] slideX', { x: animState.x })
        } catch (e) {
          // ignore
        }
      },
    })
    return true
  } catch (err) {
    return false
  }
}
