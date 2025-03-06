import * as React from "react";

import { ISvgIcons } from "./type";

export const CustomersIcon: React.FC<ISvgIcons> = ({ className = "text-current", ...rest }) => (
  <svg className={className} viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      fill="currentColor"
      d="M2 0.5C1.46957 0.5 0.960859 0.710714 0.585787 1.08579C0.210714 1.46086 0 1.96957 0 2.5V9.5C0 10.0304 0.210714 10.5391 0.585787 10.9142C0.960859 11.2893 1.46957 11.5 2 11.5H12C12.5304 11.5 13.0391 11.2893 13.4142 10.9142C13.7893 10.5391 14 10.0304 14 9.5V2.5C14 1.96957 13.7893 1.46086 13.4142 1.08579C13.0391 0.710714 12.5304 0.5 12 0.5H2ZM4.75 2.5C4.35218 2.5 3.97064 2.65804 3.68934 2.93934C3.40804 3.22064 3.25 3.60218 3.25 4C3.25 4.39782 3.40804 4.77936 3.68934 5.06066C3.97064 5.34196 4.35218 5.5 4.75 5.5C5.14782 5.5 5.52936 5.34196 5.81066 5.06066C6.09196 4.77936 6.25 4.39782 6.25 4C6.25 3.60218 6.09196 3.22064 5.81066 2.93934C5.52936 2.65804 5.14782 2.5 4.75 2.5ZM2.168 8.302C2.36215 7.77342 2.71385 7.31716 3.1756 6.99486C3.63735 6.67255 4.18689 6.49972 4.75 6.49972C5.31311 6.49972 5.86265 6.67255 6.3244 6.99486C6.78615 7.31716 7.13785 7.77342 7.332 8.302C7.37355 8.41526 7.37275 8.53973 7.32975 8.65245C7.28675 8.76516 7.20444 8.85853 7.098 8.91533C6.3753 9.30029 5.56883 9.50111 4.75 9.5C3.93117 9.50111 3.1247 9.30029 2.402 8.91533C2.29556 8.85853 2.21325 8.76516 2.17025 8.65245C2.12725 8.53973 2.12645 8.41526 2.168 8.302ZM9 3.5C8.86739 3.5 8.74022 3.55268 8.64645 3.64645C8.55268 3.74022 8.5 3.86739 8.5 4C8.5 4.13261 8.55268 4.25979 8.64645 4.35355C8.74022 4.44732 8.86739 4.5 9 4.5H11.5C11.6326 4.5 11.7598 4.44732 11.8536 4.35355C11.9473 4.25979 12 4.13261 12 4C12 3.86739 11.9473 3.74022 11.8536 3.64645C11.7598 3.55268 11.6326 3.5 11.5 3.5H9ZM8.5 6C8.5 5.86739 8.55268 5.74022 8.64645 5.64645C8.74022 5.55268 8.86739 5.5 9 5.5H11.5C11.6326 5.5 11.7598 5.55268 11.8536 5.64645C11.9473 5.74022 12 5.86739 12 6C12 6.13261 11.9473 6.25979 11.8536 6.35355C11.7598 6.44732 11.6326 6.5 11.5 6.5H9C8.86739 6.5 8.74022 6.44732 8.64645 6.35355C8.55268 6.25979 8.5 6.13261 8.5 6ZM9 7.5C8.86739 7.5 8.74022 7.55268 8.64645 7.64645C8.55268 7.74022 8.5 7.86739 8.5 8C8.5 8.13261 8.55268 8.25979 8.64645 8.35355C8.74022 8.44732 8.86739 8.5 9 8.5H11.5C11.6326 8.5 11.7598 8.44732 11.8536 8.35355C11.9473 8.25979 12 8.13261 12 8C12 7.86739 11.9473 7.74022 11.8536 7.64645C11.7598 7.55268 11.6326 7.5 11.5 7.5H9Z"
    />
  </svg>
);
