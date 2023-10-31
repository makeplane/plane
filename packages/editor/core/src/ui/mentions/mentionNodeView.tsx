/* eslint-disable react/display-name */
// @ts-nocheck
import { NodeViewWrapper } from '@tiptap/react'
import { cn } from '../../lib/utils'
import React from 'react'
import { useRouter } from 'next/router'
import { IMentionHighlight } from '../../types/mention-suggestion'

// eslint-disable-next-line import/no-anonymous-default-export
export default props => {

  const router = useRouter()
  const highlights = props.extension.options.mentionHighlights as IMentionHighlight[]

  const handleClick = () => {
    if (!props.extension.options.readonly){
      router.push(props.node.attrs.redirect_uri)
    }
  }

  return (
    <NodeViewWrapper className="w-fit inline mention-component" >
      <span className={cn("px-1 py-0.5 inline rounded-md font-bold bg-custom-primary-500 mention", {
        "text-[#D9C942] bg-[#544D3B] hover:bg-[#544D3B]" : highlights ? highlights.includes(props.node.attrs.id) : false,
        "cursor-pointer" : !props.extension.options.readonly,
        "hover:bg-custom-primary-300" : !props.extension.options.readonly && !highlights.includes(props.node.attrs.id)
      })} onClick={handleClick} data-mention-target={props.node.attrs.target} data-mention-id={props.node.attrs.id}>@{ props.node.attrs.label }</span>
    </NodeViewWrapper>
  )
}


