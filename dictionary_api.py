import requests

import envs


def request(word: str):
    url = "https://wordsapiv1.p.rapidapi.com/words/" + word
    headers = {
        "X-RapidAPI-Key": envs.WORDS_API_KEY,
        "X-RapidAPI-Host": "wordsapiv1.p.rapidapi.com"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    results = response.json()["results"]
    return [i for i in results if "definition" in i]
