# Web AI Agent

## Structure

The project is structured as follows:

```
├── agent/: Contains the code and services for AI Web Agent.
├── screenshot.ts: Contains code for taking screenshots.
├── vision_scraper.py: Contains code for scraping a single page and analyzing the content.
├── utils.ts: Contains utility functions used throughout the project.
├── package.json: Contains project metadata and dependencies.
```

The scripts: `screenshot.ts` and `vision_scraper.py` in the `root` directory are used to scrape a single page and analyze the content. It is more of a proof of concept that will be used to build a more sophisticated AI agent in the `agent/` directory.

If you are looking for the `Web AI Agent` project, please refer to the [agent/README.md](agent/README.md).

## Setup - for single page scraping only

- Clone the repository.
- Run `yarn` to install dependencies.
- Run `python vision_scraper.py` to start the scraper.
- Go to `vision_scraper.py` and modify the URL and query per your requirements.

### An example of the response from the scrapper

```
GPT: The "What's New & Trending" section of the website includes the following:

1. "XXX": JOIN XXX SUPERCHARGE YOUR SHOP. XXX is now available with XXX." – This suggests a membership or loyalty program that enhances the shopping experience.
2. "Born to create anything: With our extensive range of Embellish With XXX and XXX products, breathe some inspiration and create anything from home ware to wedding decor."
3. "Help your child prepare for XXX: Ensure your child doesn't fall short for their XXX study. Our educational resources."
4. "Regenerating Australian landscapes: We're committed to putting people and the planet at the heart of how we work. Purchase responsibility-sourced paper products and, based on the weight of trees per product, they replant by our partners."
5. "Create a smart home: Looking for the best smart home and office products to suit your needs? Compare different brands and pick your preferred ones then smart home."
6. "Discover the latest and greatest: Keep up to date always what's new in technology, fashion stationery and more from XXX."
```

## License

This project is licensed under the MIT License.
