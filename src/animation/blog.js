export function initBlog(root = document) {
  // Scope to Blog page via Barba namespace
  try {
    const container = root && root.nodeType === 1 ? root : document
    const isSelfBlog =
      container &&
      container.getAttribute &&
      container.getAttribute('data-barba-namespace') === 'Blog'
    const page = isSelfBlog
      ? container
      : container.querySelector('[data-barba-namespace="Blog"]')
    if (!page) return
    root = page
  } catch (err) {
    return
  }

  // Ensure Finsweet Attributes (fs-list) script is present
  try {
    const existing = document.querySelector(
      'script[src="https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js"][fs-list]'
    )
    if (!existing) {
      const s = document.createElement('script')
      s.setAttribute('async', '')
      s.setAttribute('type', 'module')
      s.setAttribute(
        'src',
        'https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js'
      )
      s.setAttribute('fs-list', '')
      const appendTarget = document.head || document.documentElement
      appendTarget.appendChild(s)
    }
  } catch (e) {
    // ignore
  }

  // Manage #all dimming based on active blog category
  try {
    const allEl = document.getElementById('all')
    if (allEl) {
      const scope = root && root.nodeType === 1 ? root : document
      const categoriesContainer =
        scope.querySelector('.blog-inner_categories') || scope
      const categoriesList =
        scope.querySelector('.blog-categories-list') || categoriesContainer

      const updateAllDimming = () => {
        try {
          const hasActive = !!scope.querySelector(
            '.blog-category.is-list-active'
          )
          // Dim "All" when a category is active
          allEl.classList.toggle('is-o-30', hasActive)
          // Treat #all as active when no category is selected, so its ::after can persist
          allEl.classList.toggle('is-list-active', !hasActive)
        } catch (err) {
          // ignore
        }
      }

      // Initial state
      updateAllDimming()

      // Respond to user interactions (click/keyboard) on category radios/labels
      categoriesContainer.addEventListener(
        'change',
        (ev) => {
          try {
            if (
              ev.target &&
              ev.target.matches &&
              ev.target.matches('input[name="Blog-category"]')
            ) {
              // Let Finsweet update classes first, then read state
              setTimeout(updateAllDimming, 0)
            }
          } catch (err) {
            // ignore
          }
        },
        true
      )
      // Also handle the Finsweet clear button (#all)
      try {
        const clearBtn = document.getElementById('all')
        if (clearBtn) {
          clearBtn.addEventListener(
            'click',
            () => setTimeout(updateAllDimming, 0),
            true
          )
        }
      } catch (err) {
        // ignore
      }
      categoriesContainer.addEventListener(
        'click',
        (ev) => {
          try {
            const label =
              ev.target && ev.target.closest
                ? ev.target.closest('.blog-category')
                : null
            if (label) setTimeout(updateAllDimming, 0)
          } catch (err) {
            // ignore
          }
        },
        true
      )

      // Fallback: observe class changes applied by Finsweet
      try {
        const mo = new MutationObserver(() => updateAllDimming())
        mo.observe(categoriesList, {
          attributes: true,
          subtree: true,
          attributeFilter: ['class'],
        })
      } catch (err) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }

  // Split blog titles ('.blog-name > .body-l') into visual lines
  try {
    const scope = root && root.nodeType === 1 ? root : document
    const titles = Array.from(scope.querySelectorAll('.blog-name > .body-l'))
    titles.forEach((title) => {
      try {
        if (title.dataset.linesSplit) return
        const originalText = title.textContent || ''
        const words = originalText.split(/\s+/)
        // Build words as inline elements allowing natural wrapping
        title.textContent = ''
        words.forEach((word, idx) => {
          const w = document.createElement('span')
          w.className = 'blogline-word'
          w.textContent = word
          title.appendChild(w)
          if (idx < words.length - 1)
            title.appendChild(document.createTextNode(' '))
        })

        // After layout, group words by line using offsetTop
        requestAnimationFrame(() => {
          try {
            const wordEls = Array.from(title.querySelectorAll('.blogline-word'))
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
              // Move following space (if any) into the line container to preserve spacing
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

  // Abbreviate blog dates (first word → 3 letters) similar to join-the-team
  try {
    const scope2 = root && root.nodeType === 1 ? root : document
    const dateEls = Array.from(scope2.querySelectorAll('.blog-date .eyebrow-m'))
    if (dateEls.length) {
      dateEls.forEach((element) => {
        try {
          if (element.dataset.abbrevApplied === '1') return
          const originalText = element.textContent || ''
          if (!originalText.trim()) return
          const match = originalText.match(/^(\s*)(\S+)([\s\S]*)$/)
          if (!match) return
          const prefix = match[1] || ''
          const firstWord = match[2] || ''
          const tail = match[3] || ''
          const abbreviated = firstWord.slice(0, 3)
          let result = prefix + abbreviated + tail
          // Insert line break after first comma (match join-the-team behavior)
          result = result.replace(/,\s*/, ',<br> ')
          element.innerHTML = result
          element.dataset.abbrevApplied = '1'
        } catch (e) {
          // ignore
        }
      })
    }
  } catch (e) {
    // ignore
  }

  // Hover cursor that follows mouse on blog items (simple version)
  try {
    const scope3 = root && root.nodeType === 1 ? root : document
    let items = Array.from(scope3.querySelectorAll('.blog-main_item'))
    // Exclude items inside the hero/featured section (.section_blog-main)
    try {
      items = items.filter((el) => !el.closest('.section_blog-main'))
    } catch (e) {
      // ignore
    }
    const cursor = document.querySelector('.cursor-pointer')
    if (cursor) {
      cursor.style.display = 'none'
      try {
        cursor.style.pointerEvents = 'none'
      } catch (e) {
        // ignore
      }
      try {
        // Prepare transition on inner element for enter/leave
        const inner =
          cursor.querySelector('.cursor-pointer_inner') ||
          cursor.firstElementChild
        if (inner) {
          const current = getComputedStyle(inner).transition || ''
          if (!/transform/.test(current)) {
            inner.style.transition =
              (current ? current + ', ' : '') +
              'transform 300ms cubic-bezier(0.6, 0, 0, 1)'
          }
          // Start off-screen for smooth enter animation
          inner.style.transform = 'translateY(100%)'

          // Measure inner size while hidden and cache for consistent container size
          const prevVis = cursor.style.visibility
          const prevDisp = cursor.style.display
          const wasHidden = getComputedStyle(cursor).display === 'none'
          if (wasHidden) {
            cursor.style.visibility = 'hidden'
            cursor.style.display = 'flex'
          }
          const rect = inner.getBoundingClientRect()
          cursor.dataset.__cursorInnerW = String(Math.ceil(rect.width))
          cursor.dataset.__cursorInnerH = String(Math.ceil(rect.height))
          if (wasHidden) {
            cursor.style.display = prevDisp || 'none'
            cursor.style.visibility = prevVis || ''
          }
        }
      } catch (e) {
        // ignore
      }
    }
    if (items.length && cursor) {
      let offsetPx = 8
      let endHandler = null
      const computeOffset = () => {
        try {
          const fs = parseFloat(getComputedStyle(cursor).fontSize) || 16
          offsetPx = 1 * fs
        } catch (e) {
          offsetPx = 8
        }
      }
      computeOffset()
      const onEnter = () => {
        const inner =
          cursor.querySelector('.cursor-pointer_inner') ||
          cursor.firstElementChild
        // Apply cached size to container for smooth animation
        try {
          const w = cursor.dataset.__cursorInnerW
          const h = cursor.dataset.__cursorInnerH
          if (w) cursor.style.width = w + 'px'
          if (h) cursor.style.height = h + 'px'
        } catch (e) {
          // ignore
        }
        cursor.style.display = 'flex'
        if (inner) {
          // Safety: remove any pending transitionend handler from a previous leave
          if (endHandler) {
            try {
              inner.removeEventListener('transitionend', endHandler)
            } catch (e) {
              // ignore
            }
            endHandler = null
          }
          // reset to start position and force reflow to ensure transition triggers every time
          inner.style.transform = 'translateY(100%)'
          void inner.getBoundingClientRect()
          inner.style.transform = 'translateY(0)'
        }
      }
      const onLeave = () => {
        const inner =
          cursor.querySelector('.cursor-pointer_inner') ||
          cursor.firstElementChild
        // animate out then hide when transition ends
        if (inner) {
          endHandler = () => {
            cursor.style.display = 'none'
            try {
              inner.removeEventListener('transitionend', endHandler)
            } catch (e) {
              // ignore
            }
            endHandler = null
            // reset transform so next enter starts from 100%
            inner.style.transform = 'translateY(100%)'
          }
          inner.addEventListener('transitionend', endHandler, { once: true })
          inner.style.transform = 'translateY(100%)'
        } else {
          cursor.style.display = 'none'
        }
      }
      const onMove = (e) => {
        cursor.style.left = e.pageX + offsetPx + 'px'
        cursor.style.top = e.pageY + offsetPx + 'px'
      }
      const bindItem = (el) => {
        if (!el || el.dataset.cursorBound === '1') return
        el.addEventListener('mouseenter', onEnter)
        el.addEventListener('mouseleave', onLeave)
        el.addEventListener('mousemove', onMove)
        el.dataset.cursorBound = '1'
      }
      items.forEach((el) => bindItem(el))

      // Observe for dynamically added items (e.g., Load More)
      try {
        const observeRoot =
          scope3.querySelector('.section_blog-inner') || scope3
        const mo = new MutationObserver((mutations) => {
          mutations.forEach((m) => {
            m.addedNodes.forEach((n) => {
              if (!(n && n.nodeType === 1)) return
              if (
                n.classList &&
                n.classList.contains('blog-main_item') &&
                !n.closest('.section_blog-main')
              ) {
                bindItem(n)
              }
              const found = n.querySelectorAll
                ? n.querySelectorAll('.blog-main_item')
                : []
              found.forEach((child) => {
                if (!child.closest('.section_blog-main')) bindItem(child)
              })
            })
          })
        })
        mo.observe(observeRoot, { childList: true, subtree: true })
      } catch (e) {
        // ignore
      }
      window.addEventListener('resize', computeOffset)
    }
  } catch (e) {
    // ignore
  }
}

// Cursor pointer that follows mouse over blog items
try {
  // This runs outside of initBlog scope only if the module is imported directly
  // The actual binding happens inside initBlog where root is narrowed to Blog namespace
} catch (e) {
  // ignore
}
