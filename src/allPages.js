//Dev Tools for Development
document.addEventListener("keydown", function(event) {
    if (event.key === "I" && event.ctrlKey && event.shiftKey) {
        require('@electron/remote').getCurrentWindow().toggleDevTools()
    }
})