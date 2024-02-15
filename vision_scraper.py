import os
import subprocess
import base64
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
api_key = os.environ["OPENAI_API_KEY"]

# instantiate model

# gpt-4v may not be supported by the langchain_openai library
# chat = ChatOpenAI(temperature=0.0, openai_api_key=api_key, model="gpt-4-vision-preview")
# Timeout for requests to OpenAI completion API
# chat.request_timeout = 10

# use openai library directly
model = OpenAI(api_key=api_key)
model.timeout = 30


# convert an image file into a base64 encoded string
# @param image_path: the path to the image file we want to encode
def image_b64(image_path):
    # [open] the file in binary mode for reading
    # The "rb" mode opens the file for reading in binary format, which is needed because image files are binary files.
    # The with keyword is used here to manage the file context.
    # The advantage of using a with statement is that it is guaranteed to close the file no matter how the nested block exits. This means that the file will be properly closed even if an exception is raised at some point or after it is no longer needed.
    with open(image_path, "rb") as img_file:
        # The img_file.read() method is used to read the entire content of the file into memory as a bytes object.
        # The base64.b64encode(img_file.read()) function is used to encode the bytes object into a base64 encoded bytes object. Base64 encoding is a way of converting binary data into text data, which can be more easily transmitted over networks or stored in text-based formats.
        # The base64 encoded bytes object is then decoded into a string using the decode() method.
        return base64.b64encode(img_file.read()).decode()


# the type of image:
# image file object on disk ->
# [open(path, "rb")] _io.BufferedReader ->
# [.read()] bytes object (stream of bytes) ->
# [.b64encode()] base64 encoded bytes object  ->
# [decode] base64 encoded string

# example of bytes object from .read()
# c\xb1\xea\xe5\x9a\xad\xf1=\xf2E\xadt\xe1\x98o\x9b9^=E\xd9i\xa1\xb6

# example of base64 encoded bytes object from .b64encode()
# b'Y8uupZq9xP8+RT2d6e2zXkXZaLbvoz0NCg=='

# example of base64 encoded string from .decode()
# Y8uupZq9xP8+RT2d6e2zXkXZaLbvoz0NCg==

# the base64 encoded string is an acceptable format by GPT-4V


# take a url of the website and invoke the nodejs script to take a screenshot of the website
def urlToScreenShot(url):
    print(f"Vision crawling {url}")

    # remove the old screenshot if it exists
    if os.path.exists("screenshot.jpg"):
        os.remove("screenshot.jpg")

    # invoke the nodejs script to take a screenshot of the website
    # remember to run `yarn run compile` to generate the dist folder and the screenshot.js file before running this script. ts file is not executable.
    result = subprocess.run(
        ["node", "dist/screenshot.js", "canary", url], capture_output=True, text=True
    )

    exitcode = result.returncode
    output = result.stdout

    # if the screenshot was failed, print error message
    if not os.path.exists("screenshot.jpg"):
        print(f"subprocess error: {result.stderr}")
        return "Failed to scrape the website"

    # else return the base64 encoded string of the screenshot
    else:
        print("Image captured and converted to base64 string.")
        return image_b64("screenshot.jpg")


# pass the base64 encoded string of the screenshot to the model and get the response
def visionExtract(b64_image, prompt):
    response = model.chat.completions.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "system",
                "content": "You a web scraper, your job is to extract information based on a screenshot of a website & user's instruction",
            }
        ]
        + [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        # add the image type to the base64 string
                        "image_url": f"data:image/jpeg;base64,{b64_image}",
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        max_tokens=4000,
    )

    message = response.choices[0].message
    data_txt = message.content

    if "ANSWER_NOT_FOUND" in data_txt:
        print("ERROR: Answer not found")
        return (
            "I was unable to find the answer on that website. Please pick another one"
        )
    else:
        return data_txt


def visionScrape(url, prompt):
    b64_image = urlToScreenShot(url)

    if b64_image == "Failed to scrape the website":
        return "I was unable to crawl that site. Please pick a different one."
    else:
        return visionExtract(b64_image, prompt)


response = visionScrape(
    "https://www.officeworks.com.au/",
    "What are the trending items on this website?",
)

print(f"GPT: {response}")
