import re
from urllib.parse import unquote

import requests
from bs4 import BeautifulSoup


class GoogleImageScraper:
    def __init__(self, user_agent=None):
        self.user_agent = user_agent or 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
        self.headers = {'User-Agent': self.user_agent}

    def fetch_images(self, query, num_images=10):
        query = query.replace(' ', '+')
        url = f"https://www.google.com/search?hl=en&q={query}&tbm=isch"
        response = requests.get(url, headers=self.headers)
        soup = BeautifulSoup(response.text, 'lxml')
        return self._parse_image_results(soup, num_images)

    @staticmethod
    def _parse_image_results(soup, num_images):
        image_elements = soup.find_all('img', {'src': re.compile('gstatic.com/images')})
        image_links = []
        for element in image_elements[:num_images]:
            src_link = element.get('src')
            if src_link and src_link.startswith('http'):
                image_links.append(unquote(src_link))
        return image_links


# Example usage:
if __name__ == "__main__":
    scraper = GoogleImageScraper()
    images = scraper.fetch_images("puppies", 5)
    for img in images:
        print(img)
