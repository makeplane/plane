import { forwardRef, Fragment, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { createAutocomplete } from '@algolia/autocomplete-core'
import { getAlgoliaResults } from '@algolia/autocomplete-preset-algolia'
import { Dialog, Transition } from '@headlessui/react'
import algoliasearch from 'algoliasearch/lite'
import clsx from 'clsx'

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_DOCSEARCH_APP_ID,
  process.env.NEXT_PUBLIC_DOCSEARCH_API_KEY
)

function useAutocomplete() {
  const id = useId()
  const router = useRouter()
  const [autocompleteState, setAutocompleteState] = useState({})

  const [autocomplete] = useState(() =>
    createAutocomplete({
      id,
      placeholder: 'Find something...',
      defaultActiveItemId: 0,
      onStateChange({ state }) {
        setAutocompleteState(state)
      },
      shouldPanelOpen({ state }) {
        return state.query !== ''
      },
      navigator: {
        navigate({ itemUrl }) {
          autocomplete.setIsOpen(true)
          router.push(itemUrl)
        },
      },
      getSources() {
        return [
          {
            sourceId: 'documentation',
            getItemInputValue({ item }) {
              return item.query
            },
            getItemUrl({ item }) {
              const url = new URL(item.url)
              return `${url.pathname}${url.hash}`
            },
            onSelect({ itemUrl }) {
              router.push(itemUrl)
            },
            getItems({ query }) {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    query,
                    indexName: process.env.NEXT_PUBLIC_DOCSEARCH_INDEX_NAME,
                    params: {
                      hitsPerPage: 5,
                      highlightPreTag:
                        '<mark class="underline bg-transparent text-blue-500">',
                      highlightPostTag: '</mark>',
                    },
                  },
                ],
              })
            },
          },
        ]
      },
    })
  )

  return { autocomplete, autocompleteState }
}

function resolveResult(result) {
  const allLevels = Object.keys(result.hierarchy)
  const hierarchy = Object.entries(result._highlightResult.hierarchy).filter(
    ([, { value }]) => Boolean(value)
  )
  const levels = hierarchy.map(([level]) => level)

  const level =
    result.type === 'content'
      ? levels.pop()
      : levels
          .filter(
            (level) =>
              allLevels.indexOf(level) <= allLevels.indexOf(result.type)
          )
          .pop()

  return {
    titleHtml: result._highlightResult.hierarchy[level].value,
    hierarchyHtml: hierarchy
      .slice(0, levels.indexOf(level))
      .map(([, { value }]) => value),
  }
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.25 4.25 0 1 0-6.02-6 4.25 4.25 0 0 0 6.02 6Zm0 0 3.24 3.25"
      />
    </svg>
  )
}

function NoResultsIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.01 12a4.237 4.237 0 0 0 1.24-3c0-.62-.132-1.207-.37-1.738M12.01 12A4.237 4.237 0 0 1 9 13.25c-.635 0-1.237-.14-1.777-.388M12.01 12l3.24 3.25m-3.715-9.661a4.25 4.25 0 0 0-5.975 5.908M4.5 15.5l11-11"
      />
    </svg>
  )
}

function LoadingIcon(props) {
  const id = useId()

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="5.5" strokeLinejoin="round" />
      <path
        stroke={`url(#${id})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.5 10a5.5 5.5 0 1 0-5.5 5.5"
      />
      <defs>
        <linearGradient
          id={id}
          x1="13"
          x2="9.5"
          y1="9"
          y2="15"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function SearchResult({ result, resultIndex, autocomplete, collection }) {
  const id = useId()
  const { titleHtml, hierarchyHtml } = resolveResult(result)

  return (
    <li
      className={clsx(
        'group block cursor-default px-4 py-3 aria-selected:bg-zinc-50 dark:aria-selected:bg-zinc-800/50',
        resultIndex > 0 && 'border-t border-zinc-100 dark:border-zinc-800'
      )}
      aria-labelledby={`${id}-hierarchy ${id}-title`}
      {...autocomplete.getItemProps({
        item: result,
        source: collection.source,
      })}
    >
      <div
        id={`${id}-title`}
        aria-hidden="true"
        className="text-sm font-medium text-zinc-900 group-aria-selected:text-blue-500 dark:text-white"
        dangerouslySetInnerHTML={{ __html: titleHtml }}
      />
      {hierarchyHtml.length > 0 && (
        <div
          id={`${id}-hierarchy`}
          aria-hidden="true"
          className="mt-1 truncate whitespace-nowrap text-2xs text-zinc-500"
        >
          {hierarchyHtml.map((item, itemIndex, items) => (
            <Fragment key={itemIndex}>
              <span dangerouslySetInnerHTML={{ __html: item }} />
              <span
                className={
                  itemIndex === items.length - 1
                    ? 'sr-only'
                    : 'mx-2 text-zinc-300 dark:text-zinc-700'
                }
              >
                /
              </span>
            </Fragment>
          ))}
        </div>
      )}
    </li>
  )
}

function SearchResults({ autocomplete, query, collection }) {
  if (collection.items.length === 0) {
    return (
      <div className="p-6 text-center">
        <NoResultsIcon className="mx-auto h-5 w-5 stroke-zinc-900 dark:stroke-zinc-600" />
        <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-400">
          Nothing found for{' '}
          <strong className="break-words font-semibold text-zinc-900 dark:text-white">
            &lsquo;{query}&rsquo;
          </strong>
          . Please try again.
        </p>
      </div>
    )
  }

  return (
    <ul role="list" {...autocomplete.getListProps()}>
      {collection.items.map((result, resultIndex) => (
        <SearchResult
          key={result.objectID}
          result={result}
          resultIndex={resultIndex}
          autocomplete={autocomplete}
          collection={collection}
        />
      ))}
    </ul>
  )
}

const SearchInput = forwardRef(function SearchInput(
  { autocomplete, autocompleteState, onClose },
  inputRef
) {
  const inputProps = autocomplete.getInputProps({})

  return (
    <div className="group relative flex h-12">
      <SearchIcon className="pointer-events-none absolute left-3 top-0 h-full w-5 stroke-zinc-500" />
      <input
        ref={inputRef}
        className={clsx(
          'flex-auto appearance-none bg-transparent pl-10 text-zinc-900 outline-none placeholder:text-zinc-500 focus:w-full focus:flex-none dark:text-white sm:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
          autocompleteState.status === 'stalled' ? 'pr-11' : 'pr-4'
        )}
        {...inputProps}
        onKeyDown={(event) => {
          if (
            event.key === 'Escape' &&
            !autocompleteState.isOpen &&
            autocompleteState.query === ''
          ) {
            // In Safari, closing the dialog with the escape key can sometimes cause the scroll position to jump to the
            // bottom of the page. This is a workaround for that until we can figure out a proper fix in Headless UI.
            document.activeElement?.blur()

            onClose()
          } else {
            inputProps.onKeyDown(event)
          }
        }}
      />
      {autocompleteState.status === 'stalled' && (
        <div className="absolute inset-y-0 right-3 flex items-center">
          <LoadingIcon className="h-5 w-5 animate-spin stroke-zinc-200 text-zinc-900 dark:stroke-zinc-800 dark:text-blue-400" />
        </div>
      )}
    </div>
  )
})

function AlgoliaLogo(props) {
  return (
    <svg viewBox="0 0 71 16" role="img" aria-label="Algolia" {...props}>
      <path
        fillRule="evenodd"
        d="M34.98 8.81V.19a.189.189 0 0 0-.218-.186l-1.615.254a.19.19 0 0 0-.16.187l.006 8.741c0 .414 0 2.966 3.07 3.056a.19.19 0 0 0 .195-.19v-1.304a.187.187 0 0 0-.164-.187c-1.115-.128-1.115-1.522-1.115-1.75v-.002Z"
        clipRule="evenodd"
      />
      <path d="M61.605 3.352H59.98a.189.189 0 0 0-.189.189v8.514c0 .104.085.189.189.189h1.625a.189.189 0 0 0 .188-.19V3.542a.189.189 0 0 0-.188-.189Z" />
      <path
        fillRule="evenodd"
        d="M59.98 2.285h1.625a.189.189 0 0 0 .188-.189V.19a.189.189 0 0 0-.218-.187l-1.624.255a.189.189 0 0 0-.16.186v1.652c0 .104.085.189.189.189ZM57.172 8.81V.19a.189.189 0 0 0-.218-.186l-1.615.254a.19.19 0 0 0-.16.187l.006 8.741c0 .414 0 2.966 3.07 3.056a.19.19 0 0 0 .196-.19v-1.304a.187.187 0 0 0-.164-.187c-1.115-.128-1.115-1.522-1.115-1.75v-.002ZM52.946 4.568a3.628 3.628 0 0 0-1.304-.906 4.347 4.347 0 0 0-1.666-.315c-.601 0-1.157.101-1.662.315a3.822 3.822 0 0 0-1.304.906c-.367.39-.652.86-.856 1.408-.204.55-.296 1.196-.296 1.868 0 .671.103 1.18.306 1.734.204.554.484 1.027.846 1.42.361.39.795.691 1.3.91.504.218 1.283.33 1.676.335.392 0 1.177-.122 1.686-.335.51-.214.943-.52 1.305-.91.361-.393.641-.866.84-1.42.199-.555.295-1.063.295-1.734 0-.672-.107-1.318-.32-1.868a4.203 4.203 0 0 0-.846-1.408Zm-1.421 5.239c-.367.504-.882.758-1.539.758-.657 0-1.172-.25-1.539-.758-.367-.504-.55-1.088-.55-1.958 0-.86.178-1.573.545-2.076.367-.504.882-.752 1.538-.752.658 0 1.172.248 1.539.752.367.498.556 1.215.556 2.076 0 .87-.184 1.449-.55 1.958ZM29.35 3.352H27.77c-1.547 0-2.909.815-3.703 2.051a4.643 4.643 0 0 0-.736 2.519 4.611 4.611 0 0 0 1.949 3.783 2.574 2.574 0 0 0 1.542.428l.034-.002.084-.006.032-.004.088-.011.02-.003c1.052-.163 1.97-.986 2.268-2.01v1.85c0 .105.085.19.19.19h1.612a.189.189 0 0 0 .19-.19V3.541a.189.189 0 0 0-.19-.189H29.35Zm0 6.62c-.39.326-.896.448-1.435.484l-.016.002a1.68 1.68 0 0 1-.107.003c-1.352 0-2.468-1.149-2.468-2.54 0-.328.063-.64.173-.927.36-.932 1.241-1.591 2.274-1.591h1.578v4.57ZM69.009 3.352H67.43c-1.547 0-2.908.815-3.703 2.051a4.643 4.643 0 0 0-.736 2.519 4.611 4.611 0 0 0 1.949 3.783 2.575 2.575 0 0 0 1.542.428l.034-.002.084-.006.033-.004.087-.011.02-.003c1.053-.163 1.97-.986 2.269-2.01v1.85c0 .105.084.19.188.19h1.614a.189.189 0 0 0 .188-.19V3.541a.189.189 0 0 0-.188-.189h-1.802Zm0 6.62c-.39.326-.895.448-1.435.484l-.016.002a1.675 1.675 0 0 1-.107.003c-1.352 0-2.468-1.149-2.468-2.54 0-.328.063-.64.174-.927.359-.932 1.24-1.591 2.273-1.591h1.579v4.57ZM42.775 3.352h-1.578c-1.547 0-2.909.815-3.704 2.051a4.63 4.63 0 0 0-.735 2.519 4.6 4.6 0 0 0 1.65 3.555c.094.083.194.16.298.228a2.575 2.575 0 0 0 2.966-.08c.52-.37.924-.913 1.103-1.527v1.608h-.004v.354c0 .7-.182 1.225-.554 1.58-.372.354-.994.532-1.864.532-.356 0-.921-.02-1.491-.078a.19.19 0 0 0-.2.136l-.41 1.379a.19.19 0 0 0 .155.24c.688.1 1.36.15 1.748.15 1.565 0 2.725-.343 3.484-1.03.688-.621 1.061-1.564 1.127-2.832V3.54a.189.189 0 0 0-.19-.189h-1.801Zm0 2.051s.021 4.452 0 4.587c-.386.312-.867.435-1.391.47l-.016.001a1.751 1.751 0 0 1-.233 0c-1.293-.067-2.385-1.192-2.385-2.54 0-.327.063-.64.174-.927.359-.931 1.24-1.591 2.273-1.591h1.578Z"
        clipRule="evenodd"
      />
      <path d="M8.725.001C4.356.001.795 3.523.732 7.877c-.064 4.422 3.524 8.085 7.946 8.111a7.94 7.94 0 0 0 3.849-.96.187.187 0 0 0 .034-.305l-.748-.663a.528.528 0 0 0-.555-.094 6.461 6.461 0 0 1-2.614.513c-3.574-.043-6.46-3.016-6.404-6.59a6.493 6.493 0 0 1 6.485-6.38h6.485v11.527l-3.68-3.269a.271.271 0 0 0-.397.042 3.014 3.014 0 0 1-5.416-1.583 3.02 3.02 0 0 1 3.008-3.248 3.02 3.02 0 0 1 3.005 2.75.537.537 0 0 0 .176.356l.958.85a.187.187 0 0 0 .308-.106c.07-.37.094-.755.067-1.15a4.536 4.536 0 0 0-4.23-4.2A4.53 4.53 0 0 0 4.203 7.87c-.067 2.467 1.954 4.593 4.421 4.648a4.498 4.498 0 0 0 2.756-.863l4.808 4.262a.32.32 0 0 0 .531-.239V.304a.304.304 0 0 0-.303-.303h-7.69Z" />
    </svg>
  )
}

function SearchButton(props) {
  const [modifierKey, setModifierKey] = useState()

  useEffect(() => {
    setModifierKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl '
    )
  }, [])

  return (
    <>
      <button
        type="button"
        className="hidden h-8 w-full items-center gap-2 rounded-full bg-white pl-2 pr-3 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:ring-zinc-900/20 dark:bg-white/5 dark:text-zinc-400 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20 lg:flex focus:[&:not(:focus-visible)]:outline-none"
        {...props}
      >
        <SearchIcon className="h-5 w-5 stroke-current" />
        Find something...
        <kbd className="ml-auto text-2xs text-zinc-400 dark:text-zinc-500">
          <kbd className="font-sans">{modifierKey}</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5 lg:hidden focus:[&:not(:focus-visible)]:outline-none"
        aria-label="Find something..."
        {...props}
      >
        <SearchIcon className="h-5 w-5 stroke-zinc-900 dark:stroke-white" />
      </button>
    </>
  )
}

function SearchDialog({ open, setOpen, className }) {
  const router = useRouter()
  const formRef = useRef()
  const panelRef = useRef()
  const inputRef = useRef()
  const { autocomplete, autocompleteState } = useAutocomplete()

  useEffect(() => {
    if (!open) {
      return
    }

    function onRouteChange() {
      setOpen(false)
    }

    router.events.on('routeChangeStart', onRouteChange)
    router.events.on('hashChangeStart', onRouteChange)

    return () => {
      router.events.off('routeChangeStart', onRouteChange)
      router.events.off('hashChangeStart', onRouteChange)
    }
  }, [open, setOpen, router])

  useEffect(() => {
    if (open) {
      return
    }

    function onKeyDown(event) {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpen])

  return (
    <Transition.Root
      show={open}
      as={Fragment}
      afterLeave={() => autocomplete.setQuery('')}
    >
      <Dialog
        onClose={setOpen}
        className={clsx('fixed inset-0 z-50', className)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-zinc-400/25 backdrop-blur-sm dark:bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto px-4 py-4 sm:py-20 sm:px-6 md:py-32 lg:px-8 lg:py-[15vh]">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="mx-auto overflow-hidden rounded-lg bg-zinc-50 shadow-xl ring-1 ring-zinc-900/7.5 dark:bg-zinc-900 dark:ring-zinc-800 sm:max-w-xl">
              <div {...autocomplete.getRootProps({})}>
                <form
                  ref={formRef}
                  {...autocomplete.getFormProps({
                    inputElement: inputRef.current,
                  })}
                >
                  <SearchInput
                    ref={inputRef}
                    autocomplete={autocomplete}
                    autocompleteState={autocompleteState}
                    onClose={() => setOpen(false)}
                  />
                  <div
                    ref={panelRef}
                    className="border-t border-zinc-200 bg-white empty:hidden dark:border-zinc-100/5 dark:bg-white/2.5"
                    {...autocomplete.getPanelProps({})}
                  >
                    {autocompleteState.isOpen && (
                      <>
                        <SearchResults
                          autocomplete={autocomplete}
                          query={autocompleteState.query}
                          collection={autocompleteState.collections[0]}
                        />
                        <p className="flex items-center justify-end gap-2 border-t border-zinc-100 px-4 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                          Search by{' '}
                          <AlgoliaLogo className="h-4 fill-[#003DFF] dark:fill-zinc-400" />
                        </p>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

function useSearchProps() {
  const buttonRef = useRef()
  const [open, setOpen] = useState(false)

  return {
    buttonProps: {
      ref: buttonRef,
      onClick() {
        setOpen(true)
      },
    },
    dialogProps: {
      open,
      setOpen(open) {
        const { width, height } = buttonRef.current.getBoundingClientRect()
        if (!open || (width !== 0 && height !== 0)) {
          setOpen(open)
        }
      },
    },
  }
}

export function Search() {
  const [modifierKey, setModifierKey] = useState()
  const { buttonProps, dialogProps } = useSearchProps()

  useEffect(() => {
    setModifierKey(
      /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform) ? '⌘' : 'Ctrl '
    )
  }, [])

  return (
    <div className="hidden lg:block lg:max-w-md lg:flex-auto">
      <button
        type="button"
        className="hidden h-8 w-full items-center gap-2 rounded-full bg-white pl-2 pr-3 text-sm text-zinc-500 ring-1 ring-zinc-900/10 transition hover:ring-zinc-900/20 dark:bg-white/5 dark:text-zinc-400 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20 lg:flex focus:[&:not(:focus-visible)]:outline-none"
        {...buttonProps}
      >
        <SearchIcon className="h-5 w-5 stroke-current" />
        Find something...
        <kbd className="ml-auto text-2xs text-zinc-400 dark:text-zinc-500">
          <kbd className="font-sans">{modifierKey}</kbd>
          <kbd className="font-sans">K</kbd>
        </kbd>
      </button>
      <SearchDialog className="hidden lg:block" {...dialogProps} />
    </div>
  )
}

export function MobileSearch() {
  const { buttonProps, dialogProps } = useSearchProps()

  return (
    <div className="contents lg:hidden">
      <button
        type="button"
        className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5 lg:hidden focus:[&:not(:focus-visible)]:outline-none"
        aria-label="Find something..."
        {...buttonProps}
      >
        <SearchIcon className="h-5 w-5 stroke-zinc-900 dark:stroke-white" />
      </button>
      <SearchDialog className="lg:hidden" {...dialogProps} />
    </div>
  )
}
