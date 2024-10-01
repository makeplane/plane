"use client"

import { ReactNode } from "react";
import { AppHeader, ContentWrapper } from "@/components/core";
import { DraftsBaseHeader } from "./header";

export default function DraftListLayout({children}:{children: ReactNode}){
    return (
        <>
            <AppHeader header={<DraftsBaseHeader/>}/>
            <ContentWrapper>{children}</ContentWrapper>
        </>
    )
}