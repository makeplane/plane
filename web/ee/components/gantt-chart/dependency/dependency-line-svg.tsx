export const DependencyLineSVG = ({ strokeColor }: { strokeColor: string }) => (
  <svg className="w-4 h-full" xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 4 50`} width={5} height={50}>
    <g>
      <path d="M0,0 L0,50" stroke={strokeColor} stroke-width={`1.5`} fill="none" markerEnd={`url(#arrowhead)`} />
      <circle cx="0" cy="25" r="4" fill={strokeColor} />
    </g>
    <defs>
      <marker markerWidth="7" markerHeight="7" refX="4" refY="2.5" viewBox="0 0 5 5" orient="auto" id={`arrowhead`}>
        <polygon points="0,5 1.6666666666666667,2.5 0,0 5,2.5" fill={strokeColor} />
      </marker>
    </defs>
  </svg>
);
