import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutDialog from '../AboutDialog.vue'
import i18n from '../../i18n'
import pkg from '../../../package.json'

function mountAbout() {
  return mount(AboutDialog, { props: { open: true }, global: { stubs: { teleport: true }, plugins: [i18n] } })
}

describe('AboutDialog', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.global.locale.value = 'zh'
  })

  it('renders app name and current version from package.json', () => {
    const w = mountAbout()
    const v = w.get('[data-test="about-version"]').text()
    expect(v).toContain('Tasklist')
    expect(v).toContain(pkg.version)
  })

  it('renders tagline and privacy note', () => {
    const w = mountAbout()
    expect(w.get('[data-test="about-tagline"]').text()).not.toBe('')
    expect(w.get('[data-test="about-privacy"]').text().length).toBeGreaterThan(0)
  })

  it('renders tech stack', () => {
    const w = mountAbout()
    expect(w.get('[data-test="about-stack"]').text()).toContain('Vue 3')
  })

  it('renders at least one feature entry', () => {
    const w = mountAbout()
    const items = w.findAll('[data-test="about-feature"]')
    expect(items.length).toBeGreaterThan(0)
  })

  it('renders author, license and repository link', () => {
    const w = mountAbout()
    expect(w.get('[data-test="about-author"]').text()).toContain('Jack Peng')
    expect(w.get('[data-test="about-license"]').text()).toContain('MIT')
    const link = w.get('[data-test="about-repo"]').attributes('href')
    expect(link).toBe('https://github.com/JackPeng-Coder/tasklist')
  })

  it('emits close when the close button is clicked', async () => {
    const w = mountAbout()
    await w.get('[data-test="about-close"]').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
