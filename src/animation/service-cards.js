export function initServiceCards(root = document) {
  const scope = root && root.querySelector ? root : document
  const cards = scope.querySelectorAll('.service-card')
  cards.forEach((card) => {
    if (card.__serviceCardsBound) return
    const desc = card.querySelector('.desc')
    const bloc = card.querySelector('.card-inner') || desc
    if (!desc || !bloc) return

    // Set initial hidden state (no flicker on arrival)
    try {
      bloc.style.transition = 'none'
      const rect = desc.getBoundingClientRect()
      const h =
        rect.height + parseFloat(getComputedStyle(desc).fontSize || '16') * 2
      bloc.style.transform = `translateY(${h}px)`
      void bloc.offsetWidth
      bloc.style.transition = 'transform 0.5s ease, opacity 0.3s ease'
      // Prepare background-color transition on the card itself
      const existing = card.style.transition?.trim()
      card.style.transition = existing
        ? `${existing}, background-color 0.3s ease`
        : 'background-color 0.3s ease'
      // Ensure initial bg is white
      if (!card.style.backgroundColor) {
        card.style.backgroundColor = 'var(--white)'
      }
    } catch (err) {
      // ignore
    }
    card.addEventListener('mouseenter', () => {
      const height = desc.getBoundingClientRect().height
      bloc.style.transition = 'transform 0.5s ease'
      bloc.style.transform = `translateY(${height}px)`
      // Force reflow pour que la transition parte bien du bas
      void desc.offsetWidth
      bloc.style.transform = 'translateY(0)'
      // bg to accent on hover
      card.style.backgroundColor = 'var(--accent)'
    })
    card.addEventListener('mouseleave', () => {
      const rect = desc.getBoundingClientRect()
      const height =
        rect.height + parseFloat(getComputedStyle(desc).fontSize || '16') * 2
      bloc.style.transform = `translateY(${height}px)`
      // bg back to white
      card.style.backgroundColor = 'var(--white)'
    })
    // Pointer events for broader support
    card.addEventListener('pointerenter', () => {
      bloc.style.transform = 'translateY(0)'
      card.style.backgroundColor = 'var(--accent)'
    })
    card.addEventListener('pointerleave', () => {
      const rect = desc.getBoundingClientRect()
      const height =
        rect.height + parseFloat(getComputedStyle(desc).fontSize || '16') * 2
      bloc.style.transform = `translateY(${height}px)`
      card.style.backgroundColor = 'var(--white)'
    })

    card.__serviceCardsBound = true
  })

  // Also bind the hover → viewer image logic
  serviceCardsHover(scope)
}

export function serviceCardsHover(root = document) {
  const scope = root && root.querySelector ? root : document
  // Support both class names: .service-viewer and .services-viewer (per HTML)
  const viewer = scope.querySelector('.service-viewer, .services-viewer')
  if (!viewer) return

  if (viewer.__serviceViewerBound) return

  const images = Array.from(viewer.querySelectorAll('.service-image'))
  const OPACITY_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'
  const viewerButton = viewer.querySelector('.button-md')
  // Ensure base state
  images.forEach((img) => {
    img.style.transition = `opacity 0.5s ${OPACITY_EASING}`
    if (!img.style.position) {
      // don't force; assume CSS sets absolute if already configured
    }
    img.style.opacity = '0'
    img.style.zIndex = '0'
    img.style.display = 'none'
    if (!img.__svcOpacityBound) {
      img.addEventListener('transitionend', (e) => {
        if (e.propertyName !== 'opacity') return
        const style = window.getComputedStyle(img)
        if (parseFloat(style.opacity || '0') === 0) {
          img.style.display = 'none'
          img.style.zIndex = '0'
        }
      })
      img.__svcOpacityBound = true
    }
  })

  // Button initial state: visible when no image is shown
  if (viewerButton) {
    viewerButton.style.transition = `opacity 0.5s ${OPACITY_EASING}`
    viewerButton.style.opacity = '1'
    viewerButton.style.display = 'block'
  }
  const cards = Array.from(scope.querySelectorAll('.service-card'))

  const showImageByIndex = (index) => {
    images.forEach((img, i) => {
      if (i === index) {
        img.style.display = 'block'
        void img.offsetWidth
        img.style.transition = `opacity 0.5s ${OPACITY_EASING}`
        img.style.opacity = '1'
        img.style.zIndex = '2'
      } else {
        img.style.transition = `opacity 0.5s ${OPACITY_EASING}`
        img.style.opacity = '0'
        img.style.zIndex = '0'
      }
    })
    if (viewerButton) {
      // Cancel any pending transitionend handler from a previous hide
      if (viewerButton.__onOpacityEnd) {
        try {
          viewerButton.removeEventListener(
            'transitionend',
            viewerButton.__onOpacityEnd
          )
        } catch (err) {
          // ignore
        }
        viewerButton.__onOpacityEnd = null
      }
      viewerButton.style.transition = `opacity 0.5s ${OPACITY_EASING}`
      viewerButton.style.opacity = '0'
      // hide on transition end for accessibility
      const onEnd = (e) => {
        if (e.propertyName !== 'opacity') return
        // Only hide if the button is still supposed to be hidden now
        const style = window.getComputedStyle(viewerButton)
        if (parseFloat(style.opacity || '0') === 0) {
          viewerButton.style.display = 'none'
        }
        viewerButton.removeEventListener('transitionend', onEnd)
        viewerButton.__onOpacityEnd = null
      }
      viewerButton.addEventListener('transitionend', onEnd)
      viewerButton.__onOpacityEnd = onEnd
    }
  }

  const hideImageByIndex = (index) => {
    const img = images[index]
    if (!img) return
    img.style.transition = `opacity 0.5s ${OPACITY_EASING}`
    img.style.opacity = '0'
    img.style.zIndex = '0'
  }

  cards.forEach((card, idx) => {
    // Map card order (0-based) → .service-image.is-(idx+1)
    const target = viewer.querySelector(`.service-image.is-${idx + 1}`)
    if (!target) return

    const indexInImages = images.indexOf(target)
    if (indexInImages === -1) return

    if (!card.__serviceViewerHoverBound) {
      card.addEventListener('mouseenter', () => {
        showImageByIndex(indexInImages)
        if (viewerButton) {
          viewerButton.style.opacity = '0'
        }
      })
      card.addEventListener('mouseleave', () => {
        hideImageByIndex(indexInImages)
        // Show button only if no card is hovered anymore
        if (viewerButton && !scope.querySelector('.service-card:hover')) {
          // Cancel any pending hide handler
          if (viewerButton.__onOpacityEnd) {
            try {
              viewerButton.removeEventListener(
                'transitionend',
                viewerButton.__onOpacityEnd
              )
            } catch (err) {
              // ignore
            }
            viewerButton.__onOpacityEnd = null
          }
          viewerButton.style.display = 'block'
          void viewerButton.offsetWidth
          viewerButton.style.opacity = '1'
        }
      })
      // Pointer events for broader support
      card.addEventListener('pointerenter', () => {
        showImageByIndex(indexInImages)
        if (viewerButton) {
          viewerButton.style.opacity = '0'
        }
      })
      card.addEventListener('pointerleave', () => {
        hideImageByIndex(indexInImages)
        if (viewerButton && !scope.querySelector('.service-card:hover')) {
          if (viewerButton.__onOpacityEnd) {
            try {
              viewerButton.removeEventListener(
                'transitionend',
                viewerButton.__onOpacityEnd
              )
            } catch (err) {
              // ignore
            }
            viewerButton.__onOpacityEnd = null
          }
          viewerButton.style.display = 'block'
          void viewerButton.offsetWidth
          viewerButton.style.opacity = '1'
        }
      })
      // Also handle focus/blur for keyboard navigation
      card.addEventListener('focus', () => {
        showImageByIndex(indexInImages)
        if (viewerButton) {
          viewerButton.style.opacity = '0'
        }
      })
      card.addEventListener('blur', () => {
        hideImageByIndex(indexInImages)
        if (viewerButton && !scope.querySelector('.service-card:hover')) {
          if (viewerButton.__onOpacityEnd) {
            try {
              viewerButton.removeEventListener(
                'transitionend',
                viewerButton.__onOpacityEnd
              )
            } catch (err) {
              // ignore
            }
            viewerButton.__onOpacityEnd = null
          }
          viewerButton.style.display = 'block'
          void viewerButton.offsetWidth
          viewerButton.style.opacity = '1'
        }
      })
      card.__serviceViewerHoverBound = true
    }
  })

  viewer.__serviceViewerBound = true
}
