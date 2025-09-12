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
  ensureJsMap()
}
