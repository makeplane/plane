import { Editor } from '@tiptap/react';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'

import { IMentionSuggestion } from '../../types/mention-suggestion';

interface MentionListProps {
  items: IMentionSuggestion[];
  command: (item: { id: string, label: string, target: string, redirect_uri: string }) => void;
  editor: Editor;
}

// eslint-disable-next-line react/display-name
const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectItem = useCallback((index: number) => {
    const item = props.items[index]

    if (item) {
      props.command({ id: item.id, label: item.title, target: "users", redirect_uri: item.redirect_uri })
    }
  }, [props.command, props.items])

  const upHandler = () => {
    setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length)
  }

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length)
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useEffect(() => {
    setSelectedIndex(0)
  }, [props.items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        enterHandler()
        return false
      }

      return false
    },
  }), [props.items, selectedIndex, setSelectedIndex, selectItem])

  return (
    props.items && props.items.length !== 0 ? <div className="items shadow-md">
      { props.items.length ? props.items.map((item, index) => (
            <div className={`item ${index === selectedIndex ? 'is-selected' : ''} w-72 flex items-center p-3 rounded`} onClick={() => selectItem(index)}>
                {item.avatar ? <div
                  className={`rounded border-[0.5px] ${index ? "border-custom-border-200 bg-custom-background-100" : "border-transparent h-6 w-6"
                    }`}
                >
                  <img
                    src={item.avatar}
                    className="h-6 w-6 object-cover rounded"
                    alt={item.title}
                  />
                </div> :
                  <div
                    className="grid place-items-center text-xs capitalize text-white rounded bg-gray-700  border-[0.5px] border-custom-border-200 h-6 w-6"
                  >
                    {item.title.charAt(0)}
                  </div>
                }
              <div className="ml-7 space-y-1">
                <p className="text-sm font-medium leading-none">{item.title}</p>
                <p className="text-xs text-gray-400">
                  {item.subtitle}
                </p>
              </div>
            </div>
          )
        )
        : <div className="item">No result</div>
      }
    </div> : <></>
  )
})

MentionList.displayName = "MentionList"

export default MentionList