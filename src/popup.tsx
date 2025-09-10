import React, { useCallback, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"
function IndexPopup() {

  const [selectedElements, setSelectedElements] = useState([])
  const [data, setData] = useStorage("selectedElements")
  const [commonIdentifiers, setCommonIdentifiers] = useState({ tags: [], classes: [], ids: [] })
  React.useEffect(() => {
    if (data) {
      setSelectedElements(data)

      getCommonIdentifiers(data)


    }
  }, [data])

  function getCommonIdentifiers(elements) {
    if (elements.length === 0) return { tags: [], classes: [], ids: [], attributes: {} }
    const tagCount = {}
    const classCount = {}
    const idCount = {}
    const attributeCount = {}

    elements.forEach((htmlString) => {
      const doc = new DOMParser().parseFromString(htmlString, "text/html")
      const element = doc.body.firstChild as HTMLElement
      if (!element) return

      // Tag name
      const tagName = element.tagName.toLowerCase()
      tagCount[tagName] = (tagCount[tagName] || 0) + 1

      // Classes
      element.classList.forEach((cls) => {
        classCount[cls] = (classCount[cls] || 0) + 1
      })

      // IDs
      if (element.id) {
        idCount[element.id] = (idCount[element.id] || 0) + 1
      }

      // Other attributes
      Array.from(element.attributes).forEach(attr => {
        const key = `${attr.name}=${attr.value}`
        attributeCount[key] = (attributeCount[key] || 0) + 1
      })
    })

    const total = elements.length
    const commonTags = Object.keys(tagCount).filter(tag => tagCount[tag] === total)
    const commonClasses = Object.keys(classCount).filter(cls => classCount[cls] === total)
    const commonIds = Object.keys(idCount).filter(id => idCount[id] === total)

    // Find common attributes and their values
    const commonAttributes = {}
    Object.keys(attributeCount).forEach(key => {
      if (attributeCount[key] === total) {
        const [name, value] = key.split("=")
        commonAttributes[name] = value
      }
    })

    setCommonIdentifiers({ tags: commonTags, classes: commonClasses, ids: commonIds, attributes: commonAttributes })
    return { tags: commonTags, classes: commonClasses, ids: commonIds, attributes: commonAttributes }
  }
  async function handleClearAll() {
    console.log("Clearing all selected elements")
    setData([])
    setSelectedElements([])
    setCommonIdentifiers({ tags: [], classes: [], ids: [] })
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
            Common Identifiers found: ({commonIdentifiers.tags.length + commonIdentifiers.classes.length + commonIdentifiers.ids.length})
          </h3>
          <div className="text-sm">
            {commonIdentifiers.tags.length > 0 && (
              <p><span className="font-semibold">Tags:</span> {commonIdentifiers.tags.join(", ")}</p>
            )}
            {commonIdentifiers.classes.length > 0 && (
              <div className="flex gap-1 items-center"><p className="font-semibold">Classes:</p>
              {commonIdentifiers.classes.map((cls, idx) => (
                <p key={idx} className="bg-gray-200 px-2 py-1 rounded text-xs">{cls}</p>
              ))}
              </div>
            )}
            {Object.keys(commonIdentifiers.attributes || {}).length > 0 && (
              <div>
                <span className="font-semibold">Attributes:</span>
                {Object.entries(commonIdentifiers.attributes).map(([name, value], idx) => (
                  <p key={idx} className="bg-gray-200 px-2 py-1 rounded text-xs">{name}="{value}"</p>
                ))}
              </div>
            )}

            {/* Dont really need ids since they shouldnt be duplicated but, whatever*/}
            {commonIdentifiers.ids.length > 0 && (
              <p><span className="font-semibold">IDs:</span>{commonIdentifiers.ids.join(", ")}</p>
            )}
          </div>
</div>
    </div>
  )
}

export default IndexPopup
