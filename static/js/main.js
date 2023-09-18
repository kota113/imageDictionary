let wordList = []

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
    await search_words()

    for (let [word, images] of Object.entries(resJson)) {
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
            imageSelector.className = 'btn-group mb-3';
            images.forEach((image, index) => {
                // replace spaces with dashes
                word = word.replace(/\s+/g, '-').toLowerCase();
                // todo: fix the bug that the only 1 label can be selected
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
    document.getElementById("downloadAnkiDeck").hidden = false
});

function addEventListenerToLabels() {
    // change image on label click
    const labels = document.querySelectorAll('label[class="btn btn-secondary"]');

    // add event listener to each radio button
    labels.forEach((label) => {
        label.addEventListener('click', () => {
            const imageContainer = label.parentElement.parentElement
            const radio = label.previousElementSibling;
            const radios = imageContainer.querySelectorAll('input[type="radio"]');
            // / todo: Cannot check the target radio button
            radios.forEach((elm) => {
                elm.checked = false;
            });
            radio.checked = true;
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

async function search_words() {
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(wordList)
    }
    const res = await fetch(searchWordsEndpoint, options)
    const resJson = await res.json()
    return resJson
}

document.getElementById('downloadAnkiDeck').addEventListener('click', async () => {
    await retrieveAnkiDeck()
})

async function retrieveAnkiDeck() {
    let choices = {}
    for (const index in wordList) {
        let word = wordList[index]
        // replace spaces with dashes
        word = word.replace(/\s+/g, '-').toLowerCase();
        choices[word] = {}
        const imageChoice = document.querySelector(`input[id^='option-${word}-']:checked`)
        choices[word]["image"] = Number(imageChoice.value)
        choices[word]["definition"] = 0
    }
    // send choices to backend as JSON
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(choices)
    }
    const res = await fetch(downloadAnkiDeckEndpoint, options)
    const resBlob = await res.blob()
    if (res.status !== 200) {
        alert("Sorry. There was a glitch. Please try again or wait a few minutes. If the problem persists, please contact us")
        return
    }
    // download the deck
    download("anki_deck.apkg", resBlob)
}
