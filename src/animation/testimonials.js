import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(CustomEase)
// Ensure a named custom ease exists (same curve as in nav.js)
try {
  CustomEase.create('custom', 'M0,0 C0.6,0 0,1 1,1 ')
} catch (err) {
  // ignore if already created
}

export function initTestimonials(root = document) {
  const containers = Array.from(root.querySelectorAll('.testimonials') || [])
  if (!containers.length) return

  containers.forEach((container) => {
    const options = container.querySelectorAll('.toggle-option')
    const indicator = container.querySelector('.toggle-indicator')
    if (!options.length || !indicator) return

    // Collect testimonial blocks (prefer .testimonial, fallback to direct children blocks)
    let testimonials = Array.from(
      container.querySelectorAll('.testimonial') || []
    )
    if (testimonials.length < 2) {
      const fallback = Array.from(
        container.querySelectorAll(':scope > .w-layout-vflex')
      ).filter((el) => el !== options[0]?.closest('.toggle'))
      if (fallback.length >= 2) {
        testimonials = fallback
      }
    }

    const toggleIds = container.querySelectorAll('.toggle-id')

    // Prepare initial opacity states
    const setInitialVisibility = (idx) => {
      if (testimonials.length >= 2) {
        testimonials.forEach((t, i) => {
          gsap.set(t, { opacity: i === idx ? 1 : 0 })
        })
      }
    }

    let activeIndex = 0

    const setActiveIndex = (i) => {
      if (i === activeIndex) return
      // Move indicator with GSAP
      gsap.to(indicator, {
        duration: 0.5,
        xPercent: i * 110,
        ease: 'custom',
        overwrite: 'auto',
      })

      // Option visual state per provided snippet
      options.forEach((o) => o.classList.remove('active'))
      options[i]?.classList.add('active')

      // Also align with existing CSS: toggle .toggle-id.is-active
      toggleIds.forEach((idEl, idx) => {
        if (idx === i) idEl.classList.add('is-active')
        else idEl.classList.remove('is-active')
      })

      // Toggle testimonial active state with opacity crossfade
      if (testimonials.length >= 2) {
        const prev = testimonials[activeIndex]
        const next = testimonials[i]
        if (prev && next && prev !== next) {
          prev.classList.remove('is-active')
          next.classList.add('is-active')
          gsap.to(prev, {
            duration: 0.5,
            opacity: 0,
            ease: 'custom',
            overwrite: 'auto',
          })
          gsap.to(next, {
            duration: 0.5,
            opacity: 1,
            ease: 'custom',
            overwrite: 'auto',
          })
        }
      }

      activeIndex = i
    }

    // Initial position based on current active id
    let initial = 0
    toggleIds.forEach((idEl, idx) => {
      if (idEl.classList.contains('is-active')) initial = idx
    })
    activeIndex = initial
    setInitialVisibility(initial)

    options.forEach((opt, i) => {
      opt.addEventListener('click', () => setActiveIndex(i))
    })
  })
}
