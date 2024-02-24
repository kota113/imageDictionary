import asyncio
import os
import random
import string
import urllib.parse

import requests
from flask import Flask, redirect, url_for, session, request, render_template, send_file, make_response, abort

import dictionary_api
import envs
from anki_deck_generator import AnkiDeck
from cache import SearchedImagesCache, DictResponseCache
from get_images import get_images

async_loop = asyncio.get_event_loop()
app = Flask(__name__)
app.secret_key = envs.SESSION_SECRET
searched_images_cache = SearchedImagesCache()
dict_response_cache = DictResponseCache()


@app.before_request
def before_request():
    if request.endpoint in ["login", "callback", "static"]:
        return
    if "user_id" not in session:
        return redirect(url_for("login"))
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "*")
        return response


@app.route('/')
def index():
    session["current_wordlist_info"] = {}
    return render_template("index.html")


@app.route('/api/request_images', methods=['POST'])
def request_images_api():
    words = request.get_json()["words"]
    try:
        res = get_images(words), 200
    except ValueError:
        return "The number of images doesn't match to the number words.", 400
    searched_images_cache.set(session["user_id"], res[0])
    request_response = make_response(res)
    request_response.headers.add("Access-Control-Allow-Origin", "*")
    return res


@app.route('/word-lookup', methods=['POST'])
def search_definition_api() -> dict[str, list[dict[str, str]]] | tuple[dict[str, str], int]:
    words = request.get_json()["words"]
    try:
        res = {word: dictionary_api.request(word) for word in words}
    except requests.exceptions.HTTPError:
        return {"error": "Word not found."}, 404
    dict_response_cache.set(session["user_id"], res)
    print(res)
    return {word: [{"definition": i["definition"], "synonyms": ", ".join(i.get("synonyms", []))} for i in res[word]] for
            word in res}


@app.route('/generate-anki-deck', methods=['POST'])
def generate_anki_deck_api():
    # todo: handle the case when the user doesn't select to include definitions
    selections = request.get_json()
    anki_deck = AnkiDeck(session["user_id"])
    for word in selections:
        selection = selections[word]
        dict_selection: int = int(selection["definition"])
        image_selection: int = int(selection["image"])
        dict_info = dict_response_cache.get(session["user_id"])[word][dict_selection]
        image = searched_images_cache.get(session["user_id"])[word][image_selection][0]
        anki_deck.add_note(word, dict_info, image)
    anki_deck.output()
    return "success", 200


@app.route('/download-anki-deck')
def download_anki_deck():
    user_id = session["user_id"]
    # todo: problem with deleting file
    # os.remove(path)
    if not os.path.exists(f"temp/anki_deck_{user_id}.apkg"):
        return abort(404)
    return send_file(f"temp/anki_deck_{user_id}.apkg", as_attachment=True, download_name="anki_deck.apkg")


@app.route('/login')
def login():
    state = random_strings(15)
    session['state'] = state
    url = f"https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id={envs.LINE_CLIENT_ID}&redirect_uri=" \
          f"{url_for('callback', _external=True, _scheme='https' if not app.debug else 'http')}&state={state}&scope=profile"
    return redirect(urllib.parse.quote(url, safe=':/?=&'))


@app.route('/callback')
def callback():
    state = request.args.get('state')
    code = request.args.get('code')
    if state != session['state']:
        return "プライベートモードでは利用できません。"
    res = get_auth_code(code)
    if res.get('error_description') == 'code is required.':
        return "プライベートモードでは利用できません。"
    session['access_token'] = res['access_token']
    res = get_current_line_user()
    session['user_id'] = res['userId']
    session['user_name'] = res['displayName']
    session['picture_url'] = res['pictureUrl'] if "pictureUrl" in res \
        else url_for('static', filename='img/defaultUserIcon.png')
    return redirect(url_for("index"))


def random_strings(n):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=n))


def get_auth_code(code):
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': url_for('callback', _external=True, _scheme='https' if not app.debug else 'http'),
        'client_id': str(envs.LINE_CLIENT_ID),
        'client_secret': envs.LINE_LOGIN_SECRET
    }
    response = requests.post('https://api.line.me/oauth2/v2.1/token', data=data)
    return response.json()


def get_current_line_user():
    headers = {
        'Authorization': f'Bearer {session["access_token"]}'
    }
    response = requests.get('https://api.line.me/v2/profile', headers=headers)
    data = response.json()
    return data


if __name__ == '__main__':
    app.run()
