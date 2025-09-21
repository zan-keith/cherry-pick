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
      try {
        console.log("Processing HTML string:", htmlString)
        
        // Use DOMParser which handles table elements better
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlString, 'text/html')
        
        console.log("Parsed document body:", doc.body.innerHTML)
        console.log("All elements in document:", Array.from(doc.querySelectorAll('*')).map(el => `${el.tagName}${el.className ? '.' + el.className : ''}${el.id ? '#' + el.id : ''}`))
        
        // Find the actual target element
        let element: HTMLElement | null = null
        
        // Look for elements with our selection styles first
        const elementsWithOutline = doc.querySelectorAll('[style*="outline"]')
        console.log("Elements with outline:", elementsWithOutline.length, Array.from(elementsWithOutline).map(el => el.tagName))
        
        if (elementsWithOutline.length > 0) {
          element = elementsWithOutline[0] as HTMLElement
        } else {
          // For table elements, they get wrapped in proper table structure
          // Look for the specific tag type we're interested in
          const allElements = doc.querySelectorAll('*')
          console.log("All elements found:", Array.from(allElements).map(el => el.tagName))
          
          for (const el of allElements) {
            // Skip structural HTML elements
            if (!['HTML', 'HEAD', 'BODY', 'TABLE', 'TBODY', 'THEAD', 'TFOOT', 'TR', 'COLGROUP', 'COL'].includes(el.tagName)) {
              element = el as HTMLElement
              console.log("Selected element:", el.tagName, el.className, el.id)
              break
            }
          }
        }
        
        console.log("Found element:", element?.tagName, element?.className, element?.id)
        
        if (!element) {
          console.warn("No element found for HTML string, trying manual parsing:", htmlString)
          
          // Fallback: manual parsing of the HTML string
          const tagMatch = htmlString.match(/<(\w+)/)
          if (tagMatch) {
            const tagName = tagMatch[1].toLowerCase()
            console.log("Manually extracted tag:", tagName)
            tagCount[tagName] = (tagCount[tagName] || 0) + 1
            
            // Extract classes
            const classMatch = htmlString.match(/class=["']([^"']*)["']/)
            if (classMatch) {
              const classes = classMatch[1].split(/\s+/).filter(cls => cls.length > 0)
              classes.forEach(cls => {
                classCount[cls] = (classCount[cls] || 0) + 1
                console.log("Manually extracted class:", cls)
              })
            }
            
            // Extract ID
            const idMatch = htmlString.match(/id=["']([^"']*)["']/)
            if (idMatch) {
              const id = idMatch[1]
              idCount[id] = (idCount[id] || 0) + 1
              console.log("Manually extracted ID:", id)
            }
            
            // Extract other attributes (excluding our injected styles)
            const attrRegex = /(\w+)=["']([^"']*)["']/g
            let attrMatch
            while ((attrMatch = attrRegex.exec(htmlString)) !== null) {
              const [, name, value] = attrMatch
              if (!name.startsWith('on') && 
                  !['href', 'src'].includes(name)) {
                if (name === 'style') {
                  // Skip if it contains our selection styles
                  if (!value.includes('outline: rgb(255, 0, 0)') && 
                      !value.includes('background-color: rgba(255, 255, 0')) {
                    const key = `${name}=${value}`
                    attributeCount[key] = (attributeCount[key] || 0) + 1
                    console.log("Manually extracted attribute:", key)
                  }
                } else {
                  const key = `${name}=${value}`
                  attributeCount[key] = (attributeCount[key] || 0) + 1
                  console.log("Manually extracted attribute:", key)
                }
              }
            }
          }
          return
        }

        // Tag name
        const tagName = element.tagName.toLowerCase()
        tagCount[tagName] = (tagCount[tagName] || 0) + 1
        console.log("Tag name:", tagName, "Count:", tagCount[tagName])

        // Classes
        element.classList.forEach((cls) => {
          classCount[cls] = (classCount[cls] || 0) + 1
          console.log("Class:", cls, "Count:", classCount[cls])
        })

        // IDs
        if (element.id) {
          idCount[element.id] = (idCount[element.id] || 0) + 1
          console.log("ID:", element.id, "Count:", idCount[element.id])
        }

        // Other attributes (excluding potentially dangerous ones and our injected styles)
        Array.from(element.attributes).forEach(attr => {
          // Skip event handlers, script-related attributes, and our added styles
          if (!attr.name.startsWith('on') && 
              !['href', 'src'].includes(attr.name)) {
            // For style attribute, only include if it doesn't contain our selection styles
            if (attr.name === 'style') {
              const styleValue = attr.value
              // Skip if it contains our selection outline or background color
              if (!styleValue.includes('outline: rgb(255, 0, 0)') && 
                  !styleValue.includes('background-color: rgba(255, 255, 0')) {
                const key = `${attr.name}=${attr.value}`
                attributeCount[key] = (attributeCount[key] || 0) + 1
                console.log("Attribute:", key, "Count:", attributeCount[key])
              }
            } else {
              const key = `${attr.name}=${attr.value}`
              attributeCount[key] = (attributeCount[key] || 0) + 1
              console.log("Attribute:", key, "Count:", attributeCount[key])
            }
          }
        })
      } catch (error) {
        console.error("Error parsing HTML element:", htmlString, error)
        return
      }
    })

    const total = elements.length
    console.log("Total elements:", total)
    console.log("Tag counts:", tagCount)
    console.log("Class counts:", classCount)
    console.log("ID counts:", idCount)
    console.log("Attribute counts:", attributeCount)
    
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

    const result = { tags: commonTags, classes: commonClasses, ids: commonIds, attributes: commonAttributes }
    console.log("Final common identifiers:", result)
    
    setCommonIdentifiers(result)
    return result
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
      window.close();
  }, [])
function removeSelectedElement(index) {
    const updatedElements = [...(liveSelectionStorageData || [])]
    updatedElements.splice(index, 1)
    setLiveSelectionStorageData(updatedElements)
    getCommonIdentifiers(updatedElements)
  }
  function innerText(htmlString) {
    const doc = new DOMParser().parseFromString(htmlString, "text/html")
    return doc.body.textContent || ''
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
<div className="w-full text-center mb-1 mt-2">
  <a target="_blank" href="https://github.com/zan-keith/cherry-pick">Made with ❤️ by Zan Keith</a>
</div>
    </div>
  )
}

export default IndexPopup
