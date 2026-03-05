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
      className="relative z-10 flex flex-col items-center justify-center w-screen h-screen overflow-hidden overflow-y-auto p-4 sm:p-8 font-sans subpixel-antialiased"
      style={{ background: "linear-gradient(135deg, #e0faff 0%, #ffffff 50%, #d4f1f9 100%)", colorScheme: "light" }}
    >
      <div className="w-full max-w-[1280px] min-h-[750px] flex flex-col md:flex-row-reverse items-center p-6 md:p-12 relative overflow-hidden gap-12 md:gap-16 rounded-2xl border border-[#ffffff]/80 shadow-[0_30px_60px_-15px_rgba(0,100,200,0.1)] backdrop-blur-md bg-[#ffffff]/50">
        {/* Right Section: Login Form */}
        <div className="w-full md:w-[420px] relative z-10 flex flex-col justify-center flex-shrink-0">
          <div className="w-full overflow-hidden flex flex-col rounded-xl bg-[#ffffff] shadow-[0_15px_35px_-5px_rgba(0,100,200,0.15)]">
            <div className="p-8 sm:p-10 bg-[#ffffff]">
              {/* Brand Header inside Card */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div
                  className="w-8 h-8 rounded-md flex items-center justify-center text-[#ffffff]"
                  style={{ background: "linear-gradient(135deg, #0047cc, #00d4ff)" }}
                >
                  <span className="font-semibold text-[16px]">S</span>
                </div>
                <span className="text-[#0a1e3f] font-semibold text-[18px] tracking-tight">Daily Note</span>
              </div>

              <div className="mb-4 pb-4 border-b border-[#f3f4f6] w-full text-center">
                <h2 className="text-[30px] font-semibold text-[#0a1e3f] mb-1 tracking-tight">
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
        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 w-full h-full">
          <div className="w-full flex-1 flex flex-col items-center justify-center px-4 md:px-12 mt-8 md:mt-0">
            {/* Welcome Top Logo */}
            <div className="mb-2 flex flex-col items-center">
              <img src={ShinhanBankLogo} alt="Shinhan Bank Logo" className="h-14 w-auto mb-6 drop-shadow-md" />
              <h1 className="text-[#0a1b3f] text-[36px] sm:text-[40px] font-semibold tracking-tight leading-snug mb-1 max-w-[500px]">
                Welcome to{" "}
                <span
                  className="text-transparent bg-clip-text"
                  style={{
                    background: "linear-gradient(90deg, #003399 0%, #0066cc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Daily Note
                </span>
              </h1>
              <h2 className="text-[#0a1b3f] text-[28px] sm:text-[32px] font-semibold tracking-tight leading-snug mb-4">
                Task Management System
              </h2>
              <p className="text-[#4b5563] text-[17px] font-medium leading-[1.7] max-w-[500px] mb-2">
                Smart, Centralized Task Management.
                <br />
                Easy tracking for teams, effortless oversight for leaders. Empowering Shinhan&apos;s workforce to
                achieve more together.
              </p>
            </div>

            {/* Abstract Illustration Area */}
            <div className="relative w-full max-w-[600px] h-[300px] sm:h-[400px] flex items-center justify-center">
              <div className="relative w-[110%] z-20 flex justify-center items-center overflow-hidden rounded-xl">
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
              <div className="absolute right-0 top-0 w-32 h-64 bg-cyan-400 rotate-45 transform origin-bottom-right rounded-t-full opacity-20 -z-10 blur-xl"></div>
              <div className="absolute -left-10 top-10 w-24 h-24 bg-blue-300 rounded-full opacity-60 mix-blend-multiply blur-md animate-[pulse_3s_ease-in-out_infinite]"></div>
              <div
                className="absolute right-10 bottom-10 w-32 h-32 bg-cyan-300 rounded-full opacity-60 mix-blend-multiply blur-md animate-[pulse_3s_ease-in-out_infinite]"
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
