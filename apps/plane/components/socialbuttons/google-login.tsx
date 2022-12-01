import { FC, CSSProperties } from "react";
// next
import Script from "next/script";

export interface IGoogleLoginButton {
  text?: string;
  onSuccess?: (res: any) => void;
  onFailure?: (res: any) => void;
  styles?: CSSProperties;
}

export const GoogleLoginButton: FC<IGoogleLoginButton> = (props) => {
  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        async
        defer
        onLoad={() => {
          window?.google?.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENTID || "",
            callback: props.onSuccess as any,
          });
          window?.google?.accounts.id.renderButton(
            document.getElementById("googleSignInButton") as HTMLElement,
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
        }}
      />
      <div className="w-full" id="googleSignInButton"></div>
    </>
  );
};
