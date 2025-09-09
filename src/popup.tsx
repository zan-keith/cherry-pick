import { useState } from "react"
import "./style.css"
function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div className="p-5 min-w-[300px]">
      <h1 className="text-lg font-semibold mb-4 text-center uppercase">
        Cherrypick Extension
      </h1>
      {/* <pre className="bg-gray-100 p-2 rounded w-full whitespace-pre-wrap break-words">
          This is a sample code block styled with Tailwind CSS
      </pre> */}

    </div>
  )
}

export default IndexPopup
