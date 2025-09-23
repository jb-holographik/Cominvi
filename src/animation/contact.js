import gsap from 'gsap'
// Contact page initializer: Google Maps SDK only (API key required)

export function initContact(root = document) {
  const scope = root && root.querySelector ? root : document

  // Only run on Contact page
  const containerIsContact = !!(
    root &&
    root.matches &&
    root.matches('[data-barba-namespace="Contact"]')
  )
  const isContact =
    containerIsContact ||
    !!scope.querySelector('[data-barba-namespace="Contact"]')
  // eslint-disable-next-line no-console
  console.debug('[contact] initContact called', { isContact })
  if (!isContact) return

  // Iframe support removed per request; SDK only

  const getMapContainer = () => {
    try {
      return (
        (root &&
          root.querySelector &&
          root.querySelector(
            '.is-g-map.w-widget-map, .w-widget-map.is-g-map, .is-g-map'
          )) ||
        scope.querySelector(
          '.is-g-map.w-widget-map, .w-widget-map.is-g-map, .is-g-map'
        )
      )
    } catch (e) {
      return null
    }
  }

  // Pause Lenis scrolling when hovering over the map container
  const bindMapScrollPause = () => {
    try {
      const el = getMapContainer()
      if (!el) return
      if (el.__hoverScrollBound) return
      el.__hoverScrollBound = true
      const onEnter = () => {
        try {
          if (window.lenis && typeof window.lenis.stop === 'function') {
            window.lenis.stop()
          }
        } catch (err) {
          /* ignore */
        }
      }
      const onLeave = () => {
        try {
          if (window.lenis && typeof window.lenis.start === 'function') {
            window.lenis.start()
          }
        } catch (err) {
          /* ignore */
        }
      }
      el.addEventListener('pointerenter', onEnter, { passive: true })
      el.addEventListener('pointerleave', onLeave, { passive: true })
      el.addEventListener('mouseenter', onEnter, { passive: true })
      el.addEventListener('mouseleave', onLeave, { passive: true })
      el.addEventListener('touchstart', onEnter, { passive: true })
      el.addEventListener('touchend', onLeave, { passive: true })
      el.addEventListener('touchcancel', onLeave, { passive: true })
    } catch (e) {
      // ignore
    }
  }

  // Iframe reload removed

  const parseLatLng = (raw) => {
    if (!raw) return null
    try {
      const [latStr, lngStr] = String(raw).split(',')
      const lat = parseFloat((latStr || '').trim())
      const lng = parseFloat((lngStr || '').trim())
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng }
      return null
    } catch (e) {
      return null
    }
  }

  const loadGoogleMaps = (apiKey) => {
    try {
      if (window.google && window.google.maps)
        return Promise.resolve(window.google.maps)
    } catch (e) {
      // ignore
    }
    if (window.__gmapsLoadingPromise) return window.__gmapsLoadingPromise
    const params = new URLSearchParams()
    if (apiKey && String(apiKey).trim().length)
      params.set('key', String(apiKey).trim())
    params.set('v', 'weekly')
    const src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    window.__gmapsLoadingPromise = new Promise((resolve, reject) => {
      try {
        const s = document.createElement('script')
        s.src = src
        s.async = true
        s.defer = true
        s.onload = () => {
          try {
            if (window.google && window.google.maps) resolve(window.google.maps)
            else reject(new Error('google.maps not available after load'))
          } catch (e) {
            reject(e)
          }
        }
        s.onerror = () => reject(new Error('Failed to load Google Maps JS'))
        document.head.appendChild(s)
      } catch (e) {
        reject(e)
      }
    })
    return window.__gmapsLoadingPromise
  }

  const ensureJsMap = async () => {
    try {
      const container = getMapContainer()
      if (!container) return false
      // Avoid re-creating the map if it already exists (prevents flash at end of transitions)
      try {
        if (
          (container.classList && container.classList.contains('is-gmap-js')) ||
          container.__jsMapCreated
        ) {
          return true
        }
      } catch (e) {
        // ignore
      }
      const latlng = parseLatLng(
        container.getAttribute('data-widget-latlng')
      ) || {
        lat: 21.1715948,
        lng: -101.7326746,
      }
      const zoomAttr = container.getAttribute('data-widget-zoom')
      const zoom =
        zoomAttr != null && zoomAttr !== '' ? parseInt(zoomAttr, 10) : 12
      const style = (
        container.getAttribute('data-widget-style') || 'roadmap'
      ).toLowerCase()
      const apiKey =
        container.getAttribute('data-google-api-key') ||
        (window && window.__GOOGLE_MAPS_API_KEY) ||
        ''

      // If no key and no maps present, skip
      if (!(window.google && window.google.maps) && !String(apiKey).trim()) {
        return false
      }
      const gmaps = await loadGoogleMaps(apiKey)
      // Prepare container for JS map
      try {
        container.innerHTML = ''
      } catch (e) {
        // ignore
      }
      try {
        container.classList.add('is-gmap-js')
      } catch (e) {
        // ignore
      }
      const opts = {
        center: latlng,
        zoom: Number.isNaN(zoom) ? 12 : zoom,
        mapTypeId: style === 'satellite' ? 'satellite' : 'roadmap',
        disableDefaultUI: true,
        gestureHandling: 'greedy',
      }
      // eslint-disable-next-line no-new
      const map = new gmaps.Map(container, opts)
      // eslint-disable-next-line no-new
      new gmaps.Marker({ position: latlng, map })
      try {
        container.__jsMapCreated = true
      } catch (e) {
        // ignore
      }
      // eslint-disable-next-line no-console
      console.debug('[contact] JS map created')
      return true
    } catch (e) {
      // eslint-disable-next-line no-console
      console.debug('[contact] JS map error', e)
      return false
    }
  }

  // Fallback iframe removed

  // Initialize the JS Map immediately (SDK only)
  bindMapScrollPause()
  ensureJsMap()

  // On mobile, move left content inside right content after contact infos
  try {
    const isMobile =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches
    if (isMobile) {
      // Prefer generic classes if present, else fallback to contact page classes
      const contentLeft =
        (root && root.querySelector && root.querySelector('.content_left')) ||
        scope.querySelector('.content_left') ||
        (root && root.querySelector && root.querySelector('.contact_map')) ||
        scope.querySelector('.contact_map')
      const contentRight =
        (root && root.querySelector && root.querySelector('.content_right')) ||
        scope.querySelector('.content_right') ||
        (root && root.querySelector && root.querySelector('.contact_right')) ||
        scope.querySelector('.contact_right')
      const contactInfos =
        (root && root.querySelector && root.querySelector('.contact_infos')) ||
        scope.querySelector('.contact_infos')
      if (
        contentLeft &&
        contentRight &&
        contactInfos &&
        !contentLeft.__mobileReparented
      ) {
        contactInfos.insertAdjacentElement('afterend', contentLeft)
        try {
          contentLeft.__mobileReparented = true
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    // ignore
  }
}

// Sets the width of `.contact_map` to 50.8em. When provided a timeline config,
// it will animate with the same duration/ease as descale transitions.
export function initContactHero(root = document, opts = {}) {
  try {
    const scope = root && root.querySelector ? root : document
    const containerIsContact = !!(
      root &&
      root.matches &&
      root.matches('[data-barba-namespace="Contact"]')
    )
    const isContact =
      containerIsContact ||
      !!scope.querySelector('[data-barba-namespace="Contact"]')
    if (!isContact) return

    const el =
      (root &&
        root.querySelector &&
        (root.querySelector('.contact_map') ||
          root.querySelector('.contact-map'))) ||
      scope.querySelector('.contact_map') ||
      scope.querySelector('.contact-map')
    if (!el) return

    const widthValue = '50.8em'

    const duration = typeof opts.duration === 'number' ? opts.duration : 1.2
    const ease =
      opts.ease ||
      (gsap &&
        typeof gsap.parseEase === 'function' &&
        gsap.parseEase('custom(M0,0 C0.6,0 0,1 1,1 )')) ||
      undefined
    const isValidDelay =
      typeof opts.delay === 'number' &&
      Number.isFinite(opts.delay) &&
      opts.delay >= 0
    const delay = isValidDelay ? opts.delay : 0.5

    const isMobile =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 767px)').matches

    const shouldAnimate = !!(opts && opts.animate) && !isMobile

    if (shouldAnimate) {
      try {
        const computed =
          (window.getComputedStyle && window.getComputedStyle(el)) || null
        const fontSizePx = computed ? parseFloat(computed.fontSize) : 16
        const targetPx = Math.max(
          0,
          50.8 * (Number.isFinite(fontSizePx) ? fontSizePx : 16)
        )
        const currentPx =
          (el &&
            el.getBoundingClientRect &&
            el.getBoundingClientRect().width) ||
          0
        gsap.fromTo(
          el,
          { width: `${Math.max(0, Math.round(currentPx))}px` },
          {
            width: `${Math.max(0, Math.round(targetPx))}px`,
            duration,
            ease,
            overwrite: 'auto',
            delay,
          }
        )
        return
      } catch (e) {
        // fallback to immediate
      }
    }
    // On mobile, do not apply the fixed width at all
    if (!isMobile) {
      setTimeout(() => {
        el.style.width = widthValue
      }, Math.max(0, Math.round(delay * 1000)))
    }
  } catch (e) {
    // ignore
  }
}
