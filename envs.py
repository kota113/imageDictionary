import os

import dotenv

# envs
dotenv.load_dotenv()
SESSION_SECRET = os.environ.get("SECRET_KEY")
LINE_CLIENT_ID = os.environ.get("LINE_CLIENT_ID")
LINE_LOGIN_SECRET = os.environ.get("LINE_LOGIN_SECRET")
WORDS_API_KEY = os.environ.get("WORDS_API_KEY")
BARD_1PSID = os.environ.get("BARD_1PSID")
BARD_1PSIDTS = os.environ.get("BARD_1PSIDTS")
BARD_1PSIDCC = os.environ.get("BARD_1PSIDCC")
