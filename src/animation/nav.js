import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

import { initializeNavbarTheme as themeBase } from '../utils/base.js'

gsap.registerPlugin(CustomEase)

let linkBaseMarginsConfig = null
let lastScrollPosition = 0
const defaultLinkBaseMargins = [
  '8em',
  '11em',
  '14em',
  '10em',
  '13em',
  '16em',
  '12em',
  '15em',
  '18em',
  '21em',
  '24em',
  '27em',
]
// Récupération de la position du scroll
function getCurrentScrollPosition(contentEl) {
  if (window.lenis && typeof window.lenis.scroll === 'number') {
    return window.lenis.scroll
  }
  if (!contentEl) return 0
  const transform = getComputedStyle(contentEl).transform
  if (transform && transform !== 'none') {
    const match = transform.match(/matrix(3d)?\(([^)]+)\)/)
    if (match) {
      const nums = match[2].split(',').map((v) => parseFloat(v))
      const ty = nums.length === 16 ? nums[13] : nums[5]
      return Math.abs(ty || 0)
    }
  }
  return contentEl.scrollTop || 0
}

// Animation de l'ouverture du menu
export function initializeMenuClick(options = {}, root = document) {
  const menuElements = root.querySelectorAll('.is-menu')
  const pageWrapElement = root.querySelector('.page-wrap')
  const menuIconElement = root.querySelector('.menu-icon')
  const contentWrapElement = root.querySelector('.content-wrap')
  const brandLink = root.querySelector('.navbar > a')
  const linkAnchors = root.querySelectorAll('.links .link-item a')
  linkBaseMarginsConfig = Array.isArray(options.linkBaseMargins)
    ? options.linkBaseMargins
    : linkBaseMarginsConfig
  const menuIconBar1 = root.querySelector(
    '.menu-icon_bar.is-1, .menu-icon_bar .is-1'
  )
  const menuIconBar2 = root.querySelector(
    '.menu-icon_bar.is-2, .menu-icon_bar .is-2'
  )

  if (menuElements.length === 0 || !pageWrapElement) {
    return
  }

  const computedTop = getComputedStyle(pageWrapElement).top
  const originalTop = computedTop === 'auto' ? '0px' : computedTop
  const computedOverflow = getComputedStyle(pageWrapElement).overflow
  const originalOverflow = computedOverflow || 'visible'
  const computedBodyOverflow = getComputedStyle(document.body).overflow
  const originalBodyOverflow = computedBodyOverflow || 'visible'
  let isOpen = false
  const easeCurve = CustomEase.create('custom', 'M0,0 C0.6,0 0,1 1,1 ')
  const animationDuration = 1.2

  const ensureLinkBaseMargins = () => {
    linkAnchors.forEach((anchor, index) => {
      let configured = null
      if (
        Array.isArray(linkBaseMarginsConfig) &&
        typeof linkBaseMarginsConfig[index] === 'string'
      ) {
        configured = linkBaseMarginsConfig[index]
      } else if (typeof defaultLinkBaseMargins[index] === 'string') {
        configured = defaultLinkBaseMargins[index]
      }

      if (configured) {
        anchor.style.marginTop = configured
        if (!anchor.dataset.originalMarginTop) {
          anchor.dataset.originalMarginTop = configured
        }
      } else if (!anchor.dataset.originalMarginTop) {
        const mt = getComputedStyle(anchor).marginTop || '0px'
        anchor.dataset.originalMarginTop = mt
      }
    })
  }

  const animateMenuLinks = (tl, wasOpen) => {
    ensureLinkBaseMargins()
    if (!linkAnchors.length) return
    // Force initial margins for animation correctness
    if (wasOpen) {
      // Closing: ensure start state is marginTop: 0 before tweening back
      gsap.set(linkAnchors, { marginTop: 0 })
    } else {
      // Opening: ensure they start at original margins
      gsap.set(linkAnchors, {
        marginTop: (index, element) =>
          element.dataset.originalMarginTop || '0px',
      })
    }
    if (!wasOpen) {
      tl.to(linkAnchors, { marginTop: 0, overwrite: 'auto' }, 0)
    } else {
      tl.fromTo(
        linkAnchors,
        { marginTop: 0 },
        {
          marginTop: (index, element) =>
            element.dataset.originalMarginTop || '0px',
          overwrite: 'auto',
        },
        0
      )
    }
  }

  const handleMenuClick = () => {
    const wasOpen = isOpen
    // Toggle pt-inner on the brand link depending on intended state
    if (!wasOpen) {
      // opening → disable inner transition on brand link
      if (brandLink) brandLink.removeAttribute('pt-inner')
      // Hide page-info immediately when opening the menu (before animation)
      try {
        const pageInfo = document.querySelector('.page-info')
        if (pageInfo) pageInfo.style.display = 'none'
      } catch (err) {
        // ignore
      }
    } else {
      // closing → re-enable inner transition on brand link
      if (brandLink) brandLink.setAttribute('pt-inner', '')
    }

    const targetTop = isOpen ? originalTop : '24em'
    const targetOverflow = isOpen ? originalOverflow : 'hidden'
    const targetBodyOverflow = isOpen ? originalBodyOverflow : 'hidden'
    const targetBorderRadius = isOpen ? '0rem' : '1rem'
    const viewportWidth = window.innerWidth
    const borderGapPx = 64
    const desiredWidth = Math.max(0, viewportWidth - borderGapPx)
    const computedScaleOpen =
      viewportWidth > 0 ? desiredWidth / viewportWidth : 1
    const targetScale = isOpen ? 1 : computedScaleOpen
    const targetMenuIconGap = isOpen ? '5px' : '0px'
    const targetBar1Rotation = isOpen ? 0 : -45
    const targetBar2Rotation = isOpen ? 0 : 45

    if (!wasOpen) {
      document.documentElement.setAttribute('data-menu-open', 'true')
      if (window.__theme && typeof window.__theme.menuOpen === 'function') {
        window.__theme.menuOpen()
      }
      lastScrollPosition = getCurrentScrollPosition(contentWrapElement)
      if (window.lenis && typeof window.lenis.stop === 'function') {
        window.lenis.stop()
      }
    }

    if (contentWrapElement) {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(lastScrollPosition, {
          immediate: true,
          force: true,
        })
      } else {
        contentWrapElement.scrollTop = lastScrollPosition
      }
    }

    if (
      wasOpen &&
      window.__theme &&
      typeof window.__theme.menuCloseSamePage === 'function'
    ) {
      window.__theme.menuCloseSamePage()
    }

    const tl = gsap.timeline({
      defaults: { duration: animationDuration, ease: easeCurve },
      onComplete: () => {
        if (
          wasOpen &&
          window.lenis &&
          typeof window.lenis.start === 'function'
        ) {
          window.lenis.start()
        }
        isOpen = !isOpen
        // Ensure pt-inner reflects final menu state
        if (brandLink) {
          if (isOpen) brandLink.removeAttribute('pt-inner')
          else brandLink.setAttribute('pt-inner', '')
        }
        document.documentElement.setAttribute(
          'data-menu-open',
          isOpen ? 'true' : 'false'
        )
        // When menu opens, hide page-info if visible
        try {
          if (isOpen) {
            const pageInfo = document.querySelector('.page-info')
            if (pageInfo) pageInfo.style.display = 'none'
          }
        } catch (err) {
          // ignore
        }
      },
    })

    // Cache margins and animate menu links
    animateMenuLinks(tl, wasOpen)

    if (menuIconElement) {
      tl.to(menuIconElement, { gap: targetMenuIconGap, overwrite: 'auto' }, 0)
    }
    if (!wasOpen) {
      if (menuIconBar1) {
        tl.to(
          menuIconBar1,
          {
            top: '49%',
            rotation: targetBar1Rotation,
            transformOrigin: '50% 50%',
            overwrite: 'auto',
          },
          0
        )
      }
      if (menuIconBar2) {
        tl.to(
          menuIconBar2,
          {
            bottom: '49%',
            rotation: targetBar2Rotation,
            transformOrigin: '50% 50%',
            overwrite: 'auto',
          },
          0
        )
      }
    } else {
      if (menuIconBar1) {
        tl.to(
          menuIconBar1,
          {
            top: '42%',
            rotation: 0,
            transformOrigin: '50% 50%',
            overwrite: 'auto',
          },
          0
        )
      }
      if (menuIconBar2) {
        tl.to(
          menuIconBar2,
          {
            bottom: '42%',
            rotation: 0,
            transformOrigin: '50% 50%',
            overwrite: 'auto',
          },
          0
        )
      }
    }

    // Link animations already added above via animateMenuLinks
    tl.set(pageWrapElement, { overflow: targetOverflow }, 0)
    tl.set(document.body, { overflow: targetBodyOverflow }, 0)
    tl.set(pageWrapElement, { transformOrigin: '50% 0%' }, 0)
    tl.to(pageWrapElement, { top: targetTop, overwrite: 'auto' }, 0)
    tl.to(pageWrapElement, { scale: targetScale, overwrite: 'auto' }, 0)
    tl.to(
      pageWrapElement,
      { borderRadius: targetBorderRadius, overwrite: 'auto' },
      0
    )
  }

  menuElements.forEach((menuElement) => {
    if (menuElement.__menuHandler) {
      try {
        menuElement.removeEventListener('click', menuElement.__menuHandler)
      } catch (err) {
        // ignore
      }
    }
    menuElement.__menuHandler = handleMenuClick
    menuElement.addEventListener('click', menuElement.__menuHandler)
  })

  document.documentElement.setAttribute('data-menu-open', 'false')
  // On init (menu closed), ensure the brand link triggers inner transition
  if (brandLink) brandLink.setAttribute('pt-inner', '')
}

// Animation de scroll de la navbar
export function initializeNavbarScroll(root = document) {
  const wrapperElement = root.querySelector('.page-wrap')
  const contentElement = root.querySelector('.content-wrap')
  const navbarElement = root.querySelector('.navbar')

  if (!wrapperElement || !navbarElement) {
    return
  }

  // Cleanup previous listeners
  try {
    if (wrapperElement.__navbarScrollListener) {
      wrapperElement.removeEventListener(
        'scroll',
        wrapperElement.__navbarScrollListener
      )
    }
  } catch (err) {
    // ignore
  }
  try {
    if (
      window.lenis &&
      window.lenis.__navbarScrollListener &&
      typeof window.lenis.off === 'function'
    ) {
      window.lenis.off('scroll', window.lenis.__navbarScrollListener)
    }
  } catch (err) {
    // ignore
  }

  let previousScrollTop = getCurrentScrollPosition(
    contentElement || wrapperElement
  )

  const applyNavbarByDelta = (delta) => {
    if (delta > 2) {
      gsap.to(navbarElement, {
        duration: 0.5,
        left: '-9em',
        right: '-9em',
        pointerEvents: 'none',
        overwrite: 'auto',
      })
    } else if (delta < -2) {
      gsap.to(navbarElement, {
        duration: 0.5,
        left: '2em',
        right: '2em',
        pointerEvents: 'auto',
        overwrite: 'auto',
      })
    }
  }

  const nativeHandle = () => {
    const currentScrollTop = getCurrentScrollPosition(
      contentElement || wrapperElement
    )
    const delta = currentScrollTop - previousScrollTop
    applyNavbarByDelta(delta)
    previousScrollTop = currentScrollTop
  }

  if (window.lenis && typeof window.lenis.on === 'function') {
    const lenisHandler = (e) => {
      const current =
        e && typeof e.scroll === 'number' ? e.scroll : previousScrollTop
      const delta = current - previousScrollTop
      applyNavbarByDelta(delta)
      previousScrollTop = current
    }
    window.lenis.__navbarScrollListener = lenisHandler
    window.lenis.on('scroll', window.lenis.__navbarScrollListener)
  } else {
    const onScroll = () => requestAnimationFrame(nativeHandle)
    wrapperElement.__navbarScrollListener = onScroll
    wrapperElement.addEventListener('scroll', onScroll)
  }
}

// Direct navbar spread animation (duplicated behavior of scroll-down/up)
// isOpen: true → send navbar left/right to -8em (off edges)
// isOpen: false → bring navbar back to left/right 2em
export function animateNavbarSpreadForGrid(isOpen, root = document) {
  try {
    const navbarElement =
      root.querySelector('.navbar') || document.querySelector('.navbar')
    if (!navbarElement) return
    const cfg = isOpen
      ? { left: '-9em', right: '-9em', pointerEvents: 'none' }
      : { left: '2em', right: '2em', pointerEvents: 'auto' }
    gsap.to(navbarElement, {
      duration: 0.5,
      ease: CustomEase.create('custom', 'M0,0 C0.6,0 0,1 1,1 '),
      overwrite: 'auto',
      ...cfg,
    })
  } catch (e) {
    // ignore
  }
}

export function initializeNav2(root = document) {
  initializeMenuClick({}, root)
  initializeNavbarScroll(root)
  initializeThemeController()
  // If entering an article page, ensure navbar is reset to its default offsets
  try {
    const container = root && root.querySelector ? root : document
    const nsEl =
      (container.querySelector &&
        container.querySelector('[data-barba-namespace]')) ||
      document.querySelector('[data-barba-namespace]')
    let ns = null
    if (nsEl && nsEl.getAttribute) {
      ns = nsEl.getAttribute('data-barba-namespace')
    }
    if (ns === 'article') {
      const navbar =
        (container.querySelector && container.querySelector('.navbar')) ||
        document.querySelector('.navbar')
      if (navbar) {
        gsap.to(navbar, {
          duration: 1.2,
          ease: CustomEase.create('custom', 'M0,0 C0.6,0 0,1 1,1 '),
          left: '2em',
          right: '2em',
          pointerEvents: 'auto',
          overwrite: 'auto',
        })
      }
    }
  } catch (e) {
    // ignore
  }
}

// Ajoute l'animation de "fermeture" des liens du menu dans une timeline fournie (utile pendant la transition de page)
export function addMenuLinksCloseToTimeline(tl, label = 'lift') {
  if (!tl) return
  const linkAnchors = document.querySelectorAll('.links .link-item a')
  if (!linkAnchors || !linkAnchors.length) return
  // Assure les marges d'origine pour chaque lien
  linkAnchors.forEach((anchor) => {
    if (!anchor.dataset.originalMarginTop) {
      const mt = getComputedStyle(anchor).marginTop || '0px'
      anchor.dataset.originalMarginTop = mt
    }
  })
  const easeCurve = CustomEase.create('custom', 'M0,0 C0.6,0 0,1 1,1 ')
  // Les liens partent de marginTop: 0 (menu "ouvert") et reviennent à leur marge d'origine (menu "fermé")
  gsap.set(linkAnchors, { marginTop: 0 })
  tl.fromTo(
    linkAnchors,
    { marginTop: 0 },
    {
      marginTop: (index, element) => element.dataset.originalMarginTop || '0px',
      overwrite: 'auto',
      duration: 1.2,
      ease: easeCurve,
    },
    label
  )
}

// Gestion themes couleur
export function initializeThemeController() {
  const themes = (themeBase && themeBase.themes) || {}
  const tr = (themeBase && themeBase.transition) || { duration: 0.5 }

  let currentKey = 'white'
  let activeKey = 'white'
  let destinationKey = 'white'
  let snapshotKey = 'white'

  const navbarElement = document.querySelector('.navbar')
  const logoBgElement = document.querySelector('.logo-bg')
  const logoPathElements = document.querySelectorAll('.logo-path')
  const menuIconElement = document.querySelector('.menu-icon')
  const menuIconBars = document.querySelectorAll('.menu-icon_bar')

  const applyTheme = (key, instant = false) => {
    const t = themes[key] || themes.white || {}
    const to = { ...tr, overwrite: 'auto' }
    if (instant) {
      if (navbarElement) gsap.set(navbarElement, { color: t.navbarColor })
      if (logoBgElement) gsap.set(logoBgElement, { fill: t.logoBgFill })
      if (logoPathElements.length)
        gsap.set(logoPathElements, { fill: t.logoPathFill })
      if (menuIconElement)
        gsap.set(menuIconElement, {
          borderColor: t.menuIconBorder,
          backgroundColor: t.menuIconBg,
        })
      if (menuIconBars.length)
        gsap.set(menuIconBars, { backgroundColor: t.menuIconBarsBg })
    } else {
      if (navbarElement) gsap.to(navbarElement, { color: t.navbarColor, ...to })
      if (logoBgElement) gsap.to(logoBgElement, { fill: t.logoBgFill, ...to })
      if (logoPathElements.length)
        gsap.to(logoPathElements, { fill: t.logoPathFill, ...to })
      if (menuIconElement)
        gsap.to(menuIconElement, {
          borderColor: t.menuIconBorder,
          backgroundColor: t.menuIconBg,
          ...to,
        })
      if (menuIconBars.length)
        gsap.to(menuIconBars, { backgroundColor: t.menuIconBarsBg, ...to })
    }
    currentKey = key
  }

  const computeActiveTheme = () => {
    const sections = document.querySelectorAll('[bg]')
    if (!sections || sections.length === 0) return 'white'
    const nb = (
      document.querySelector('.navbar') || document.body
    ).getBoundingClientRect()
    for (const s of sections) {
      const r = s.getBoundingClientRect()
      if (r.top <= nb.bottom && r.bottom >= nb.top) {
        const v = (s.getAttribute('bg') || 'white').toLowerCase()
        if (themes[v]) return v
      }
    }
    return 'white'
  }

  const onScrollThemeUpdate = () => {
    if (document.documentElement.getAttribute('data-menu-open') === 'true')
      return
    const key = computeActiveTheme()
    if (key !== currentKey) {
      applyTheme(key)
    }
    activeKey = key
  }

  window.__theme = {
    get currentKey() {
      return currentKey
    },
    get activeKey() {
      return activeKey
    },
    get destinationKey() {
      return destinationKey
    },
    setDestination: (rootContainer = document) => {
      const rootEl =
        rootContainer && rootContainer.querySelector ? rootContainer : document
      const first = rootEl.querySelector('[bg]')
      let key = 'white'
      if (first) {
        const v = (first.getAttribute('bg') || 'white').toLowerCase()
        key = themes[v] ? v : 'white'
      }
      destinationKey = key
      return destinationKey
    },
    apply: (key, instant = false) => applyTheme(key, instant),
    applyDestination: (instant = false) => applyTheme(destinationKey, instant),
    compute: () => computeActiveTheme(),
    menuOpen: () => {
      snapshotKey = computeActiveTheme()
      applyTheme('menu')
    },
    menuCloseSamePage: () => {
      const latest = computeActiveTheme()
      const keyToApply = snapshotKey || latest
      applyTheme(keyToApply)
      snapshotKey = latest
    },
    bindScroll: (root = document) => {
      const scroller =
        root.querySelector && root.querySelector('.page-wrap')
          ? root.querySelector('.page-wrap')
          : window
      const handler = () => requestAnimationFrame(onScrollThemeUpdate)
      try {
        if (scroller.removeEventListener && scroller.__themeHandler) {
          scroller.removeEventListener('scroll', scroller.__themeHandler)
        }
      } catch (err) {
        // ignore
      }
      scroller.__themeHandler = handler
      if (scroller.addEventListener) {
        scroller.addEventListener('scroll', handler, { passive: true })
      }
      if (window.lenis && typeof window.lenis.on === 'function') {
        try {
          window.lenis.off('scroll', window.lenis.__themeHandler)
        } catch (err) {
          // ignore
        }
        window.lenis.__themeHandler = handler
        window.lenis.on('scroll', window.lenis.__themeHandler)
      }
      onScrollThemeUpdate()
    },
  }
  // Initial bind
  window.__theme.bindScroll(document)
  // Initial apply
  applyTheme(computeActiveTheme(), true)
}
