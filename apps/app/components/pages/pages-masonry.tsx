import React from "react";

// ui
import { CustomMenu } from "components/ui";
// icons
import { PencilIcon, StarIcon, SwatchIcon, TrashIcon } from "@heroicons/react/24/outline";

const MasonryItem: React.FC<any> = (props) => (
  <div
    className="mb-6 w-full rounded-lg border border-gray-200 bg-white p-3"
    style={{
      backgroundColor: props.color,
    }}
  >
    <h2 className="text-lg font-medium">Personal Diary</h2>
    <p className="mt-2 text-sm leading-relaxed">{props.children}</p>
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => {}} type="button" className="z-10">
            <SwatchIcon className="h-4 w-4 " color="#858E96" />
          </button>
          {false ? (
            <button onClick={() => {}} className="z-10">
              <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
            </button>
          ) : (
            <button onClick={() => {}} type="button" className="z-10">
              <StarIcon className="h-4 w-4 " color="#858E96" />
            </button>
          )}
          <CustomMenu width="auto" verticalEllipsis>
            <CustomMenu.MenuItem onClick={() => {}}>
              <span className="flex items-center justify-start gap-2 text-gray-800">
                <PencilIcon className="h-4 w-4" />
                <span>Edit Page</span>
              </span>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={() => {}}>
              <span className="flex items-center justify-start gap-2 text-gray-800">
                <TrashIcon className="h-4 w-4" />
                <span>Delete Page</span>
              </span>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
        <p className="text-sm text-gray-400">9:41 PM</p>
      </div>
    </div>
  </div>
);

export default function PagesMasonry() {
  return (
    <div className="columns-4 gap-6">
      <MasonryItem color="#FF9E9E" isVideo>
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Impedit porro mollitia iure,
        reiciendis quo tempora rem debitis velit quas doloremque. Dicta velit voluptas, blanditiis
        excepturi vitae eum corporis totam eius?
      </MasonryItem>
      <MasonryItem>
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Impedit porro mollitia iure,
        reiciendis quo tempora rem debitis velit quas doloremque. Dicta velit voluptas, blanditiis
        excepturi vitae eum corporis totam eius? Lorem, ipsum dolor sit amet consectetur adipisicing
        elit. Impedit porro mollitia iure, reiciendis quo tempora rem debitis velit quas doloremque.
        Dicta velit voluptas, blanditiis excepturi vitae eum corporis totam eius?
      </MasonryItem>
      <MasonryItem color="#FCBE1D">
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Impedit porro mollitia iure,
        reiciendis quo tempora rem debitis velit quas doloremque. Dicta velit voluptas, blanditiis
        excepturi vitae eum corporis totam eius?
      </MasonryItem>
      <MasonryItem>
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. Impedit porro mollitia iure,
        reiciendis quo tempora rem debitis velit quas doloremque. Dicta velit voluptas, blanditiis
        excepturi vitae eum corporis totam eius? Lorem, ipsum dolor sit amet consectetur adipisicing
        elit. Impedit porro mollitia iure, reiciendis quo tempora rem debitis velit quas doloremque.
        Dicta velit voluptas, blanditiis excepturi vitae eum corporis totam eius?
      </MasonryItem>
    </div>
  );
}
