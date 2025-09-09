import React, { useCallback, useState } from "react"
import "./style.css"
function IndexPopup() {
  const [data, setData] = useState("")
  const [selectMode, setSelectMode] = useState(false)
  const [selectedElements, setSelectedElements] = useState<HTMLElement[]>([])
 const handleClick = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "ALLOW_SELECTION" },
          (response) => {
            console.log("Response from content script:", response)
            selectedElements.push(response);
          }
        )
      }
    })
  }, [])


  return (
    <div className="p-5 min-w-[300px]">
      <h1 className="text-lg font-semibold mb-4 text-center uppercase">
        Cherrypick Extension
      </h1>

      <button onClick={handleClick} className="bg-yellow-400 text-black px-4 py-2 rounded mb-4 w-full" >
      Select Element
      </button>

      <div className="p-2 border rounded">
        <h2 className="font-semibold mb-2">Selected Elements:</h2>
        {selectedElements.length === 0 ? (
          <p className="text-gray-500">No elements selected yet.</p>
        ) : (
          <ul className="list-disc list-inside max-h-40 overflow-y-auto">
            {selectedElements.map((el, index) => (
              <li key={index} className="break-all">
                {el.outerHTML}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default IndexPopup
