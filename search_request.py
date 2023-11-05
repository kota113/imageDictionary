import requests

from envs import GOOGLE_SEARCH_API_KEY


def search_images(word: str) -> list[str]:
    print("searching images for", word)
    # Your Google Custom Search API key
    api_key = GOOGLE_SEARCH_API_KEY

    # Your Custom Search Engine ID
    cse_id = '46ecac165dfc64257'

    # The search query
    search_query = word

    # URL endpoint for the Google Custom Search JSON API
    url = "https://www.googleapis.com/customsearch/v1"

    # Parameters for the API request
    params = {
        'q': search_query,  # The search terms
        'cx': cse_id,  # Custom Search Engine ID
        'key': api_key,  # API key
        'searchType': 'image',  # Search for images
        'num': 1,  # Number of results to return (max 10 per request)
    }

    # Make the GET request to the Google Custom Search API
    response = requests.get(url, params=params)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the JSON response
        search_results = response.json()

        # Print the URLs of the images
        for item in search_results.get('items', []):
            return item['link']
    else:
        print(response.content)
        raise ConnectionError("Unable to make GET request. Error code: {}".format(response.status_code))
