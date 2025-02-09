javascript:(function() {
    const API_URL = 'http://localhost:3103/api/nutritional-analysis';
    
    console.log("🚀 Bookmarklet started");
  
    // Find the container that holds the messages - try multiple possible selectors
    const foundContainer = 
      document.querySelector('[role="main"]') || 
      document.querySelector('[role="presentation"]') ||
      document.querySelector('.xz74otr');
    
    if (!foundContainer) {
      console.error("❌ Could not find message container!");
      alert("Could not find message container!");
      return;
    }
  
    console.log("📦 Found container:", foundContainer);
  
    // Keep track of processed images
    const processedImages = new Set();
  
    // Function to process an image element
    function processImage(imgElement) {
        // Skip if already processed or if it's a profile picture
        if (processedImages.has(imgElement.src) || 
            imgElement.src.includes('fbcdn.net/v/t1.30497-1')) {
            return;
        }
        
        console.log("🖼️ Processing image:", imgElement.src);
        console.log("📊 Image details:", {
            classes: imgElement.className,
            src: imgElement.src,
            'data-src': imgElement.dataset.src,
            srcset: imgElement.srcset
        });

        // For new messages, the image will be base64 encoded
        if (imgElement.src && imgElement.src.startsWith('data:image')) {
            fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    imageUrl: imgElement.src
                })
            })
            .then(response => {
                console.log("📥 Server response status:", response.status);
                return response.json();
            })
            .then(data => {
                console.log("✅ Server response:", data);
                if (data.success) {
                    processedImages.add(imgElement.src);
                    console.log("✨ Image processed successfully");
                } else {
                    console.error("❌ Processing failed:", data.error);
                }
            })
            .catch(error => {
                console.error("💥 Error:", error);
            });
        }
    }
  
    // Function to scan for images
    function scanForImages() {
        const images = foundContainer.querySelectorAll('img');
        images.forEach((img) => {
            if (processedImages.has(img.src)) {
                return;
            }
            
            processedImages.add(img.src);
            
            if (img.src && img.src.startsWith('data:image')) {
                processImage(img);
            } else if (img.src) {
                processImage(img);
            }
        });
    }
  
    function analyzeImage(imageSrc) {
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                imageUrl: imageSrc,
                isBase64: imageSrc.startsWith('data:image')
            }),
            mode: 'cors',
            credentials: 'omit'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.shortUrl) {
                console.log('Image URL:', data.shortUrl);
            }
        })
        .catch(error => {
            console.error('Error analyzing image:', error);
        });
    }
  
    // Keep the observer active even when tab is not focused
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeName === 'IMG') {
                        console.log("👀 New image detected:", node.src);
                        processImage(node);
                    } else if (node.querySelector) {
                        const newImages = node.querySelectorAll('img[src^="data:image"]');
                        newImages.forEach(img => {
                            console.log("👀 New image detected:", img.src);
                            processImage(img);
                        });
                    }
                });
            }
        });
    });
  
    observer.observe(foundContainer, { 
        childList: true,
        subtree: true,
        attributes: false
    });

    // Keep the page active even when not focused
    let hidden, visibilityChange;
    if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }

    // Add a visibility change listener
    document.addEventListener(visibilityChange, function() {
        if (document[hidden]) {
            console.log("Tab hidden, but still watching for new images...");
        } else {
            console.log("Tab visible again");
        }
    }, false);

    // Rest of your existing code...
    console.log("👍 Bookmarklet setup complete");
    alert("E2EE Image viewer is now active! Check console for results. Works in background!");
})();