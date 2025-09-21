import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"



let lastHovered: HTMLElement | null = null;
let selectionAllowed = false;
let sendSelectionCallback: ((element: HTMLElement) => void) | null = null;
let mouseX = 0;
let mouseY = 0;
let elementsUnderPointer: HTMLElement[] = [];
let currentElementIndex = 0;

function safeElementSerializer(element: HTMLElement): string {
    // Create a safe serialization without using innerHTML
    const clone = element.cloneNode(true) as HTMLElement;
    // Remove any potentially dangerous attributes
    clone.removeAttribute('onclick');
    clone.removeAttribute('onload');
    clone.removeAttribute('onerror');
    // Remove script tags
    const scripts = clone.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    return clone.outerHTML;
}

function handleClick(e: MouseEvent) {
    if (!selectionAllowed) return;
    if (lastHovered instanceof HTMLElement) {
        console.log('Clicked element:', lastHovered);
        setSelectedElements(safeElementSerializer(lastHovered));
        if (sendSelectionCallback) {
            sendSelectionCallback(lastHovered);
            sendSelectionCallback = null;
        }
        lastHovered.style.outline = '';
        lastHovered.style.backgroundColor = '';
        lastHovered = null;
        selectionAllowed = false;
        e.stopPropagation();
        e.preventDefault();
        removeListeners();
    }
}

function handleMouseOver(e: MouseEvent) {
    if (!selectionAllowed) return;
    const target = e.target as HTMLElement;
    if (lastHovered && lastHovered !== target) {
        lastHovered.style.outline = '';
        lastHovered.style.backgroundColor = '';
    }
    if (target instanceof HTMLElement) {
        target.style.outline = '2px solid #ff0000';
        target.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
        lastHovered = target;
    }
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateElementsUnderPointer();
}

function handleMouseOut(e: MouseEvent) {
    if (!selectionAllowed) return;
    const target = e.target as HTMLElement;
    if (target instanceof HTMLElement) {
        target.style.outline = '';
        target.style.backgroundColor = '';
        if (lastHovered === target) {
            lastHovered = null;
        }
    }
}

function handleEscapeKey(e: KeyboardEvent) {
    if (!selectionAllowed) return;
    if (e.key === "Escape") {
        // Clear highlight
        if (lastHovered) {
            lastHovered.style.outline = '';
            lastHovered.style.backgroundColor = '';
            lastHovered = null;
        }
        selectionAllowed = false;
        sendSelectionCallback = null;
        removeListeners();
        e.stopPropagation();
        e.preventDefault();
    }
}

function addListeners() {
    document.body.addEventListener('mouseover', handleMouseOver, true);
    document.body.addEventListener('mouseout', handleMouseOut, true);
    document.body.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleEscapeKey, true);
    document.addEventListener('keydown', handleSpacebarCycle, true);
    document.body.addEventListener('mousemove', handleMouseMove, true);
}

function removeListeners() {
    document.body.removeEventListener('mouseover', handleMouseOver, true);
    document.body.removeEventListener('mouseout', handleMouseOut, true);
    document.body.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleEscapeKey, true);
    document.removeEventListener('keydown', handleSpacebarCycle, true);
    document.body.removeEventListener('mousemove', handleMouseMove, true);
}

function handleMouseMove(e: MouseEvent) {
    if (!selectionAllowed) return;
    mouseX = e.clientX;
    mouseY = e.clientY;
    updateElementsUnderPointer();
}

function updateElementsUnderPointer() {
    const elements = document.elementsFromPoint(mouseX, mouseY).filter(el => el instanceof HTMLElement) as HTMLElement[];
    elementsUnderPointer = elements;
    currentElementIndex = 0;
    highlightCurrentElement();
}

function highlightCurrentElement() {
    if (lastHovered) {
        lastHovered.style.outline = '';
        lastHovered.style.backgroundColor = '';
    }
    if (elementsUnderPointer.length > 0) {
        const el = elementsUnderPointer[currentElementIndex];
        el.style.outline = '2px solid #ff0000';
        el.style.backgroundColor = 'rgba(255, 255, 0, 0.5)';
        lastHovered = el;
    } else {
        lastHovered = null;
    }
}

function handleSpacebarCycle(e: KeyboardEvent) {
    if (!selectionAllowed) return;
    if (e.key === ' ' || e.code === 'Space') {
        if (elementsUnderPointer.length > 1) {
            currentElementIndex = (currentElementIndex + 1) % elementsUnderPointer.length;
            highlightCurrentElement();
            e.preventDefault();
            e.stopPropagation();
        }
    }
}

async function setSelectedElements(element) {
    const storage = new Storage({
  area: "local"
})
    let prevElements = await storage.get("selectedElements") || [];
    storage.set("selectedElements", [...prevElements, element]);
    console.log("Element saved to storage:", element);
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    
    if (message.type === "ALLOW_SELECTION") {
        selectionAllowed = true;
        sendSelectionCallback = (element: HTMLElement) => {
            sendResponse({ status: "selected", elementHTML: safeElementSerializer(element) });
        };
        addListeners();
        return true; // Keep sendResponse alive for async
    }    
    else if (message.type === "CLEAR_ALL_HIGHLIGHTS") {
        console.log("Clearing all highlights");
        document.querySelectorAll('*').forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.outline = '';
                el.style.backgroundColor = '';
            }
        });
        sendResponse({ status: "highlights_cleared" });
        return true; // Keep sendResponse alive for async
    }
    else if (message.type === "SELECT_ELEMENTS") {
        console.log("Selecting elements with selector:", message.selector);
        const selector = message.selector;
        const elements = document.querySelectorAll(selector);
        const elementsArray = Array.from(elements).map(el => 
            el instanceof HTMLElement ? safeElementSerializer(el) : el.outerHTML
        );
        console.log(`Elements matching selector "${selector}":`, elementsArray);

        // Highlight the selected elements
        elements.forEach(el => {
            if (el instanceof HTMLElement) {
                el.style.outline = '2px solid #00ff00';
                el.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
            }
        });
        sendResponse({ status: "elements_selected", elements: elementsArray });
        return true; // Keep sendResponse alive for async
    }


    return false;

    function handleEscapeKey(e: KeyboardEvent) {
        if (!selectionAllowed) return;
        if (e.key === "Escape") {
            // Clear highlight
            if (lastHovered) {
                lastHovered.style.outline = '';
                lastHovered.style.backgroundColor = '';
                lastHovered = null;
            }
            selectionAllowed = false;
            sendSelectionCallback = null;
            removeListeners();
            e.stopPropagation();
            e.preventDefault();
        }
    }
});
