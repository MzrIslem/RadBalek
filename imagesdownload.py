import os
import logging
import requests
import time
from duckduckgo_search import DDGS

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# List of car brands you want to download images for
CAR_BRANDS = [
    "Dacia", "Renault", "KIA", "Hyundai", 
    "Chery", "Geely", "Volkswagen", 
    "BYD", "Tesla"
]

def download_image(url, folder, file_name):
    """Downloads a single image given a URL and saves it to a folder."""
    try:
        # Added a strict timeout so a bad image link doesn't hang the script indefinitely
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        file_path = os.path.join(folder, file_name)
        with open(file_path, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        logger.debug(f"Failed to download {url}: {e}")
        return False

def download_car_images(base_path="car_images", max_images_per_brand=5):
    """Download images using the latest duckduckgo_search API."""
    
    if not os.path.exists(base_path):
        os.makedirs(base_path)
        logger.info(f"Created base directory: {base_path}")

    # Use the context manager as required by the latest library versions
    with DDGS() as ddgs:
        for brand in CAR_BRANDS:
            brand_path = os.path.join(base_path, brand)
            if not os.path.exists(brand_path):
                os.makedirs(brand_path)
            
            logger.info(f"Searching for {brand} images...")
            query = f"{brand} car high quality"
            
            try:
                # Latest syntax: results are returned as a list of dictionaries
                results = ddgs.images(keywords=query, max_results=max_images_per_brand)
                
                downloaded_count = 0
                for index, result in enumerate(results):
                    image_url = result.get('image')
                    if image_url:
                        # Extract the file extension from the URL, default to .jpg
                        ext = os.path.splitext(image_url)[1].split('?')[0] # Split in case of URL parameters
                        if not ext or len(ext) > 5:
                            ext = '.jpg'
                        
                        file_name = f"{brand.lower()}_{index}{ext}"
                        
                        if download_image(image_url, brand_path, file_name):
                            downloaded_count += 1
                            
                logger.info(f"Successfully downloaded {downloaded_count} images for {brand}.")
                
            except Exception as e:
                logger.error(f"Error searching for {brand}: {e}")
                
            # CRITICAL: Pause for 2 seconds to avoid getting IP banned/rate-limited by DuckDuckGo
            time.sleep(2)

def main():
    logger.info("Starting safe car image downloader...")
    download_car_images(max_images_per_brand=5)
    logger.info("Download complete!")

if __name__ == "__main__":
    main()