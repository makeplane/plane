import React, { KeyboardEvent, ReactNode, Ref, forwardRef } from 'react'

interface CustomFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    children?: ReactNode,
    disableSubmitOnEnter: boolean,
    onKeyDown?: (evt: KeyboardEvent)=> void
}
// eslint-disable-next-line react/display-name
const CustomForm = forwardRef( (props:CustomFormProps, ref: Ref<HTMLFormElement>) => {
    const { disableSubmitOnEnter, onKeyDown, children} = props;
    const handleKeyDown = (evt:KeyboardEvent) => {
        if(evt.key === "enter" && disableSubmitOnEnter){
            evt.preventDefault();
        }
        onKeyDown && onKeyDown(evt)
    };
    return (
    <form {...props} ref={ref} onKeyDown={handleKeyDown}>
        {children}
    </form>
  )})

export default CustomForm