import React from "react";

interface IHeaderCard {}

export const HeaderCard = ({}: IHeaderCard) => {
  console.log("KanBanHeader");

  return (
    <div className="border border-red-500">
      <div>icon</div>
      <div>title</div>
      <div>Minimise</div>
      {/* <div></div> */}
    </div>
  );
};
