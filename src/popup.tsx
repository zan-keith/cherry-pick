import React, { useCallback, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"
function IndexPopup() {

  const [selectedElements, setSelectedElements] = useState([])
  const [data, setData] = useStorage("selectedElements")
  React.useEffect(() => {
    if (data) {
      setSelectedElements(data)
    }
  }, [data])

  async function handleClearAll() {
    console.log("Clearing all selected elements")
    setData([])
    setSelectedElements([])
    // storage.set("selectedElements", []);
    // setSelectedElements([])
  }
  const handleClick = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "ALLOW_SELECTION" },
          (response) => {
            console.log("Response from content script:", response)

          }
        )
      }
    })
  }, [])

  function innerText(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, "text/html")
    return doc.body.innerText
  }

  return (
    <div className="p-5 min-w-[300px]">
      <h1 className="text-lg font-semibold mb-4 text-center uppercase">
        Cherrypick Extension
      </h1>
      <button onClick={handleClick} className="bg-yellow-400 text-black px-4 py-2 rounded mb-4 w-full" >
        Select Element
      </button>

      <div className="p-2 border rounded">
        <div className="flex justify-between items-center ">

          <h2 className="font-semibold ">Selected Elements: ({selectedElements.length})</h2>
          <button onClick={handleClearAll} className=" bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">Clear All</button>
        </div>
        <hr className="my-1"/>
        {selectedElements.length === 0 ? (
          <p className="text-gray-500">No elements selected yet.</p>
        ) : (
          <div className=" max-h-40 overflow-y-auto gap-1 flex flex-col">
            {selectedElements.map((el, index) => (
              <div key={index} className="text-left bg-gray-100">
                <pre className="text-left break-all whitespace-pre-wrap">
                  {innerText(el)}

                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
      
        <div className="w-full mt-2">
          <h3 className="font-semibold">
            Common Identifiers found:
          </h3>

        </div>

    </div>
  )
}

export default IndexPopup
