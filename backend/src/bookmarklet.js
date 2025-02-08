javascript:(function() {
    const API_URL = 'http://localhost:3103/api/analyze-image';
    
    console.log("Bookmarklet started, looking for images...");
  
    // Find the container that holds the messages - try multiple possible selectors
    const foundContainer = 
      document.querySelector('[role="main"]') || 
      document.querySelector('[role="presentation"]') ||
      document.querySelector('.xz74otr'); // The class from your error log
    
    if (!foundContainer) {
      console.error("Could not find message container!");
      alert("Could not find message container!");
      return;
    }
  
    console.log("Found container:", foundContainer);
  
    // Keep track of processed images
    const processedImages = new Set();
  
    // Function to process an image element
    const processImage = async (img) => {
      console.log("Processing image element:", img);
      console.log("Image classes:", img.className);
      console.log("Image attributes:", {
        src: img.src,
        'data-src': img.getAttribute('data-src'),
        srcset: img.getAttribute('srcset')
      });
  
      const imgSrc = img.src || img.getAttribute('src') || img.getAttribute('data-src');
      if (!imgSrc) {
        console.log("No image source found");
        return;
      }
  
      console.log("Found image source:", imgSrc.substring(0, 100) + "...");
  
      if (imgSrc.startsWith('data:image/')) {
        console.log("Valid base64 image found, sending to server...");
        try {
          const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ 
              imageUrl: imgSrc,
              isBase64: true
            }),
            headers: {
              "Content-Type": "application/json"
            }
          });
  
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Server response:", data);
        } catch (error) {
          console.error("Error sending to server:", error.message);
        }
      } else {
        console.log("Not a base64 image, skipping");
      }
    };
  
    // Function to scan for images
    function scanForImages() {
        const images = foundContainer.querySelectorAll('img');
        images.forEach((img) => {
            // Skip if we've already processed this image
            if (processedImages.has(img.src)) {
                return;
            }
            
            processedImages.add(img.src);
            
            if (img.src && img.src.startsWith('data:image')) {
                // Process base64 image
                analyzeImage(img.src);
            } else if (img.src) {
                // Process regular image URL
                analyzeImage(img.src);
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
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.shortUrl) {
                console.log('Image URL:', data.shortUrl);
            }
        })
        .catch(error => {
            console.error('Error analyzing image:', error);
        });
    }
  
    // Set up observer for new images
    const observer = new MutationObserver((mutations) => {
        // Look through each mutation
        for (const mutation of mutations) {
            // Only look at newly added nodes
            if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    // Check if the node is an image or contains an image
                    if (node.nodeName === 'IMG') {
                        // Only process if it's a new image with a src
                        if (node.src && node.src.startsWith('data:image')) {
                            console.log("New image detected!");
                            processImage(node);
                        }
                    } else if (node.querySelector) {
                        // Look for images inside the new node
                        const newImages = node.querySelectorAll('img[src^="data:image"]');
                        newImages.forEach(img => {
                            console.log("New image detected!");
                            processImage(img);
                        });
                    }
                });
            }
        }
    });
  
    // Configure the observer to only watch for what we need
    observer.observe(foundContainer, { 
        childList: true,  // watch for added/removed nodes
        subtree: true,    // watch all descendants
        attributes: false  // don't watch for attribute changes
    });
  
    console.log("Image viewer initialized and watching for changes");
    alert("E2EE Image viewer is now active! Check console for results.");
  })();