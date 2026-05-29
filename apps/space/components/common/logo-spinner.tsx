import React from "react";

export function LogoSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 select-none">
      <style>{`
        @keyframes drawShield {
          0% {
            stroke-dashoffset: 100;
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            stroke-dashoffset: 0;
            opacity: 1;
          }
        }
        @keyframes fadeInW {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulseLogo {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(63, 118, 255, 0.4)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 12px rgba(0, 240, 255, 0.6)); }
        }
        @keyframes fadeInWordmark {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .shield-path {
          stroke: #1b6ec2;
          stroke-width: 1.5;
          stroke-dasharray: 100;
          animation: drawShield 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .w-path {
          opacity: 0;
          animation: fadeInW 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards 0.8s;
        }
        .logo-container {
          animation: pulseLogo 2.5s infinite ease-in-out 1.8s;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .wordmark-container {
          opacity: 0;
          animation: fadeInWordmark 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards 1.2s;
        }
      `}</style>
      <div className="logo-container">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            className="shield-path"
            d="M12 2L4 5v6c0 5.25 3.41 10.17 8 11 4.59-.83 8-5.75 8-11V5l-8-3zm0 2.18c3.42.71 6 3.82 6 7.42 0 4.15-2.73 8.07-6 8.92-3.27-.85-6-4.77-6-8.92 0-3.6 2.58-6.71 6-7.42z"
          />
          <path
            className="w-path"
            d="M8.5 8.5L10.5 13.5L12 11.5L13.5 13.5L15.5 8.5H14.25L13.25 11.25L12 9.5L10.75 11.25L9.75 8.5H8.5Z"
            fill="#1b6ec2"
          />
        </svg>
        <div className="wordmark-container mt-3">
          <span
            className="font-black text-20"
            style={{ fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.05em", color: "#1b6ec2" }}
          >
            WinSecOps
          </span>
        </div>
      </div>
    </div>
  );
}
