import asyncio
import requests
import re
from flask import Flask, redirect, url_for, session, request, render_template
import urllib.parse
import random
import string
import envs
from bardapi import Bard

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
# bard = Bard(token=envs.BARD_1PSID)


@app.before_request
def before_request():
    if request.path in ["/login", "/callback"]:
        return
    if "user_id" not in session:
        return redirect(url_for("login"))


@app.route('/')
def index():
    return render_template("index.html")


@app.route('/api/request_images', methods=['POST'])
def request_images_api():
    words = request.get_json()
    try:
        return request_bard_images(words), 200
    except ValueError:
        return "The number of images doesn't match to the number words.", 400


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
