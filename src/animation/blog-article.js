import { initParallax, initHeroBlogImageParallax } from './parallax.js'

export function blogArticleInit(root = document) {
  // Scope to Article page via Barba namespace
  try {
    const container = root && root.nodeType === 1 ? root : document
    const isSelfArticle =
      container &&
      container.getAttribute &&
      container.getAttribute('data-barba-namespace') === 'article'
    const page = isSelfArticle
      ? container
      : container.querySelector('[data-barba-namespace="article"]')
    if (!page) return
    root = page
  } catch (err) {
    return
  }

  // Format dates inside .section_blog-inner like on Blog list: trim and break line after comma
  const applyDateFormat = (scope) => {
    try {
      const section =
        (scope &&
          scope.querySelector &&
          scope.querySelector('.section_blog-inner')) ||
        scope ||
        document
      const dateEls = Array.from(
        (section || document).querySelectorAll('.blog-date .eyebrow-m')
      )
      dateEls.forEach((element) => {
        try {
          if (element.dataset.abbrevApplied === '1') return
          const raw = element.textContent || ''
          const cleaned = raw.replace(/\s+/g, ' ').trim()
          if (!cleaned) return
          const match = cleaned.match(/^(\s*)(\S+)([\s\S]*)$/)
          if (!match) return
          const prefix = match[1] || ''
          const firstWord = match[2] || ''
          const tail = match[3] || ''
          const abbreviated = firstWord.slice(0, 3)
          let result = prefix + abbreviated + tail
          result = result.replace(/,\s*/, ',<br> ')
          element.innerHTML = result
          element.dataset.abbrevApplied = '1'
        } catch (e) {
          // ignore
        }
      })
    } catch (e) {
      // ignore
    }
  }

  // Split related article titles into visual lines
  const splitTitles = (scope) => {
    try {
      const s = scope && scope.nodeType === 1 ? scope : document
      const container = s.querySelector('.section_blog-inner') || s
      const titles = Array.from(
        container.querySelectorAll('.blog-name > h2.body-l')
      )
      titles.forEach((title) => {
        try {
          if (title.dataset.linesSplit) return
          const originalText = title.textContent || ''
          const words = originalText.split(/\s+/)
          title.textContent = ''
          words.forEach((word, idx) => {
            const w = document.createElement('span')
            w.className = 'blogline-word'
            w.textContent = word
            title.appendChild(w)
            if (idx < words.length - 1)
              title.appendChild(document.createTextNode(' '))
          })

          requestAnimationFrame(() => {
            try {
              const wordEls = Array.from(
                title.querySelectorAll('.blogline-word')
              )
              if (!wordEls.length) return
              let currentTop = null
              let lineWrap = null
              wordEls.forEach((wEl) => {
                const top = wEl.offsetTop
                if (currentTop === null || Math.abs(top - currentTop) > 1) {
                  currentTop = top
                  lineWrap = document.createElement('span')
                  lineWrap.className = 'blogline-line'
                  title.insertBefore(lineWrap, wEl)
                }
                lineWrap.appendChild(wEl)
                const next = lineWrap.nextSibling
                if (
                  wEl.nextSibling &&
                  wEl.nextSibling.nodeType === Node.TEXT_NODE
                ) {
                  lineWrap.appendChild(wEl.nextSibling)
                } else if (next && next.nodeType === Node.TEXT_NODE) {
                  lineWrap.appendChild(next)
                }
              })
              title.dataset.linesSplit = 'true'
            } catch (err) {
              // ignore
            }
          })
        } catch (err) {
          // ignore
        }
      })
    } catch (err) {
      // ignore
    }
  }

  try {
    // Apply once on init
    applyDateFormat(root)
    splitTitles(root)
    // Tag RTE images inside figures for parallax and ensure proper class
    try {
      const scope = root && root.nodeType === 1 ? root : document
      const imgs = scope.querySelectorAll(
        '.w-richtext figure > div > img, .w-richtext figure.w-richtext-align-fullwidth > div > img'
      )
      imgs.forEach((img) => {
        try {
          if (!img.classList.contains('image-p')) img.classList.add('image-p')
          const wrapper = img.parentElement
          if (
            wrapper &&
            wrapper.classList &&
            !wrapper.classList.contains('image-wrapper')
          ) {
            wrapper.classList.add('image-wrapper')
          }
        } catch (e) {
          // ignore per-image
        }
      })
      // Re-init global parallax now that images are tagged
      try {
        initParallax(root)
        initHeroBlogImageParallax(root)
      } catch (e) {
        // ignore
      }
    } catch (e) {
      // ignore
    }
    // Apply once more on next frame to account for layout
    try {
      requestAnimationFrame(() => {
        try {
          applyDateFormat(root)
          splitTitles(root)
          // Refresh parallax once layout is stable
          try {
            initParallax(root)
            initHeroBlogImageParallax(root)
          } catch (e) {
            // ignore
          }
        } catch (err) {
          // ignore
        }
      })
    } catch (err) {
      // ignore
    }
  } catch (e) {
    // ignore
  }
}
