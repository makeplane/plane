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
      className="relative z-10 flex min-h-dvh w-screen flex-col items-center justify-center overflow-x-hidden overflow-y-auto p-3 font-sans subpixel-antialiased sm:p-6 lg:p-8"
      style={{ background: "linear-gradient(135deg, #e0faff 0%, #ffffff 50%, #d4f1f9 100%)", colorScheme: "light" }}
    >
      <div className="relative flex w-full max-w-[1280px] flex-col items-center gap-8 overflow-hidden rounded-2xl border border-[#ffffff]/80 bg-[#ffffff]/50 p-4 shadow-[0_30px_60px_-15px_rgba(0,100,200,0.1)] backdrop-blur-md sm:p-6 md:min-h-[720px] md:gap-10 lg:flex-row-reverse lg:gap-16 lg:p-12">
        {/* Right Section: Login Form */}
        <div className="relative z-10 flex w-full max-w-[420px] flex-shrink-0 flex-col justify-center lg:w-[420px]">
          <div className="w-full overflow-hidden flex flex-col rounded-xl bg-[#ffffff] shadow-[0_15px_35px_-5px_rgba(0,100,200,0.15)]">
            <div className="bg-[#ffffff] p-6 sm:p-8 lg:p-10">
              {/* Brand Header inside Card */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[#ffffff]"
                  style={{ background: "linear-gradient(135deg, #0047cc, #00d4ff)" }}
                >
                  <span className="font-semibold text-[16px]">S</span>
                </div>
                <span className="text-[#0a1e3f] font-semibold text-[18px] tracking-tight">Shinhan Workspace</span>
              </div>

              <div className="mb-4 pb-4 border-b border-[#f3f4f6] w-full text-center">
                <h2 className="text-[26px] font-semibold text-[#0a1e3f] mb-1 tracking-tight sm:text-[30px]">
                  {authType === EAuthModes.SIGN_UP ? "Sign Up" : "Sign In"}
                </h2>
                <p className="text-[14px] text-[#6b7280] font-semibold">
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
                className="mb-4 h-11 w-auto drop-shadow-md sm:h-14 sm:mb-6"
              />
              <h1 className="mb-1 max-w-[560px] text-[28px] font-semibold leading-tight tracking-tight text-[#0a1b3f] sm:text-[36px] lg:text-[40px] lg:leading-snug">
                Welcome to{" "}
                <span
                  className="inline-block whitespace-nowrap bg-clip-text text-transparent"
                  style={{
                    background: "linear-gradient(90deg, #003399 0%, #0066cc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Shinhan Workspace
                </span>
              </h1>
              <p className="mb-2 max-w-[520px] text-[14px] font-medium leading-[1.6] text-[#4b5563] sm:text-[16px] lg:text-[17px] lg:leading-[1.7]">
                Smart, Centralized Task Management.
                <br />
                Easy tracking for teams, effortless oversight for leaders. Empowering Shinhan&apos;s workforce to
                achieve more together.
              </p>
            </div>

            {/* Abstract Illustration Area */}
            <div className="relative flex h-[220px] w-full max-w-[600px] items-center justify-center sm:h-[320px] lg:h-[400px]">
              <div className="relative z-20 flex w-full items-center justify-center overflow-hidden rounded-xl sm:w-[110%]">
                <div className="absolute inset-0 shadow-[inset_0_0_120px_80px_#ffffff] pointer-events-none z-30 rounded-xl"></div>
                <img
                  src={LogonDashboardImage}
                  alt="Dashboard Illustration"
                  width={600}
                  height={400}
                  className="w-full h-auto max-h-[100%] object-contain mix-blend-multiply"
                />
              </div>

              {/* Decorative Elements */}
              <div className="absolute right-0 top-0 -z-10 h-48 w-24 origin-bottom-right rotate-45 transform rounded-t-full bg-cyan-400 opacity-20 blur-xl sm:h-64 sm:w-32"></div>
              <div className="absolute -left-8 top-8 h-20 w-20 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-blue-300 opacity-60 mix-blend-multiply blur-md sm:-left-10 sm:top-10 sm:h-24 sm:w-24"></div>
              <div
                className="absolute bottom-8 right-8 h-24 w-24 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-cyan-300 opacity-60 mix-blend-multiply blur-md sm:bottom-10 sm:right-10 sm:h-32 sm:w-32"
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
