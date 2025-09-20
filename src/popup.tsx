import React, { useCallback, useState } from "react"
import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"
import "./style.css"
import { BadgeQuestionMark, ChartNoAxesGantt, ChevronDown, ChevronDownSquare, ChevronUp, ChevronUpSquare, ClipboardList, CodeXml } from "lucide-react"
import icon from "../assets/icon.png"
function IndexPopup() {

  const [liveSelectionStorageData, setLiveSelectionStorageData] = useStorage({key: "selectedElements",instance: new Storage({
    area: "local"
  })
})
  const [sampleSelectionResult, setSampleSelectionResult] = useStorage({key: "sampleSelectionResult",instance: new Storage({
    area: "local"
  })
})

  const [selectElementView, setSelectElementView] = useState(true)
  const [sampleSelectionView, setSampleSelectionView] = useState(false)
  const [commonIdentifiers, setCommonIdentifiers] = useState({ tags: [], classes: [], ids: [], attributes: {} })

  React.useEffect(() => {
    if(sampleSelectionResult && sampleSelectionResult.length > 0) {
      setSampleSelectionView(true)
      setSelectElementView(false)
    }
  },[sampleSelectionResult])
  React.useEffect(() => {
    getCommonIdentifiers(liveSelectionStorageData || [])
  }, [liveSelectionStorageData])

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

  const clearSamples = useCallback(() => {
    console.log("Clearing sample selection results")
    setSampleSelectionResult([])
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "CLEAR_ALL_HIGHLIGHTS" },
          (response) => {
            console.log("Response from content script:", response)
          }
        )
      }
    })

  }, [])


  async function handleClearAll() {
  console.log("Clearing all selected elements")
  setLiveSelectionStorageData([])
  setCommonIdentifiers({ tags: [], classes: [], ids: [], attributes: {} })
    // storage.set("selectedElements", []);
    // setSelectedElements([])
  }

  function generateSelector(identifiers) {
        let selector = ""
    if (identifiers.tags.length > 0) {
      selector += identifiers.tags[0]
    } else {
      selector += "*"
    }
    if (identifiers.classes.length > 0) {
      selector += identifiers.classes.map(cls => `.${cls.replace(/:/g, "\\:")}`).join("")
    }
    if (identifiers.ids.length > 0) {
      selector += identifiers.ids.map(id => `#${id}`).join("")
    }
    Object.entries(identifiers.attributes || {}).forEach(([name, value]) => {
      // Only include attributes that are valid for selectors (skip style)
      if (name !== "style") {
        // Check for valid CSS attribute value (no semicolons, colons, etc.)
        if (/^[^:;]+$/.test(String(value))) {
          selector += `[${name}="${value}"]`
        }
      }
    })
    console.log("Constructed selector:", selector)
    return selector
  }


  const selectCommonElements = useCallback(() => {
  if (!liveSelectionStorageData || liveSelectionStorageData.length === 0) return
  const identifiers = getCommonIdentifiers(liveSelectionStorageData)
    console.log("Selecting common elements with identifiers:", identifiers)
    let selector = generateSelector(identifiers)

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "SELECT_ELEMENTS", selector },
          (response) => {
            console.log("Response from content script:", response)
            if (response && response.elements) {
              console.log("Elements received:", response.elements)
              setSampleSelectionResult(response.elements)
            } else {
              setSampleSelectionResult([])
            }
          }
        )
      }
    })
  }, [liveSelectionStorageData])
    
  

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
function removeSelectedElement(index) {
    const updatedElements = [...(liveSelectionStorageData || [])]
    updatedElements.splice(index, 1)
    setLiveSelectionStorageData(updatedElements)
    getCommonIdentifiers(updatedElements)
  }
  function innerText(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, "text/html")
    return doc.body.innerText
  }


  function copyToClipboard(txt) {
    if (!txt) return
    navigator.clipboard.writeText(txt).then(() => {
      console.log("Data copied to clipboard")
    }).catch((err) => {
      console.error("Could not copy text: ", err)
    })
  }
  function generateJS() {
    if (!liveSelectionStorageData || liveSelectionStorageData.length === 0) return
    const identifiers = getCommonIdentifiers(liveSelectionStorageData)
    let selector = generateSelector(identifiers)
    if (!selector || selector === "") selector = "*"
    const jsCode = `document.querySelectorAll("${selector}")`
    return jsCode
  }
  
  return (
    <div className="p-2 min-w-[400px]">
      <div className="border-l-4 pl-2 mb-2 flex justify-between">

<div className="flex gap-2 items-center">
  <img src={icon} className="w-10 h-10" alt="" />
<div>

      <h1 className="text-lg font-bold  text-left w-full tracking-wider ">
        Cherrypick <span className="text-red-500">.</span>
      </h1>
      <p className="text-xs text-gray-500">Select elements to cherry pick</p>
</div>
</div>
<a href="https://github.com/zan-keith/cherry-pick" target="_blank" className="font-semibold flex gap-1 px-2 items-center border p-1 rounded-lg bg-gray-200 cursor-pointer">
  How To
  <BadgeQuestionMark />
</a>
      </div>
      <div className="flex items-center flex-col w-full border rounded p-2">
<div className=" flex justify-between w-full gap-2">

      <button onClick={handleClick} className="bg-yellow-400 text-black px-4  rounded-lg w-full h-10 font-semibold" >
        Pick Elements
      </button>
      <button className="cursor-pointer">
        {selectElementView
          ? <ChevronUp   onClick={() => setSelectElementView(false)}/>
          : <ChevronDown  onClick={() => setSelectElementView(true)}/>
        }
      </button>
      </div>

      {selectElementView && (
        <div className="w-full mt-2">
      <div className="p-2 border rounded w-full">
        <div className="flex justify-between items-center w-full">

      <h2 className="font-semibold ">Selected Elements: ({(liveSelectionStorageData || []).length})</h2>
          <button onClick={handleClearAll} className=" bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">Clear All</button>
        </div>
        <hr className="my-1"/>
        {(liveSelectionStorageData || []).length === 0 ? (
          <p className="text-gray-500">No elements selected yet.</p>
        ) : (
          <div className=" max-h-40 overflow-y-auto gap-1 flex flex-col">
            {(liveSelectionStorageData || []).map((el, index) => (
              <button key={index} className="text-left bg-gray-100 hover:bg-red-200 cursor-pointer" onClick={() => removeSelectedElement(index)}>
                <pre className="text-left break-all whitespace-pre-wrap">
                  {innerText(el)}
                </pre>
              </button>
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
            {commonIdentifiers.attributes && Object.keys(commonIdentifiers.attributes).length > 0 && (
              <div>
                <span className="font-semibold">Attributes:</span>
                {Object.entries(commonIdentifiers.attributes).map(([name, value], idx) => (
                  <p key={idx} className="bg-gray-200 px-2 py-1 rounded text-xs">{name}="{String(value)}"</p>
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
      )}
</div>
<div className="p-2 border rounded mt-2">

<div className="flex w-full justify-between items-center  gap-2">

<button
  onClick={selectCommonElements}
  className="bg-blue-500 text-white font-semibold px-4  rounded-lg w-full h-10">
  Scrape Elements
</button>
      <button className="cursor-pointer">

{
  sampleSelectionView ? <ChevronUp onClick={() => setSampleSelectionView(false)}/> : <ChevronDown onClick={() => setSampleSelectionView(true)}/>
}
      </button>
</div>
{sampleSelectionView && (
<div className="w-full mt-2">

   <div className="p-2 border rounded">
        <div className="flex justify-between items-center ">

          <h2 className="font-semibold ">Found Elements: ({sampleSelectionResult.length})</h2>
          <button onClick={clearSamples} className=" bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">Clear All</button>
        </div>
        <hr className="my-1"/>
        {sampleSelectionResult.length === 0 ? (
          <p className="text-gray-500">No elements selected yet.</p>
        ) : (
          <div className=" max-h-40 overflow-y-auto gap-1 flex flex-col">
            {sampleSelectionResult.map((el, index) => (
              <div key={index} className="text-left bg-gray-100">
                <pre className="text-left break-all whitespace-pre-wrap">
                  {innerText(el)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      )}
<div className="flex w-full gap-2 justify-end mt-2">
  <button
    onClick={() => copyToClipboard(sampleSelectionResult.map(innerText).join("\n"))}
    className="text-gray-500 cursor-pointer border p-1 rounded bg-gray-100 hover:bg-gray-200 flex gap-1 items-center"
  >
    <ClipboardList size={24} className="" />
    Copy Data
  </button>
    {/* <button className="text-gray-500 cursor-pointer border p-1 rounded bg-gray-100 hover:bg-gray-200 flex gap-1 items-center">

    <ChartNoAxesGantt  size={24} className=""/>
    Copy Object
  </button> */}
      <button onClick={() => copyToClipboard(generateJS())} className="text-gray-500 cursor-pointer border p-1 rounded bg-gray-100 hover:bg-gray-200 flex gap-1 items-center">

    <CodeXml  size={24} className=""/>
    JS Snippet
  </button>
    {/* <CodeXml  size={32} className="text-gray-500 cursor-pointer border p-1 rounded bg-gray-100 hover:bg-gray-200"/> */}
</div>
</div>

    </div>
  )
}

export default IndexPopup
