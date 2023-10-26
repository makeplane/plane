/* eslint-disable react/display-name */
// @ts-nocheck
import { NodeViewWrapper } from '@tiptap/react'
import { cn } from '../utils'
import React from 'react'
import { useRouter } from 'next/router'
import { IMentionHighlight } from './mentions'

// eslint-disable-next-line import/no-anonymous-default-export
export default props => {

  const router = useRouter()
  const highlights = props.extension.options.mentionHighlights as IMentionHighlight[]

  const handleClick = () => {
    router.push(props.node.attrs.redirect_uri)
  }

  return (
    <NodeViewWrapper className="w-fit inline mention-component" >
      <span className={cn("px-1 py-0.5 inline rounded-md font-bold cursor-pointer hover:bg-custom-primary-300 bg-custom-primary-500 mention", {
        "text-[#D9C942] bg-[#544D3B] hover:bg-[#544D3B]" : highlights ? highlights.includes(props.node.attrs.id) : false,
      })} onClick={handleClick} data-mention-target={props.node.attrs.target} data-mention-id={props.node.attrs.id}>@{ props.node.attrs.label }</span>
    </NodeViewWrapper>
  )
}


