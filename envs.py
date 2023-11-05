import os

import dotenv

# envs
dotenv.load_dotenv()
SESSION_SECRET = os.environ.get("SECRET_KEY")
LINE_CLIENT_ID = os.environ.get("LINE_CLIENT_ID")
LINE_LOGIN_SECRET = os.environ.get("LINE_LOGIN_SECRET")
WORDS_API_KEY = os.environ.get("WORDS_API_KEY")
PALM_API_KEY = os.environ.get("PALM_API_KEY")
GOOGLE_SEARCH_API_KEY = os.environ.get("GOOGLE_SEARCH_API_KEY")
