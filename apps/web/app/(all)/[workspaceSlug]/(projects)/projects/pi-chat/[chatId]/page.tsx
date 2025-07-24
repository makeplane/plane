"use client";
import { observer } from "mobx-react";
import { PiChatDetail } from "@/plane-web/components/pi-chat/detail";

const PiChatPage = observer(() => <PiChatDetail isFullScreen isProjectLevel />);

export default PiChatPage;
