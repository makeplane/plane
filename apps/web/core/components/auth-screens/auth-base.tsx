import { AuthRoot } from "@/components/account/auth-forms/auth-root";
import { EAuthModes } from "@/helpers/authentication.helper";
import { AuthFooter } from "./footer";
import ShinhanBankLogo from "@/app/assets/logos/shinhan-bank-logo.svg?url";
import LogonDashboardImage from "@/app/assets/image_plan_logon2.webp?url";

type AuthBaseProps = {
  authType: EAuthModes;
};

export function AuthBase({ authType }: AuthBaseProps) {
  return (
    <div
      className="font-sans relative z-10 flex min-h-dvh w-screen flex-col items-center justify-center overflow-x-hidden overflow-y-auto p-3 subpixel-antialiased sm:p-6 lg:p-8"
      style={{ background: "linear-gradient(135deg, #e0faff 0%, #ffffff 50%, #d4f1f9 100%)", colorScheme: "light" }}
    >
      <div className="relative flex w-full max-w-[1280px] flex-col items-center gap-8 overflow-hidden rounded-2xl border border-[#ffffff]/80 bg-[#ffffff]/50 p-4 shadow-[0_30px_60px_-15px_rgba(0,100,200,0.1)] backdrop-blur-md sm:p-6 md:min-h-[720px] md:gap-10 lg:flex-row-reverse lg:gap-16 lg:p-12">
        {/* Right Section: Login Form */}
        <div className="relative z-10 flex w-full max-w-[420px] flex-shrink-0 flex-col justify-center lg:w-[420px]">
          <div className="flex w-full flex-col overflow-hidden rounded-xl bg-[#ffffff] shadow-[0_15px_35px_-5px_rgba(0,100,200,0.15)]">
            <div className="bg-[#ffffff] p-6 sm:p-8 lg:p-10">
              {/* Brand Header inside Card */}
              <div className="mb-6 flex items-center justify-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[#ffffff]"
                  style={{ background: "linear-gradient(135deg, #0047cc, #00d4ff)" }}
                >
                  <span className="text-[16px] font-semibold">S</span>
                </div>
                <span className="text-[18px] font-semibold tracking-tight text-[#0a1e3f]">Shinhan Workspace</span>
              </div>

              <div className="mb-4 w-full border-b border-[#f3f4f6] pb-4 text-center">
                <h2 className="mb-1 text-[26px] font-semibold tracking-tight text-[#0a1e3f] sm:text-[30px]">
                  {authType === EAuthModes.SIGN_UP ? "Sign Up" : "Sign In"}
                </h2>
                <p className="text-[14px] font-semibold text-[#6b7280]">
                  {authType === EAuthModes.SIGN_UP ? "Create a new account" : "Use your Swing ID & password"}
                </p>
              </div>

              <AuthRoot authMode={authType} />
            </div>
          </div>
        </div>

        {/* Left Section: Copy & Illustration */}
        <div className="relative z-10 flex h-full w-full flex-1 flex-col items-center justify-center text-center">
          <div className="mt-2 flex w-full flex-1 flex-col items-center justify-center px-1 sm:px-4 lg:mt-0 lg:px-12">
            {/* Welcome Top Logo */}
            <div className="mb-2 flex flex-col items-center">
              <img
                src={ShinhanBankLogo}
                alt="Shinhan Bank Logo"
                className="mb-4 h-11 w-auto drop-shadow-md sm:mb-6 sm:h-14"
              />
              <h1 className="mb-1 max-w-[560px] text-[28px] leading-tight font-semibold tracking-tight text-[#0a1b3f] sm:text-[36px] lg:text-[40px] lg:leading-snug">
                Welcome to{" "}
                <span
                  className="inline-block bg-clip-text whitespace-nowrap text-transparent"
                  style={{
                    background: "linear-gradient(90deg, #003399 0%, #0066cc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Shinhan Workspace
                </span>
              </h1>
              <p className="mb-2 max-w-[520px] text-[14px] leading-[1.6] font-medium text-[#4b5563] sm:text-[16px] lg:text-[17px] lg:leading-[1.7]">
                Smart, Centralized Task Management.
                <br />
                Easy tracking for teams, effortless oversight for leaders. Empowering Shinhan&apos;s workforce to
                achieve more together.
              </p>
            </div>

            {/* Abstract Illustration Area */}
            <div className="relative flex h-[220px] w-full max-w-[600px] items-center justify-center sm:h-[320px] lg:h-[400px]">
              <div className="relative z-20 flex w-full items-center justify-center overflow-hidden rounded-xl sm:w-[110%]">
                <div className="pointer-events-none absolute inset-0 z-30 rounded-xl shadow-[inset_0_0_120px_80px_#ffffff]"></div>
                <img
                  src={LogonDashboardImage}
                  alt="Dashboard Illustration"
                  width={600}
                  height={400}
                  className="h-auto max-h-[100%] w-full object-contain mix-blend-multiply"
                />
              </div>

              {/* Decorative Elements */}
              <div className="bg-cyan-400 absolute top-0 right-0 -z-10 h-48 w-24 origin-bottom-right rotate-45 transform rounded-t-full opacity-20 blur-xl sm:h-64 sm:w-32"></div>
              <div className="bg-blue-300 absolute top-8 -left-8 h-20 w-20 animate-[pulse_3s_ease-in-out_infinite] rounded-full opacity-60 mix-blend-multiply blur-md sm:top-10 sm:-left-10 sm:h-24 sm:w-24"></div>
              <div
                className="bg-cyan-300 absolute right-8 bottom-8 h-24 w-24 animate-[pulse_3s_ease-in-out_infinite] rounded-full opacity-60 mix-blend-multiply blur-md sm:right-10 sm:bottom-10 sm:h-32 sm:w-32"
                style={{ animationDelay: "2s" }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <AuthFooter />
    </div>
  );
}
