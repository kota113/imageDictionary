from palm_request import palm_get_ideas
from search_request import search_images


def get_images(words: list[str]) -> dict:
    ideas = {word: palm_get_ideas(word) for word in words}
    # get the first image for each idea from Google
    images = {word: [[search_images(idea), idea] for idea in ideas[word]] for word in words}
    return images
