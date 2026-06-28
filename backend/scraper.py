import httpx
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup

async def scrape_documentation(url: str) -> str:
    """
    Fetches the documentation URL and extracts meaningful text using BeautifulSoup.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(str(url), timeout=10.0)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove scripts and styles
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.extract()
            
            # Get text
            text = soup.get_text(separator=' ', strip=True)
            
            # Return a truncated version if it's too long (for our mock)
            return text[:10000] 
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return ""
