import React from 'react'
import { X } from 'lucide-react'

const Banner = () => (
    <div className="flex flex-row justify-between border border-custom-border-200 p-4">
      <div className="flex flex-col">
          <div>
            Welcome To Drafts
          </div>
          <div>
            This is where all issues and comments that you drafted but haven&apos;t sent yet are
          </div>
      </div>
      <div className="flex flex-col justify-center align-middle">
        <X/>
      </div>
    </div>
  )

export default Banner
