import asyncio
import os
import random
import re
import string
import urllib.parse

import requests
from bardapi import Bard
from flask import Flask, redirect, url_for, session, request, render_template, send_file, make_response

import dictionary_api
import envs
from anki_deck_generator import AnkiDeck
from cache import BardResponseCache, DictResponseCache

bard_session = requests.Session()
bard_session.headers = {
    "Host": "bard.google.com",
    "X-Same-Domain": "1",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "Origin": "https://bard.google.com",
    "Referer": "https://bard.google.com/",
}
bard_session.cookies.set("__Secure-1PSID", envs.BARD_1PSID)
bard_session.cookies.set("__Secure-1PSIDTS", envs.BARD_1PSIDTS)
bard_session.cookies.set("__Secure-1PSIDCC", envs.BARD_1PSIDCC)
async_loop = asyncio.get_event_loop()
bard = Bard(token=envs.BARD_1PSID, session=bard_session)
app = Flask(__name__)
app.secret_key = envs.SESSION_SECRET
bard_response_cache = BardResponseCache()
dict_response_cache = DictResponseCache()
# bard = Bard(token=envs.BARD_1PSID)


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
    return render_template("index.html")


@app.route('/api/request_images', methods=['POST'])
def request_images_api():
    words = request.get_json()["words"]
    try:
        res = request_bard_images(words), 200
    except ValueError:
        return "The number of images doesn't match to the number words.", 400
    bard_response_cache.set(session["user_id"], res[0])
    request_response = make_response(res)
    request_response.headers.add("Access-Control-Allow-Origin", "*")
    return res


@app.route('/word-lookup', methods=['POST'])
def search_definition_api() -> dict[str, list[dict[str, str]]]:
    words = request.get_json()["words"]
    res = {word: dictionary_api.request(word) for word in words}
    dict_response_cache.set(session["user_id"], res)
    return res


@app.route('/generate-anki-deck', methods=['POST'])
def generate_anki_deck_api():
    selections = request.get_json()
    anki_deck = AnkiDeck(session["user_id"])
    for word in selections:
        selection = selections[word]
        dict_selection: int = int(selection["definition"])
        image_selection: int = int(selection["image"])
        dict_info = dict_response_cache.get(session["user_id"])[word][dict_selection]
        image = bard_response_cache.get(session["user_id"])[word][image_selection][0]
        anki_deck.add_note(word, dict_info, image)
    path = anki_deck.output()
    # send back data of the file
    response = send_file(path, as_attachment=True, download_name="anki_deck.apkg")
    os.remove(path)
    return response


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


def request_bard_images(words: list):
    images = {}
    # get 2 words each
    prompt = ("Give me 2 images which represents each word below. "
              "Images we see in daily life are desirable.\n"
              f"words: {', '.join(words)}\n\n")
    res = bard.get_answer(prompt)
    content = res['content']
    # extract all [Image of <description>] from content
    img_descriptions = re.findall(r'\[Image of .[^]]*]', content)
    img_descriptions = [i.replace('[Image of ', '').replace(']', '') for i in img_descriptions]

    if len(res["images"]) != len(img_descriptions):
        raise Exception("The number of images and descriptions are different.")
    if len(res["images"]) % len(words) != 0:
        raise ValueError("Number of images doesn't match to the number words.")

    images_per_word: int = len(res["images"]) // len(words)
    for i in range(len(words)):
        images[words[i]] = []
        for image in res["images"][i * images_per_word:(i + 1) * images_per_word]:
            images[words[i]].append([image, img_descriptions.pop(0)])
    return images


if __name__ == '__main__':
    app.run()
