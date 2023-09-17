document.getElementById('addWord').addEventListener('click', () => {
  const wordInput = document.getElementById('wordInput');
  const wordList = document.getElementById('wordList');

  if (wordInput.value.trim() !== '') {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = wordInput.value.trim();

    wordList.appendChild(li);
    wordInput.value = ''; // Clear the input
  }
});

document.getElementById('submitWords').addEventListener('click', async () => {
    // apply loading animation to results div
    document.getElementById('results').innerHTML = '<div class="circles-to-rhombuses-spinner" style="left: 50%; transform: translate(-50%, 0);"><div class="circle"></div><div class="circle"></div><div class="circle"></div></div>'
    const wordListItems = document.querySelectorAll('#wordList li');
    const resultsDiv = document.getElementById('results');
    let wordList = []
    for (let item of wordListItems) {
        wordList.push(item.textContent)
    }

    // call the api
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(wordList)
    }
    const res = await fetch(requestImagesEndpoint, options)
    const resJson = await res.json()
    if (res.status === 400) {
        resultsDiv.innerHTML = '<div class="alert alert-danger" role="alert">There was a glitch. Please try again.</div>'
        return
    }

    // apply results to HTML
    resultsDiv.innerHTML = '';  // Clear loading animations
    resultsDiv.removeAttribute("style")

    for (const [word, images] of Object.entries(resJson)) {
        // Fetch word definition and image (for now, we'll use placeholders)
        const definition = `Definition for ${word}`; // You would replace this with a real API call

        const wordDiv = document.createElement('div');
        wordDiv.className = 'my-4';

        wordDiv.innerHTML = `
            <h4>${word}</h4>
            <p>${definition}</p>
        `;

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        if (images.length > 1) {
            const imageSelector = document.createElement('div');
            imageSelector.className = 'btn-group mb-3 image-selector';
            images.forEach((image, index) => {
                if (index === 0) {
                    imageSelector.innerHTML += `
                        <input type="radio" class="btn-check" name="options" id="option-${word}-${index}" autocomplete="off" checked
                               value="${index}"/>
                        <label class="btn btn-secondary" for="option-${word}-${index}">Image${index + 1}</label>
                    `;
                } else {
                    imageSelector.innerHTML += `
                        <input type="radio" class="btn-check" name="options" id="option-${word}-${index}" autocomplete="off"
                               value="${index}"/>
                        <label class="btn btn-secondary" for="option-${word}-${index}">Image${index + 1}</label>
                    `;
                }
            });
            imageContainer.appendChild(imageSelector);
        }

        for (let image of images) {
            const imageElm = document.createElement("img")
            imageElm.alt = image[1]
            imageElm.src = image[0]
            imageElm.className = "img-fluid mb-3 mr-3 ml-3"
            imageElm.style.width = "550px"
            // if the image is the fist one, add the active class
            if (images.indexOf(image) === 0) {
                imageElm.classList.add("active")
            }
            imageContainer.appendChild(imageElm)
        }
        wordDiv.appendChild(imageContainer);
        resultsDiv.appendChild(wordDiv);
    }
    addEventListenerToLabels()
});

function addEventListenerToLabels() {
    // change image on label click
    const labels = document.querySelectorAll('label[class="btn btn-secondary"]');

    // add event listener to each radio button
    labels.forEach((label) => {
        label.addEventListener('click', () => {
            const imageContainer = label.parentElement.parentElement
            const radio = label.previousElementSibling;
            const imageNumber = radio.value
            const childImages = imageContainer.querySelectorAll('img');
            childImages.forEach((img, index) => {
                img.classList.remove('active');
                if (index === Number(imageNumber)) {
                    img.classList.add('active');
                }
            });
        });
    });
}
