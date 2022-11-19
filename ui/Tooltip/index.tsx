import React, { useEffect, useRef, useState } from "react";

type TooltipProps = {
  content: string;
  position: string;
  children: any;
  className?: string;
};

const Tooltip: React.FC<TooltipProps> = (props) => {
  const myRef = useRef<any>();
  const myRef2 = useRef<any>();

  const [position, setPosition] = useState<any>({});
  const [show, setShow] = useState<any>(false);

  useEffect(() => {
    const contentHeight = myRef2.current.clientHeight;

    const pos = {
      x: myRef.current.offsetLeft + myRef.current.clientWidth / 2,
      y: myRef.current.offsetTop,
    };

    setPosition(pos);
  }, []);

  return (
    <>
      <div className="inline-block z-99" ref={myRef}>
        <span
          className={`bg-black text-white p-2 rounded text-xs fixed ${
            props.position === "top" || props.position === "bottom"
              ? "translate-x-[-50%]"
              : "translate-y-[-50%]"
          } duration-300 ${
            show ? "opacity-1 pointer-events-all" : "opacity-0 pointer-events-none"
          } ${props.className}`}
          style={{ top: `${position.y}px`, left: `${position.x}px` }}
          ref={myRef2}
        >
          {props.content}
          {/* Lorem ipsum, dolor sit amet consectetur adipisicing elit.Illo consequuntur libero placeat
          porro facere itaque vitae, iusto quos fugiat consequatur. */}
        </span>
        {React.cloneElement(props.children, {
          onMouseOver: () => setShow(true),
          onMouseOut: () => setShow(false),
        })}
      </div>
    </>
  );
};

Tooltip.defaultProps = {
  position: "top",
};

export default Tooltip;
