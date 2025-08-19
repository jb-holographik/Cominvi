// Themes couleur
export const initializeNavbarTheme = {
  themes: {
    white: {
      navbarColor: 'var(--primary)',
      logoBgFill: 'var(--white)',
      logoPathFill: 'var(--primary)',
      menuIconBorder: 'var(--primary)',
      menuIconBg: 'var(--white)',
      menuIconBarsBg: 'var(--primary)',
    },
    lightgreen: {
      navbarColor: 'var(--primary)',
      logoBgFill: 'var(--light-green)',
      logoPathFill: 'var(--primary)',
      menuIconBorder: 'var(--primary)',
      menuIconBg: 'var(--light-green)',
      menuIconBarsBg: 'var(--primary)',
    },
    black: {
      navbarColor: 'var(--white)',
      logoBgFill: 'var(--black)',
      logoPathFill: 'var(--white)',
      menuIconBorder: 'var(--white)',
      menuIconBg: 'var(--black)',
      menuIconBarsBg: 'var(--white)',
    },
    hero: {
      navbarColor: 'var(--white)',
      logoBgFill: 'transparent',
      logoPathFill: 'var(--white)',
      menuIconBorder: 'var(--white)',
      menuIconBg: 'transparent',
      menuIconBarsBg: 'var(--white)',
    },
    menu: {
      navbarColor: 'var(--primary)',
      logoBgFill: 'var(--accent)',
      logoPathFill: 'var(--primary)',
      menuIconBorder: 'var(--primary)',
      menuIconBg: 'var(--primary)',
      menuIconBarsBg: 'var(--accent)',
    },
  },
  transition: { duration: 1.2 },
}

// Ré-initialisation des animations Webflow (destroy → ready → ix2.init)
export function reinitializeWebflowAnimations() {
  const wf = window.Webflow
  if (!wf) return
  try {
    if (typeof wf.destroy === 'function') wf.destroy()
  } catch (err) {
    // ignore
  }
  try {
    if (typeof wf.ready === 'function') wf.ready()
  } catch (err) {
    // ignore
  }
  try {
    const ix2 = typeof wf.require === 'function' ? wf.require('ix2') : null
    if (ix2 && typeof ix2.init === 'function') ix2.init()
  } catch (err) {
    // ignore
  }
}
