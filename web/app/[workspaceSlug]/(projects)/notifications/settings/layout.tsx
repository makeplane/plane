"use client"

import { FC, ReactNode } from "react"
// plane ui
import { AppHeader } from "@/components/core"
import { NotificationsSettingsHeader } from "./header";


export interface INotificationsSettingsLayoutProps {
    children: ReactNode;
}


const NotificationsSettingsLayout: FC<INotificationsSettingsLayoutProps> = (props) => {
    const { children } = props
    return (
        <>
            <AppHeader header={<NotificationsSettingsHeader />} />
            {children}
        </>
    )
}

export default NotificationsSettingsLayout;