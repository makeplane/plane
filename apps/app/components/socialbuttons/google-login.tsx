import { FC, CSSProperties, useEffect, useRef, useCallback, useState } from "react";
// next
import Script from "next/script";

export interface IGoogleLoginButton {
  text?: string;
  onSuccess?: (res: any) => void;
  onFailure?: (res: any) => void;
  styles?: CSSProperties;
}

export const GoogleLoginButton: FC<IGoogleLoginButton> = (props) => {
  const googleSignInButton = useRef<HTMLDivElement>(null);
  const [gsiScriptLoaded, setGsiScriptLoaded] = useState(false);

  const loadScript = useCallback(() => {
    if (!googleSignInButton.current || gsiScriptLoaded) return;
    window?.google?.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENTID || "",
      callback: props.onSuccess as any,
    });
    window?.google?.accounts.id.renderButton(
      googleSignInButton.current,
      {
        type: "standard",
        theme: "outline",
        size: "large",
        logo_alignment: "center",
        width: document.getElementById("googleSignInButton")?.offsetWidth,
        text: "continue_with",
      } as GsiButtonConfiguration // customization attributes
    );
    window?.google?.accounts.id.prompt(); // also display the One Tap dialog
    setGsiScriptLoaded(true);
  }, [props.onSuccess, gsiScriptLoaded]);

  useEffect(() => {
    if (window?.google?.accounts?.id) {
      loadScript();
    }
    return () => {
      window?.google?.accounts.id.cancel();
    };
  }, [loadScript]);

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" async defer onLoad={loadScript} />
      <div className="w-full" id="googleSignInButton" ref={googleSignInButton}></div>
    </>
  );
};
