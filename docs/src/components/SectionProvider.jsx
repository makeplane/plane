import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react'
import { createStore, useStore } from 'zustand'

import { remToPx } from '@/lib/remToPx'

function createSectionStore(sections) {
  return createStore((set) => ({
    sections,
    visibleSections: [],
    setVisibleSections: (visibleSections) =>
      set((state) =>
        state.visibleSections.join() === visibleSections.join()
          ? {}
          : { visibleSections }
      ),
    registerHeading: ({ id, ref, offsetRem }) =>
      set((state) => ({
        sections: state.sections.map((section) => {
          if (section.id === id) {
            return {
              ...section,
              headingRef: ref,
              offsetRem,
            }
          }
          return section
        }),
      })),
  }))
}

function useVisibleSections(sectionStore) {
  const setVisibleSections = useStore(sectionStore, (s) => s.setVisibleSections)
  const sections = useStore(sectionStore, (s) => s.sections)

  useEffect(() => {
    function checkVisibleSections() {
      const { innerHeight, scrollY } = window
      const newVisibleSections = []

      for (
        let sectionIndex = 0;
        sectionIndex < sections.length;
        sectionIndex++
      ) {
        const { id, headingRef, offsetRem } = sections[sectionIndex]
        const offset = remToPx(offsetRem)
        const top = headingRef.current.getBoundingClientRect().top + scrollY

        if (sectionIndex === 0 && top - offset > scrollY) {
          newVisibleSections.push('_top')
        }

        const nextSection = sections[sectionIndex + 1]
        const bottom =
          (nextSection?.headingRef.current.getBoundingClientRect().top ??
            Infinity) +
          scrollY -
          remToPx(nextSection?.offsetRem ?? 0)

        if (
          (top > scrollY && top < scrollY + innerHeight) ||
          (bottom > scrollY && bottom < scrollY + innerHeight) ||
          (top <= scrollY && bottom >= scrollY + innerHeight)
        ) {
          newVisibleSections.push(id)
        }
      }

      setVisibleSections(newVisibleSections)
    }

    const raf = window.requestAnimationFrame(() => checkVisibleSections())
    window.addEventListener('scroll', checkVisibleSections, { passive: true })
    window.addEventListener('resize', checkVisibleSections)

    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('scroll', checkVisibleSections)
      window.removeEventListener('resize', checkVisibleSections)
    }
  }, [setVisibleSections, sections])
}

const SectionStoreContext = createContext()

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export function SectionProvider({ sections, children }) {
  const [sectionStore] = useState(() => createSectionStore(sections))

  useVisibleSections(sectionStore)

  useIsomorphicLayoutEffect(() => {
    sectionStore.setState({ sections })
  }, [sectionStore, sections])

  return (
    <SectionStoreContext.Provider value={sectionStore}>
      {children}
    </SectionStoreContext.Provider>
  )
}

export function useSectionStore(selector) {
  const store = useContext(SectionStoreContext)
  return useStore(store, selector)
}
