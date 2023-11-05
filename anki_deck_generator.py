import hashlib
import os

import genanki
import requests

card_model = genanki.Model(
        8745104928,
        'Word with image Card',
        fields=[
            {'name': 'Word'},
            {'name': 'Definition'},
            {'name': 'Synonyms'},
            {'name': 'Image'},
        ],
        templates=[
            {
                'name': 'Card 1',
                'qfmt': '<h1>{{Word}}</h1>',
                'afmt': '{{FrontSide}}<hr id="answer"><h3>{{Definition}}</h3><br>Synonyms: {{Synonyms}}'
                        '<br><img src="{{Image}}">',
            },
        ]
    )


class AnkiDeck:
    def __init__(self, user_id):
        self.deck = genanki.Deck(
            4611586654,
            'Image Dictionary'
        )
        self.user_id = user_id
        self.media_files = []

    def add_note(self, word: str, dict_info: dict, image_url: str):
        image_path = _fetch_image(image_url)
        my_note = genanki.Note(
            model=card_model,
            fields=[word, dict_info["definition"], ", ".join(dict_info.get("synonyms", "")), image_path]
        )
        self.deck.add_note(my_note)
        # add an image to deck
        self.media_files.append(image_path)

    def output(self):
        self.deck.media_files = self.media_files
        path = f"_temp/anki_deck_{self.user_id}.apkg"
        genanki.Package(self.deck).write_to_file(path)
        return path


def _fetch_image(url: str):
    url_hash = hashlib.sha256(url.encode()).hexdigest()
    is_file_exists, file_path = _check_image_on_local(url_hash)
    if is_file_exists:
        return file_path
    # fetch an image as google crawler
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    }
    response = requests.get(url, headers=headers)
    file_extension = response.headers["Content-Type"].split("/")[1]
    # write image
    with open(f"_temp/{url_hash}.{file_extension}", "wb") as f:
        f.write(response.content)
    return f"_temp/{url_hash}.{file_extension}"


def _check_image_on_local(url_hash: str):
    if os.path.isfile(f"_temp/{url_hash}.png"):
        return True, f"_temp/{url_hash}.png"
    elif os.path.isfile(f"_temp/{url_hash}.jpg"):
        return True, f"_temp/{url_hash}.jpg"
    return False, None
