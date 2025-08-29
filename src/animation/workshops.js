import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

// Positionne les .workshops_img à 2em du haut du viewport via transform,
// en les contraignant dans les limites de la section .section_workshops.

function pxFromEm(em = 2) {
  try {
    const body = document.body || document.documentElement
    const bodyFontSize = parseFloat(getComputedStyle(body).fontSize)
    if (!Number.isNaN(bodyFontSize) && bodyFontSize > 0)
      return em * bodyFontSize
    const root = document.documentElement
    const rootFontSize = parseFloat(getComputedStyle(root).fontSize)
    if (!Number.isNaN(rootFontSize) && rootFontSize > 0)
      return em * rootFontSize
  } catch (e) {
    // ignore
  }
  return em * 16
}

function getContentTopOffsetPx() {
  try {
    const wrapper =
      window.__lenisWrapper || document.querySelector('.page-wrap') || null
    if (!wrapper) return 0
    const topStr = getComputedStyle(wrapper).top
    if (!topStr || topStr === 'auto') return 0
    const topPx = parseFloat(topStr)
    return Number.isFinite(topPx) ? topPx : 0
  } catch (e) {
    return 0
  }
}

function getNodeScaleY(node) {
  try {
    const t = getComputedStyle(node).transform
    if (!t || t === 'none') return 1
    if (t.startsWith('matrix3d')) {
      const values = t
        .slice(9, -1)
        .split(',')
        .map((v) => parseFloat(v.trim()))
      if (values.length === 16) {
        const m5 = values[4]
        const m6 = values[5]
        const m7 = values[6]
        const scaleY = Math.sqrt(m5 * m5 + m6 * m6 + m7 * m7)
        return scaleY || 1
      }
      return 1
    }
    if (t.startsWith('matrix(')) {
      const values = t
        .slice(7, -1)
        .split(',')
        .map((v) => parseFloat(v.trim()))
      if (values.length >= 4) {
        const b = values[1]
        const d = values[3]
        const scaleY = Math.sqrt(b * b + d * d) || 1
        return scaleY
      }
      return 1
    }
    return 1
  } catch (e) {
    return 1
  }
}

function getEffectiveScaleY(el) {
  let scale = 1
  try {
    let node = el
    while (node && node !== document && node !== document.documentElement) {
      scale *= getNodeScaleY(node)
      node = node.parentElement || node.parentNode
    }
  } catch (e) {
    // ignore
  }
  return scale || 1
}

// Split un bloc de texte en lignes mesurées et prépare l'animation ligne par ligne
function prepareSplitLines(el) {
  try {
    if (!el || el.__splitPrepared) return
    // Convertit chaque mot en span inline-block pour mesurer les retours à la ligne
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
    const textNodes = []
    let node
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.trim() !== '') textNodes.push(node)
    }
    textNodes.forEach((tn) => {
      const parent = tn.parentNode
      const parts = tn.nodeValue.split(/(\s+)/)
      const frag = document.createDocumentFragment()
      parts.forEach((p) => {
        if (p === '') return
        if (/^\s+$/.test(p)) {
          const s = document.createElement('span')
          s.className = 'ws-space'
          s.style.display = 'inline-block'
          s.style.whiteSpace = 'pre'
          s.textContent = p
          frag.appendChild(s)
        } else {
          const w = document.createElement('span')
          w.className = 'ws-word'
          w.style.display = 'inline-block'
          w.style.whiteSpace = 'pre'
          w.textContent = p
          frag.appendChild(w)
        }
      })
      parent.replaceChild(frag, tn)
    })
    // Mesure et groupe par lignes (offsetTop)
    const tokens = Array.from(el.querySelectorAll('.ws-word, .ws-space'))
    if (!tokens.length) {
      el.__splitPrepared = true
      return
    }
    const groupsMap = new Map()
    tokens.forEach((node) => {
      const top = Math.round(node.offsetTop)
      if (!groupsMap.has(top)) groupsMap.set(top, [])
      groupsMap.get(top).push(node)
    })
    const tops = Array.from(groupsMap.keys()).sort((a, b) => a - b)
    const fragLines = document.createDocumentFragment()
    tops.forEach((t) => {
      const lineWrap = document.createElement('span')
      lineWrap.className = 'ws-line'
      lineWrap.style.display = 'block'
      lineWrap.style.overflow = 'hidden'
      const lineInner = document.createElement('span')
      lineInner.className = 'ws-line-inner'
      lineInner.style.display = 'inline-block'
      const lineWords = groupsMap.get(t)
      lineWords.forEach((w) => {
        lineInner.appendChild(w)
      })
      lineWrap.appendChild(lineInner)
      fragLines.appendChild(lineWrap)
    })
    // Remplace le contenu par les lignes construites
    el.innerHTML = ''
    el.appendChild(fragLines)
    el.__splitPrepared = true
  } catch (e) {
    // ignore
  }
}

// Calcule la translation CSS à appliquer pour amener le top à targetTop (px viewport)
function computeTranslateToTarget(el, lastCssY, targetTop, scaleY) {
  try {
    const rect = el.getBoundingClientRect()
    const prevAppliedViewportDelta = Number.isFinite(lastCssY)
      ? lastCssY * (scaleY || 1)
      : 0
    const baseTop = rect.top - prevAppliedViewportDelta
    const deltaViewport = targetTop - baseTop
    const cssY = deltaViewport / (scaleY || 1)
    const dpr = window.devicePixelRatio || 1
    return Math.round(cssY * dpr) / dpr
  } catch (e) {
    return 0
  }
}

function ensureState() {
  if (!window.__workshopsSticky) {
    window.__workshopsSticky = {
      rafId: null,
      items: new Set(),
      running: false,
      offsetPx: pxFromEm(2),
      resizeHandler: null,
      titles: [],
      descs: [],
      currentTextIndex: -1,
    }
  }
  return window.__workshopsSticky
}

function updateGreenToggle(index) {
  try {
    const toggle = document.querySelector('.toggle.is-green')
    if (!toggle) return
    const options = toggle.querySelectorAll('.toggle-option')
    const ids = toggle.querySelectorAll('.toggle-id')
    const clamped = Math.max(
      0,
      Math.min(index, options && options.length ? options.length - 1 : 0)
    )
    // Update active id
    if (!gsap.parseEase('wsEase'))
      CustomEase.create('wsEase', 'M0,0 C0.6,0 0,1 1,1')
    ids.forEach((el, i) => {
      const shouldBeActive = i === clamped
      // Measure current color
      const fromColor = getComputedStyle(el).color
      // Apply final class state first
      if (shouldBeActive) el.classList.add('is-active')
      else el.classList.remove('is-active')
      // Measure target color in final state
      const toColor = getComputedStyle(el).color
      // Animate color from current to target
      try {
        el.style.color = fromColor
        gsap.to(el, {
          color: toColor,
          duration: 0.5,
          ease: 'wsEase',
          onComplete: () => {
            try {
              el.style.color = ''
            } catch (e) {
              // ignore
            }
          },
        })
      } catch (e) {
        el.style.color = toColor
      }
    })
    // Move indicator under the active option
    const indicator = toggle.querySelector('.toggle-indicator')
    if (indicator && options && options.length) {
      const baseLeft = options[0] ? options[0].offsetLeft : 0
      const targetLeft = options[clamped] ? options[clamped].offsetLeft : 0
      const dx = Math.max(0, targetLeft - baseLeft)
      if (!gsap.parseEase('wsEase'))
        CustomEase.create('wsEase', 'M0,0 C0.6,0 0,1 1,1')
      try {
        gsap.to(indicator, { x: dx, duration: 0.5, ease: 'wsEase' })
      } catch (e) {
        indicator.style.transform = `translate3d(${dx}px, 0, 0)`
      }
    }
  } catch (e) {
    // ignore
  }
}

function startLoop() {
  const state = ensureState()
  if (state.running) return
  state.running = true

  const tick = () => {
    try {
      const base = pxFromEm(2)
      const contentTop = getContentTopOffsetPx()
      state.offsetPx = base + contentTop

      // Détermine si la première (la plus haute) a atteint le seuil (50% viewport)
      let earliestTop = Infinity
      state.items.forEach((entry) => {
        try {
          const el = entry.el
          if (!el || !el.isConnected) return
          const scaleY = entry.scaleY || 1
          const rect = el.getBoundingClientRect()
          const prevAppliedViewportDelta = Number.isFinite(entry.lastY)
            ? entry.lastY * (scaleY || 1)
            : 0
          const baseTop = rect.top - prevAppliedViewportDelta
          if (baseTop < earliestTop) earliestTop = baseTop
        } catch (e) {
          // ignore
        }
      })

      // Détermine si le dernier wrapper a atteint le seuil (50% viewport): si oui, on arrête le pin
      let lastWrapTop = Infinity
      try {
        const wraps = document.querySelectorAll('.worskshops_img-wrap')
        if (wraps && wraps.length) {
          const lastWrap = wraps[wraps.length - 1]
          lastWrapTop = lastWrap.getBoundingClientRect().top
        }
      } catch (e) {
        // ignore
      }

      // Référence conteneur d'affichage
      let containerTop = 0
      let containerBottom = 0
      try {
        const container = document.querySelector('.workshops_right')
        if (container) {
          const cr = container.getBoundingClientRect()
          containerTop = cr.top
          containerBottom = cr.bottom
        }
      } catch (e) {
        // ignore
      }

      // viewport height available above if needed for alternance threshold
      // Pinned phase still based on 2em threshold for first/last
      const groupActive =
        earliestTop <= state.offsetPx && lastWrapTop > state.offsetPx
      const groupEnded = lastWrapTop <= state.offsetPx

      // Text alternance: find which wrap is crossing 50% viewport height and show corresponding text
      try {
        const wraps = document.querySelectorAll('.worskshops_img-wrap')
        if (wraps && wraps.length) {
          let activeIdx = -1
          const vh =
            (window && window.innerHeight) ||
            document.documentElement.clientHeight ||
            0
          const threshold = vh * 0.5
          for (let i = 0; i < wraps.length; i += 1) {
            const top = wraps[i].getBoundingClientRect().top
            if (top <= threshold) activeIdx = i
            else break
          }
          if (activeIdx !== -1 && activeIdx !== state.currentTextIndex) {
            if (state.titles && state.descs) {
              // Update green toggle to reflect active index
              updateGreenToggle(activeIdx)

              // Masque l'ancien par display:none
              if (state.currentTextIndex >= 0) {
                const titleOut = state.titles[state.currentTextIndex]
                const descOut = state.descs[state.currentTextIndex]
                if (titleOut) {
                  titleOut.style.opacity = '0'
                  titleOut.style.visibility = 'hidden'
                  titleOut.style.pointerEvents = 'none'
                  titleOut.style.display = 'none'
                }
                if (descOut) {
                  descOut.style.opacity = '0'
                  descOut.style.visibility = 'hidden'
                  descOut.style.pointerEvents = 'none'
                  descOut.style.display = 'none'
                }
              }

              // Affiche les nouveaux blocs
              const titleIn = state.titles[activeIdx]
              const descIn = state.descs[activeIdx]
              if (titleIn) {
                titleIn.style.display = ''
                titleIn.style.opacity = '1'
                titleIn.style.visibility = 'visible'
                titleIn.style.pointerEvents = 'auto'
              }
              if (descIn) {
                descIn.style.display = ''
                descIn.style.opacity = '1'
                descIn.style.visibility = 'visible'
                descIn.style.pointerEvents = 'auto'
              }

              // Prépare split pour les cibles (après affichage pour mesures correctes)
              prepareSplitLines(titleIn)
              prepareSplitLines(descIn)

              // Animation slide-in ligne par ligne
              const animateLines = (el) => {
                try {
                  const inners = el.querySelectorAll('.ws-line-inner')
                  let delay = 0
                  const step = 0.06
                  if (!gsap.parseEase('wsEase'))
                    CustomEase.create('wsEase', 'M0,0 C0.6,0 0,1 1,1')
                  inners.forEach((inner) => {
                    gsap.fromTo(
                      inner,
                      { y: '1em', opacity: 0 },
                      { y: 0, opacity: 1, duration: 0.5, ease: 'wsEase', delay }
                    )
                    delay += step
                  })
                } catch (e) {
                  // ignore
                }
              }

              animateLines(titleIn)
              animateLines(descIn)

              state.currentTextIndex = activeIdx
            }
          }
        }
      } catch (e) {
        // ignore
      }

      state.items.forEach((entry) => {
        const { el } = entry
        if (!el || !el.isConnected) return
        const scaleY = entry.scaleY || 1

        // Phase avant pin: top aligné au conteneur
        if (!groupActive && !groupEnded) {
          const targetTop = containerTop
          const y = computeTranslateToTarget(el, entry.lastY, targetTop, scaleY)
          if (!Number.isFinite(entry.lastY) || y !== entry.lastY) {
            el.style.transform = `translate3d(0, ${y}px, 0)`
            entry.lastY = y
          }
          // Parallax: map wrap progress (enter->exit) to image shift (+10% -> -10% of view height)
          try {
            const viewRect = el.getBoundingClientRect()
            const wrap = el.closest ? el.closest('.worskshops_img-wrap') : null
            const wrapRect = wrap ? wrap.getBoundingClientRect() : viewRect
            const vh =
              (window && window.innerHeight) ||
              document.documentElement.clientHeight ||
              0
            const travel = Math.max(1, vh + wrapRect.height)
            const dist = vh - wrapRect.top
            const t = Math.max(0, Math.min(1, dist / travel))
            const yImg = -t * 0.1 * (viewRect.height || 0)
            const img =
              entry.img ||
              (el.querySelector &&
                (el.querySelector('.workshops_img') || el.querySelector('img')))
            if (img) {
              if (!entry.img) entry.img = img
              if (!Number.isFinite(entry.lastImgY) || yImg !== entry.lastImgY) {
                img.style.transform = `translate3d(0, ${yImg}px, 0)`
                entry.lastImgY = yImg
              }
            }
          } catch (e) {
            // ignore
          }
          return
        }

        // Phase fin: bottom aligné au conteneur
        if (groupEnded) {
          const rect = el.getBoundingClientRect()
          const targetTop = containerBottom - rect.height
          const y = computeTranslateToTarget(el, entry.lastY, targetTop, scaleY)
          if (!Number.isFinite(entry.lastY) || y !== entry.lastY) {
            el.style.transform = `translate3d(0, ${y}px, 0)`
            entry.lastY = y
          }
          // Parallax at end phase as wrap exits
          try {
            const viewRect = el.getBoundingClientRect()
            const wrap = el.closest ? el.closest('.worskshops_img-wrap') : null
            const wrapRect = wrap ? wrap.getBoundingClientRect() : viewRect
            const vh =
              (window && window.innerHeight) ||
              document.documentElement.clientHeight ||
              0
            const travel = Math.max(1, vh + wrapRect.height)
            const dist = vh - wrapRect.top
            const t = Math.max(0, Math.min(1, dist / travel))
            const yImg = -t * 0.1 * (viewRect.height || 0)
            const img =
              entry.img ||
              (el.querySelector &&
                (el.querySelector('.workshops_img') || el.querySelector('img')))
            if (img) {
              if (!entry.img) entry.img = img
              if (!Number.isFinite(entry.lastImgY) || yImg !== entry.lastImgY) {
                img.style.transform = `translate3d(0, ${yImg}px, 0)`
                entry.lastImgY = yImg
              }
            }
          } catch (e) {
            // ignore
          }
          return
        }

        // Phase pin: toutes à 2em, clamp au bas de la section
        {
          const rect = el.getBoundingClientRect()
          let targetTop = state.offsetPx
          try {
            const section = el.closest ? el.closest('.section_workshops') : null
            if (section) {
              const secRect = section.getBoundingClientRect()
              const maxTop = secRect.bottom - rect.height
              if (targetTop > maxTop) targetTop = maxTop
            }
          } catch (e) {
            // ignore
          }
          const y = computeTranslateToTarget(el, entry.lastY, targetTop, scaleY)
          if (!Number.isFinite(entry.lastY) || y !== entry.lastY) {
            el.style.transform = `translate3d(0, ${y}px, 0)`
            entry.lastY = y
          }
          // Parallax during pin phase as wrap traverses viewport
          try {
            const viewRect = el.getBoundingClientRect()
            const wrap = el.closest ? el.closest('.worskshops_img-wrap') : null
            const wrapRect = wrap ? wrap.getBoundingClientRect() : viewRect
            const vh =
              (window && window.innerHeight) ||
              document.documentElement.clientHeight ||
              0
            const travel = Math.max(1, vh + wrapRect.height)
            const dist = vh - wrapRect.top
            const t = Math.max(0, Math.min(1, dist / travel))
            const yImg = -t * 0.1 * (viewRect.height || 0)
            const img =
              entry.img ||
              (el.querySelector &&
                (el.querySelector('.workshops_img') || el.querySelector('img')))
            if (img) {
              if (!entry.img) entry.img = img
              if (!Number.isFinite(entry.lastImgY) || yImg !== entry.lastImgY) {
                img.style.transform = `translate3d(0, ${yImg}px, 0)`
                entry.lastImgY = yImg
              }
            }
          } catch (e) {
            // ignore
          }
        }
      })
    } catch (e) {
      // ignore
    }
    state.rafId = requestAnimationFrame(tick)
  }
  state.rafId = requestAnimationFrame(tick)
}

function stopLoopIfIdle() {
  const state = ensureState()
  if (!state.items.size && state.running) {
    try {
      cancelAnimationFrame(state.rafId)
    } catch (e) {
      // ignore
    }
    state.rafId = null
    state.running = false
  }
}

export function initWorkshopsStickyImages(root = document) {
  const state = ensureState()
  const scope = root && root.querySelector ? root : document
  const els = scope.querySelectorAll('.workshops_img-view')
  const added = []
  els.forEach((el) => {
    let exists = false
    state.items.forEach((it) => {
      if (it.el === el) exists = true
    })
    if (exists) return
    const scaleY = getEffectiveScaleY(el)
    try {
      el.style.willChange = 'transform'
    } catch (e) {
      // ignore
    }
    state.items.add({ el, lastY: NaN, scaleY })
    added.push(el)
  })

  if (state.items.size) startLoop()

  try {
    if (state.resizeHandler)
      window.removeEventListener('resize', state.resizeHandler)
  } catch (e) {
    // ignore
  }
  state.resizeHandler = (() => {
    let timer
    return () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        state.items.forEach((entry) => {
          try {
            entry.scaleY = getEffectiveScaleY(entry.el)
          } catch (e) {
            entry.scaleY = 1
          }
        })
      }, 100)
    }
  })()
  window.addEventListener('resize', state.resizeHandler)
  if (!added.length) stopLoopIfIdle()
  // Init texts visibility: show first, hide others
  try {
    state.titles = Array.from(
      (scope || document).querySelectorAll(
        '.workshops_left_middle .body-xl.is-black'
      )
    )
    state.descs = Array.from(
      (scope || document).querySelectorAll('.workshops_left_bottom .body-s')
    )
    const setVis = (idx) => {
      state.titles.forEach((el, i) => {
        const on = i === idx
        if (on) {
          el.style.display = ''
          el.style.opacity = '1'
          el.style.visibility = 'visible'
          el.style.pointerEvents = 'auto'
        } else {
          el.style.opacity = '0'
          el.style.visibility = 'hidden'
          el.style.pointerEvents = 'none'
          el.style.display = 'none'
        }
      })
      state.descs.forEach((el, i) => {
        const on = i === idx
        if (on) {
          el.style.display = ''
          el.style.opacity = '1'
          el.style.visibility = 'visible'
          el.style.pointerEvents = 'auto'
        } else {
          el.style.opacity = '0'
          el.style.visibility = 'hidden'
          el.style.pointerEvents = 'none'
          el.style.display = 'none'
        }
      })
      state.currentTextIndex = idx
    }
    const initialIdx = 0
    setVis(initialIdx)
  } catch (e) {
    // ignore
  }
  return added
}

export function destroyWorkshopsStickyImages() {
  const state = ensureState()
  try {
    state.items.forEach((it) => {
      if (it && it.el) {
        it.el.style.transform = ''
        it.el.style.willChange = ''
      }
    })
  } catch (e) {
    // ignore
  }
  state.items.clear()
  try {
    if (state.resizeHandler) {
      window.removeEventListener('resize', state.resizeHandler)
      state.resizeHandler = null
    }
  } catch (e) {
    // ignore
  }
  stopLoopIfIdle()
}
