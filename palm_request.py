import google.generativeai as palm

from envs import PALM_API_KEY

palm.configure(api_key=PALM_API_KEY)
"""
At the command line, only need to run once to install the package via pip:

$ pip install google-generativeai
"""


def palm_get_ideas(word: str) -> list[str]:
    print("getting ideas for", word)
    defaults = {
        'model': 'models/text-bison-001',
        'temperature': 0.7,
        'candidate_count': 1,
        'top_k': 40,
        'top_p': 0.95,
        'max_output_tokens': 1024,
        'stop_sequences': [],
        'safety_settings': [{"category": "HARM_CATEGORY_DEROGATORY", "threshold": 2},
                            {"category": "HARM_CATEGORY_TOXICITY", "threshold": 2},
                            {"category": "HARM_CATEGORY_VIOLENCE", "threshold": 2},
                            {"category": "HARM_CATEGORY_SEXUAL", "threshold": 2},
                            {"category": "HARM_CATEGORY_MEDICAL", "threshold": 2},
                            {"category": "HARM_CATEGORY_DANGEROUS", "threshold": 2}],
    }
    prompt = f"""Think of idea of images represent the word.
    Word: Aspire
    Images: "Student studying at their desk", "doctor listening to their patient"
    Word: Wealth
    Images: "family spending time together at the beach", "person donating to charity"
    Word: Embargo
    Images: "truck carrying goods being stopped at a border", "Empty grocery shelves"
    Word: Astonished
    Images: "person with a shocked expression on their face", "Person with mouth open and eyes wide in surprise"
    Word: Breathtaking
    Images: "Waterfall", "Starry night sky"
    Word: Crazy
    Images: "Person doing a backflip on a skateboard", "Person riding a roller coaster"
    Word: Immaculate
    Images: "Freshly washed car", "Freshly-made bed"
    Word: International
    Images: "Group of people from different countries wearing traditional clothing", "UN flag"
    Word: Carbon dioxide
    Images: "Fire extinguisher", "Carbonated drink"
    Word: Establish
    Images: "Building", "School"
    Word: Arrange
    Images: "Person arranging books on bookshelf",  "person setting the table for a meal, carefully arranging the dishes and silverware in a pleasing and functional way"
    Word: Critics
    Images: "movie review", "restaurant review"
    Word: Starbucks
    Images: "Starbucks", "Cafe"
    Word: Norm
    Images: "People crossing the street at a crosswalk", "Family sitting down to eat dinner together"
    Word: Catchy
    Images: "person looking at a catchy advertisement", "person laughing while singing a song"
    Word: Aggregate
    Images: "pile of sand on a beach", "crowd of people at a concert"
    Word: Cluster
    Images: "group of students working on a project together", "flock of birds flying together in formation, "
    Word: Appropriate
    Images: "student raising their hand to speak in class", "person crossing the street at the crosswalk"
    Word: Tragic
    Images: "Child crying at a funeral", "Car accident scene"
    Word: Tremendous
    Images: "huge crowd at a concert", "towering waterfall and A majestic mountain range"
    Word: {word}
    Images:"""

    response = palm.generate_text(
        **defaults,
        prompt=prompt
    )

    # log the response
    with open("log.txt", "a") as f:
        f.write(f"word:{word} response: {response.result}\n")

    if "Word:" in response.result:
        return response.result[:response.result.find("Word:")].replace("\n", "")[1:-1].split('", "')
    else:
        return response.result[1:-1].split('", "')
