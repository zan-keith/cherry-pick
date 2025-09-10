import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"



let lastHovered: HTMLElement | null = null;
let selectionAllowed = false;
let sendSelectionCallback: ((element: HTMLElement) => void) | null = null;

function handleClick(e: MouseEvent) {
    if (!selectionAllowed) return;
    const target = e.target as HTMLElement;
    if (target instanceof HTMLElement && lastHovered === target) {
        console.log('Clicked element:', target);
        setSelectedElements(target.outerHTML);
        if (sendSelectionCallback) {
            sendSelectionCallback(target);
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

function addListeners() {
    document.body.addEventListener('mouseover', handleMouseOver, true);
    document.body.addEventListener('mouseout', handleMouseOut, true);
    document.body.addEventListener('click', handleClick, true);
}

function removeListeners() {
    document.body.removeEventListener('mouseover', handleMouseOver, true);
    document.body.removeEventListener('mouseout', handleMouseOut, true);
    document.body.removeEventListener('click', handleClick, true);
}

async function setSelectedElements(element) {
    const storage = new Storage();
    let prevElements = await storage.get("selectedElements") || [];
    storage.set("selectedElements", [...prevElements, element]);
    console.log("Element saved to storage:", element);
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    
    if (message.type === "ALLOW_SELECTION") {
        selectionAllowed = true;
        sendSelectionCallback = (element: HTMLElement) => {
            sendResponse({ status: "selected", elementHTML: element.outerHTML });
        };
        addListeners();
        return true; // Keep sendResponse alive for async
    }
    return false;
});
