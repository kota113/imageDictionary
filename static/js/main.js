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

document.getElementById('clearWords').addEventListener('click', () => {
    document.getElementById('wordList').innerHTML = '';
    wordList = []
    document.getElementById("downloadAnkiDeck").hidden = true
})


document.getElementById('submitWordsWithDef').addEventListener('click', async () => {
    await submitBtnListener(true)
})

document.getElementById('submitWordsWithoutDef').addEventListener('click', async () => {
    await submitBtnListener(false)
})

async function submitBtnListener (includeDef) {
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
        body: JSON.stringify({words: wordList})
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
    const dictRes = includeDef ? await search_words() : {}

    for (let [word, images] of Object.entries(resJson)) {
        // Fetch word definition and image (for now, we'll use placeholders)
        const definitionSelection = document.createElement('select');
        definitionSelection.className = 'form-select mb-3';
        definitionSelection.id = `definition-${word}`;
        definitionSelection.innerHTML = '<option selected>Choose a definition</option>';
        if (includeDef) {
            // {word: [{definition: definition, synonyms: "synonym1, synonym2, ..."}]}
            for (let [index, item] of Object.entries(dictRes[word])) {
                definitionSelection.innerHTML += `<option value="${index}">${item["definition"]}</option>`;
            }
        }
        else {
            definitionSelection.disabled = true
        }


        const wordDiv = document.createElement('div');
        wordDiv.className = 'my-4';

        wordDiv.innerHTML = `
            <h4>${word}</h4>
        `;
        wordDiv.appendChild(definitionSelection);

        const imageContainer = document.createElement('div');
        imageContainer.className = 'image-container';

        if (images.length > 1) {
            const imageSelector = document.createElement('div');
            imageSelector.className = 'btn-group mb-3';
            images.forEach((image, index) => {
                // replace spaces with dashes
                word = word.replace(/\s+/g, '-').toLowerCase();
                if (index === 0) {
                    imageSelector.innerHTML += `
                        <input type="radio" class="btn-check" name="option-${word}-${index}" id="option-${word}-${index}" autocomplete="off" checked
                               value="${index}"/>
                        <label class="btn btn-secondary" for="option-${word}-${index}">Image${index + 1}</label>
                    `;
                } else {
                    imageSelector.innerHTML += `
                        <input type="radio" class="btn-check" name="option-${word}-${index}" id="option-${word}-${index}" autocomplete="off"
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
}

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
        body: JSON.stringify({words: wordList})
    }
    const res = await fetch(searchWordsEndpoint, options)
    if (res.status === 404) {
        alert("There was a typo in your word list. Please try again.")
        return {}
    }
    return await res.json()
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
        choices[word]["definition"] = Number(document.getElementById(`definition-${word}`).value)
    }
    // send choices to backend as JSON
    const options = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(choices)
    }
    const res = await fetch(generateAnkiDeckEndpoint, options)
    // Get the blob response if the status is 200
    if (res.status === 200) {
        // open url in new tab
        window.open(downloadAnkiDeckEndpoint, '_blank').focus();
    }
}
