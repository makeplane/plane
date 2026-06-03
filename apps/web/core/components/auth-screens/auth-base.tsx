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
      className="font-sans relative z-10 flex h-screen w-screen flex-col items-center justify-center overflow-hidden overflow-y-auto p-4 subpixel-antialiased sm:p-8"
      style={{ background: "linear-gradient(135deg, #e0faff 0%, #ffffff 50%, #d4f1f9 100%)", colorScheme: "light" }}
    >
      <div className="relative flex min-h-[750px] w-full max-w-[1280px] flex-col items-center gap-12 overflow-hidden rounded-2xl border border-[#ffffff]/80 bg-[#ffffff]/50 p-6 shadow-[0_30px_60px_-15px_rgba(0,100,200,0.1)] backdrop-blur-md md:flex-row-reverse md:gap-16 md:p-12">
        {/* Right Section: Login Form */}
        <div className="relative z-10 flex w-full flex-shrink-0 flex-col justify-center md:w-[420px]">
          <div className="flex w-full flex-col overflow-hidden rounded-xl bg-[#ffffff] shadow-[0_15px_35px_-5px_rgba(0,100,200,0.15)]">
            <div className="bg-[#ffffff] p-8 sm:p-10">
              {/* Brand Header inside Card */}
              <div className="mb-6 flex items-center justify-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-md text-[#ffffff]"
                  style={{ background: "linear-gradient(135deg, #0047cc, #00d4ff)" }}
                >
                  <span className="text-[16px] font-semibold">S</span>
                </div>
                <span className="text-[18px] font-semibold tracking-tight text-[#0a1e3f]">Daily Note</span>
              </div>

              <div className="mb-4 w-full border-b border-[#f3f4f6] pb-4 text-center">
                <h2 className="mb-1 text-[30px] font-semibold tracking-tight text-[#0a1e3f]">
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
          <div className="mt-8 flex w-full flex-1 flex-col items-center justify-center px-4 md:mt-0 md:px-12">
            {/* Welcome Top Logo */}
            <div className="mb-2 flex flex-col items-center">
              <img src={ShinhanBankLogo} alt="Shinhan Bank Logo" className="mb-6 h-14 w-auto drop-shadow-md" />
              <h1 className="mb-1 max-w-[500px] text-[36px] leading-snug font-semibold tracking-tight text-[#0a1b3f] sm:text-[40px]">
                Welcome to{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    background: "linear-gradient(90deg, #003399 0%, #0066cc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Daily Note
                </span>
              </h1>
              <h2 className="mb-4 text-[28px] leading-snug font-semibold tracking-tight text-[#0a1b3f] sm:text-[32px]">
                Task Management System
              </h2>
              <p className="mb-2 max-w-[500px] text-[17px] leading-[1.7] font-medium text-[#4b5563]">
                Smart, Centralized Task Management.
                <br />
                Easy tracking for teams, effortless oversight for leaders. Empowering Shinhan&apos;s workforce to
                achieve more together.
              </p>
            </div>

            {/* Abstract Illustration Area */}
            <div className="relative flex h-[300px] w-full max-w-[600px] items-center justify-center sm:h-[400px]">
              <div className="relative z-20 flex w-[110%] items-center justify-center overflow-hidden rounded-xl">
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
              <div className="bg-cyan-400 absolute top-0 right-0 -z-10 h-64 w-32 origin-bottom-right rotate-45 transform rounded-t-full opacity-20 blur-xl"></div>
              <div className="bg-blue-300 absolute top-10 -left-10 h-24 w-24 animate-[pulse_3s_ease-in-out_infinite] rounded-full opacity-60 mix-blend-multiply blur-md"></div>
              <div
                className="bg-cyan-300 absolute right-10 bottom-10 h-32 w-32 animate-[pulse_3s_ease-in-out_infinite] rounded-full opacity-60 mix-blend-multiply blur-md"
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
