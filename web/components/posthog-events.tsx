import { useEffect } from "react"

export const PosthogEvents = () => {

  useEffect(() => {

    const trackButtonClick = (e: any) => {
      console.log(e);
    };

    const posthogEvents: any = document.querySelectorAll("button");
    console.log('POSTHOG EVENTS:', posthogEvents);
    if (posthogEvents && posthogEvents.length > 0) {
      posthogEvents.forEach((element: any) => {
        element.addEventListener('click', trackButtonClick);
      });
    }
  })
  return null
}

