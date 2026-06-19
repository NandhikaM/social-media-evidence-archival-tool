"""
Social media archival capture tasks.

Week 2: Playwright-based screenshot, HTML save, metadata extraction, SHA256 hashing.
"""


"""
Social media archival capture tasks.

Uses Selenium for screenshot capture, BeautifulSoup for HTML metadata parsing,
ExifTool for evidence metadata injection, and SHA-256 for integrity hashing.
"""

import asyncio
import hashlib
import logging
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone

from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.edge.options import Options as EdgeOptions
from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Add backend to path to import DB and models
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.config import get_settings
from app.database import AsyncSessionLocal, engine
from app.models import ArchiveRequest, ArchiveStatus, Record, Platform, Credential

logger = logging.getLogger(__name__)
settings = get_settings()


def get_sha256(filepath: str) -> str:
    """Compute SHA-256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while True:
            chunk = f.read(64 * 1024)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def find_exiftool() -> str | None:
    """Find the path to ExifTool."""
    # Check if exiftool is in system PATH
    exiftool_bin = shutil.which("exiftool")
    if exiftool_bin:
        return exiftool_bin

    # Try local program paths
    appdata = os.getenv("LOCALAPPDATA")
    if appdata:
        fallback = os.path.join(appdata, "Programs", "ExifTool", "exiftool.exe")
        if os.path.exists(fallback):
            return fallback

    # Default absolute fallback
    absolute_fallback = r"C:\Users\Kannan\AppData\Local\Programs\ExifTool\ExifTool.exe"
    if os.path.exists(absolute_fallback):
        return absolute_fallback

    return None


def dismiss_cookie_consent(driver):
    """Dismiss cookie consent/banners on social media platforms."""
    try:
        from selenium.webdriver.common.by import By
        logger.info("Checking for cookie consent banner...")
        # Common selectors for cookie consent acceptance buttons on Meta / Twitter
        selectors = [
            "button[data-cookiebanner='accept_button']",
            "button[data-testid='cookie-policy-manage-dialog-accept-button']",
            "//button[contains(text(), 'Allow all cookies')]",
            "//button[contains(text(), 'Allow essential and optional cookies')]",
            "//button[contains(text(), 'Accept All')]",
            "//button[contains(text(), 'Accept all')]",
            "//button[contains(text(), 'Decline optional cookies')]",
            "//button[contains(text(), 'Only allow essential cookies')]",
            "//div[@role='button']//span[contains(text(), 'Allow all cookies')]",
            "//div[@role='button']//span[contains(text(), 'Accept all')]"
        ]
        for sel in selectors:
            try:
                if sel.startswith("//"):
                    btn = driver.find_element(By.XPATH, sel)
                else:
                    btn = driver.find_element(By.CSS_SELECTOR, sel)
                if btn.is_displayed():
                    btn.click()
                    logger.info("Dismissed cookie consent banner using: %s", sel)
                    time.sleep(3)
                    break
            except Exception:
                continue
    except Exception as e:
        logger.warning("Error dismissing cookie consent: %s", e)


def login_instagram(driver, username, password):
    """Log in to Instagram."""
    try:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.support.ui import WebDriverWait

        logger.info("Automating Instagram login...")
        wait = WebDriverWait(driver, 15)

        dismiss_cookie_consent(driver)

        user_input = wait.until(EC.element_to_be_clickable((By.NAME, "username")))
        pass_input = wait.until(EC.element_to_be_clickable((By.NAME, "password")))

        user_input.clear()
        user_input.send_keys(username)
        pass_input.clear()
        pass_input.send_keys(password)

        login_btn = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']")))
        login_btn.click()

        time.sleep(8)
        logger.info("Successfully completed Instagram login automation.")
    except Exception as e:
        logger.warning("Instagram automated login failed: %s", e)


def login_facebook(driver, username, password):
    """Log in to Facebook."""
    try:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.support.ui import WebDriverWait

        logger.info("Automating Facebook login...")
        wait = WebDriverWait(driver, 15)

        dismiss_cookie_consent(driver)

        user_input = wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "input[name='email'], input[id='email']")
            )
        )
        pass_input = wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "input[name='pass'], input[id='pass']")
            )
        )

        user_input.clear()
        user_input.send_keys(username)
        pass_input.clear()
        pass_input.send_keys(password)

        try:
            login_btn = wait.until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, "button[name='login'], button[type='submit']")
                )
            )
        except Exception:
            login_btn = wait.until(
                EC.element_to_be_clickable(
                    (By.CSS_SELECTOR, "input[type='submit']")
                )
            )

        login_btn.click()
        time.sleep(8)
        logger.info("Successfully completed Facebook login automation.")
    except Exception as e:
        logger.warning("Facebook automated login failed: %s", e)


def login_twitter(driver, username, password):
    """Log in to Twitter/X."""
    try:
        from selenium.webdriver.common.by import By
        from selenium.webdriver.common.keys import Keys
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.support.ui import WebDriverWait

        logger.info("Automating Twitter/X login...")
        wait = WebDriverWait(driver, 15)

        dismiss_cookie_consent(driver)

        # Wait for username input
        user_input = wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, "input[autocomplete='username'], input[name='text']")
            )
        )
        user_input.clear()
        user_input.send_keys(username)
        user_input.send_keys(Keys.ENTER)
        time.sleep(3)

        try:
            # Check if unusual activity verification (username/phone) is requested
            alt_input = driver.find_element(
                By.CSS_SELECTOR, "input[data-testid='ocfEnterTextTextInput']"
            )
            if alt_input.is_displayed():
                alt_input.send_keys(username)
                alt_input.send_keys(Keys.ENTER)
                time.sleep(3)
        except Exception:
            pass

        # Wait for password input
        pass_input = wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "input[name='password']"))
        )
        pass_input.clear()
        pass_input.send_keys(password)
        pass_input.send_keys(Keys.ENTER)

        time.sleep(8)
        logger.info("Successfully completed Twitter/X login automation.")
    except Exception as e:
        logger.warning("Twitter/X automated login failed: %s", e)


async def async_process_archive_request(request_id: int) -> dict:
    logger.info("Processing archive request ID: %s", request_id)

    async with AsyncSessionLocal() as session:
        # Load request with case and submitter details
        stmt = (
            select(ArchiveRequest)
            .options(selectinload(ArchiveRequest.case), selectinload(ArchiveRequest.submitter))
            .where(ArchiveRequest.id == request_id)
        )
        db_req = await session.scalar(stmt)
        if not db_req:
            logger.error("ArchiveRequest %s not found in database.", request_id)
            return {"error": "request_not_found"}

        # Update status to processing
        db_req.status = ArchiveStatus.PROCESSING
        await session.commit()

        platform_str = db_req.platform.value if hasattr(db_req.platform, 'value') else str(db_req.platform)
        platform_str = platform_str.lower()

        db_credential = None
        if platform_str in ["instagram", "facebook", "twitter"]:
            cred_stmt = select(Credential).where(Credential.platform == platform_str)
            db_credential = await session.scalar(cred_stmt)

        driver = None
        screenshot_path = ""
        html_path = ""
        try:
            # Set up evidence directory (absolute path for worker operations)
            evidence_root = os.path.abspath(os.path.join(backend_path, settings.evidence_storage_path))
            evidence_dir = os.path.join(evidence_root, db_req.case.case_number)
            os.makedirs(evidence_dir, exist_ok=True)

            logger.info("Evidence directory: %s", evidence_dir)

            # 1. Selenium Capture Setup
            logger.info("Initializing Selenium Webdriver...")
            # Try Headless Edge first
            try:
                edge_options = EdgeOptions()
                edge_options.add_argument("--headless=new")
                edge_options.add_argument("--disable-gpu")
                edge_options.add_argument("--no-sandbox")
                edge_options.add_argument("--disable-dev-shm-usage")
                edge_options.add_argument("--window-size=1280,1024")
                edge_options.add_argument("--disable-blink-features=AutomationControlled")
                edge_options.add_experimental_option("excludeSwitches", ["enable-automation"])
                edge_options.add_experimental_option("useAutomationExtension", False)
                edge_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

                profile_dir = os.path.abspath(
                    os.path.join(backend_path, "selenium_profiles", "edge")
                )
                os.makedirs(profile_dir, exist_ok=True)
                edge_options.add_argument(f"--user-data-dir={profile_dir}")

                driver = webdriver.Edge(options=edge_options)
                driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                    "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
                })
                logger.info("Initialized Edge driver with persistent profile and stealth options.")
            except Exception as edge_err:
                logger.warning("Edge driver failed, trying Chrome: %s", edge_err)
                chrome_options = ChromeOptions()
                chrome_options.add_argument("--headless=new")
                chrome_options.add_argument("--disable-gpu")
                chrome_options.add_argument("--no-sandbox")
                chrome_options.add_argument("--disable-dev-shm-usage")
                chrome_options.add_argument("--window-size=1280,1024")
                chrome_options.add_argument("--disable-blink-features=AutomationControlled")
                chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
                chrome_options.add_experimental_option("useAutomationExtension", False)
                chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

                profile_dir = os.path.abspath(
                    os.path.join(backend_path, "selenium_profiles", "chrome")
                )
                os.makedirs(profile_dir, exist_ok=True)
                chrome_options.add_argument(f"--user-data-dir={profile_dir}")

                driver = webdriver.Chrome(options=chrome_options)
                driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
                    "source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
                })
                logger.info("Initialized Chrome driver with persistent profile and stealth options.")

            # 1.5 Automated Social Media Login (if credentials configured)
            if db_credential:
                if platform_str == "instagram":
                    login_url = "https://www.instagram.com/accounts/login/"
                elif platform_str == "facebook":
                    login_url = "https://www.facebook.com/"
                elif platform_str == "twitter":
                    login_url = "https://x.com/i/flow/login"
                else:
                    login_url = ""

                if login_url:
                    logger.info("Accessing %s login page to verify session...", platform_str)
                    driver.get(login_url)
                    time.sleep(5)

                    # Check if login fields are present
                    has_login_fields = False
                    if platform_str == "instagram":
                        try:
                            driver.find_element("css selector", "input[name='username']")
                            has_login_fields = True
                        except Exception:
                            pass
                    elif platform_str == "facebook":
                        try:
                            driver.find_element(
                                "css selector", "input[name='email'], input[id='email']"
                            )
                            has_login_fields = True
                        except Exception:
                            pass
                    elif platform_str == "twitter":
                        try:
                            driver.find_element(
                                "css selector",
                                "input[autocomplete='username'], input[name='text']",
                            )
                            has_login_fields = True
                        except Exception:
                            pass

                    if has_login_fields:
                        logger.info(
                            "Login fields detected. Attempting automated login for %s...",
                            platform_str,
                        )
                        if platform_str == "instagram":
                            login_instagram(
                                driver, db_credential.username, db_credential.password
                            )
                        elif platform_str == "facebook":
                            login_facebook(
                                driver, db_credential.username, db_credential.password
                            )
                        elif platform_str == "twitter":
                            login_twitter(
                                driver, db_credential.username, db_credential.password
                            )
                    else:
                        logger.info("No login fields detected. Reusing existing session cookies.")

            # 2. Load URL
            logger.info("Navigating to URL: %s", db_req.url)
            driver.get(db_req.url)
            time.sleep(5)  # Allow page JS elements/images to render

            # Scroll down gradually to trigger lazy loading of media assets (images/videos)
            try:
                logger.info("Scrolling page down to trigger lazy loading of assets...")
                for i in range(1, 6):
                    driver.execute_script(f"window.scrollTo(0, document.body.scrollHeight * {i} / 5);")
                    time.sleep(1)
                logger.info("Scrolling back to top...")
                driver.execute_script("window.scrollTo(0, 0);")
                time.sleep(1.5)
            except Exception as scroll_err:
                logger.warning("Failed scrolling lazy-loaded elements: %s", scroll_err)

            # Inject a mock browser frame at the top of the body for forensic URL proof
            try:
                logger.info("Injecting mock browser frame header into webpage...")
                inject_script = """
                (function() {
                    const url = window.location.href;
                    const title = document.title || "Social Media Post";
                    
                    if (document.getElementById("forensic-browser-chrome-bar")) return;
                    
                    const browserBar = document.createElement("div");
                    browserBar.id = "forensic-browser-chrome-bar";
                    browserBar.style.cssText = "position: relative; top: 0; left: 0; width: 100%; height: 75px; background: #202124; color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; box-sizing: border-box; display: flex; flex-direction: column; z-index: 2147483647; border-bottom: 1px solid #3c4043; padding: 0; margin: 0;";
                    
                    browserBar.innerHTML = `
                      <div style="display: flex; align-items: center; height: 35px; padding: 0 10px; background: #202124; margin: 0;">
                        <div style="display: flex; gap: 6px; margin-right: 15px; align-items: center;">
                          <div style="width: 10px; height: 10px; background: #ff5f56; border-radius: 50%;"></div>
                          <div style="width: 10px; height: 10px; background: #ffbd2e; border-radius: 50%;"></div>
                          <div style="width: 10px; height: 10px; background: #27c93f; border-radius: 50%;"></div>
                        </div>
                        <div style="display: flex; align-items: center; background: #35363a; height: 28px; padding: 0 12px; border-radius: 8px 8px 0 0; font-size: 11px; max-width: 250px; min-width: 150px; color: #f1f3f4; border: 1px solid #3c4043; border-bottom: none; margin-top: 7px;">
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">${title}</span>
                        </div>
                      </div>
                      <div style="display: flex; align-items: center; height: 40px; background: #35363a; padding: 0 10px; gap: 10px; margin: 0;">
                        <div style="display: flex; gap: 12px; color: #9aa0a6; font-size: 14px; align-items: center;">
                          <span style="font-weight: bold; cursor: default;">&larr;</span>
                          <span style="font-weight: bold; cursor: default;">&rarr;</span>
                          <span style="font-weight: bold; cursor: default;">&#x21BB;</span>
                        </div>
                        <div style="flex: 1; display: flex; align-items: center; background: #202124; border-radius: 20px; height: 26px; padding: 0 12px; font-size: 12px; color: #e8eaed; border: 1px solid #3c4043;">
                          <span style="color: #81c995; margin-right: 6px; font-size: 10px;">&#x1F512;</span>
                          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 850px; display: inline-block;">${url}</span>
                        </div>
                        <div style="color: #9aa0a6; font-size: 16px; font-weight: bold; padding: 0 5px; cursor: default;">&vellip;</div>
                      </div>
                    `;
                    document.body.insertBefore(browserBar, document.body.firstChild);
                })();
                """
                driver.execute_script(inject_script)
                time.sleep(1)
            except Exception as inject_err:
                logger.warning("Failed to inject mock browser frame: %s", inject_err)

            # 3. Capture Screenshot
            screenshot_filename = f"screenshot_{request_id}.png"
            screenshot_path = os.path.join(evidence_dir, screenshot_filename)
            driver.save_screenshot(screenshot_path)
            logger.info("Saved screenshot to: %s", screenshot_path)

            # 4. Save HTML and parse with BeautifulSoup
            html_source = driver.page_source
            html_filename = f"page_{request_id}.html"
            html_path = os.path.join(evidence_dir, html_filename)
            with open(html_path, "w", encoding="utf-8") as f:
                f.write(html_source)
            logger.info("Saved HTML to: %s", html_path)

            # Parsing meta info using BeautifulSoup
            soup = BeautifulSoup(html_source, "html.parser")
            page_title = soup.title.string.strip() if soup.title else "No Title"
            
            meta_desc = ""
            desc_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
            if desc_tag:
                meta_desc = desc_tag.get("content", "").strip()

            metadata_payload = {
                "title": page_title,
                "description": meta_desc,
                "captured_at": datetime.now(timezone.utc).isoformat(),
                "url": db_req.url,
                "platform": db_req.platform,
                "target_handle": db_req.target_handle,
                "browser_logs": [],
            }

            # Extract OpenGraph meta fields
            for og_property in ["og:title", "og:type", "og:image", "og:url", "og:site_name"]:
                tag = soup.find("meta", attrs={"property": og_property})
                if tag:
                    metadata_payload[og_property.replace(":", "_")] = tag.get("content", "")

            # 5. Inject ExifTool Metadata (forensics)
            exiftool_bin = find_exiftool()
            if exiftool_bin:
                logger.info("Injecting ExifTool metadata...")
                cmd = [
                    exiftool_bin,
                    "-overwrite_original",
                    f"-Title=Forensic Social Media Capture ({db_req.platform})",
                    f"-Artist={db_req.submitter.full_name} ({db_req.submitter.district} - TN Cybercrime)",
                    f"-Source={db_req.url}",
                    f"-Description=Case Number: {db_req.case.case_number}. FIR Number: {db_req.case.fir_number or 'N/A'}. Justification: {db_req.justification or 'None'}",
                    f"-Subject=Evidence request {request_id}",
                    f"-CreateDate={datetime.now(timezone.utc).strftime('%Y:%m:%d %H:%M:%S')}",
                    screenshot_path,
                ]
                logger.info("ExifTool Command: %s", " ".join(cmd))
                exif_res = subprocess.run(cmd, capture_output=True, text=True)
                if exif_res.returncode == 0:
                    logger.info("ExifTool metadata injection successful.")
                else:
                    logger.warning("ExifTool injection finished with warning/error: %s", exif_res.stderr)
            else:
                logger.warning("ExifTool executable not found. Skipping metadata injection.")

            # 5.5 Automatic Media Downloader for Instagram/Facebook
            downloaded_media = []
            if db_req.platform in [Platform.INSTAGRAM, Platform.FACEBOOK] or "instagram.com" in db_req.url or "facebook.com" in db_req.url:
                logger.info("Instagram or Facebook URL detected. Attempting to parse and download media assets...")
                try:
                    media_urls = []
                    # Find image elements
                    images = driver.find_elements("tag name", "img")
                    for img in images:
                        try:
                            src = img.get_attribute("src")
                            width = img.size.get("width", 0)
                            height = img.size.get("height", 0)
                            # Fallback to DOM attributes
                            dom_w = img.get_attribute("width")
                            dom_h = img.get_attribute("height")
                            try:
                                if dom_w:
                                    width = max(width, int(dom_w))
                                if dom_h:
                                    height = max(height, int(dom_h))
                            except ValueError:
                                pass
                            
                            # Exclude small images, avatars, or icons
                            if src and src.startswith("http") and (width >= 100 or height >= 100 or width == 0):
                                if src not in [m[0] for m in media_urls]:
                                    media_urls.append((src, "image"))
                        except Exception:
                            continue

                    # Find video elements
                    videos = driver.find_elements("tag name", "video")
                    for video in videos:
                        try:
                            src = video.get_attribute("src")
                            if src and src.startswith("http"):
                                if src not in [m[0] for m in media_urls]:
                                    media_urls.append((src, "video"))
                        except Exception:
                            continue

                    # Download up to 5 media files
                    if media_urls:
                        import httpx
                        media_dir = os.path.join(evidence_dir, "media")
                        os.makedirs(media_dir, exist_ok=True)
                        
                        headers = {
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                        }
                        
                        max_media = 5
                        count = 0
                        for src, media_type in media_urls:
                            if count >= max_media:
                                break
                            try:
                                r = httpx.get(src, headers=headers, timeout=10.0, follow_redirects=True)
                                if r.status_code == 200:
                                    ext = ".jpg" if media_type == "image" else ".mp4"
                                    content_type = r.headers.get("content-type", "")
                                    if "image/png" in content_type:
                                        ext = ".png"
                                    elif "image/gif" in content_type:
                                        ext = ".gif"
                                    elif "video/mp4" in content_type:
                                        ext = ".mp4"
                                    elif "image/jpeg" in content_type:
                                        ext = ".jpg"
                                    
                                    media_filename = f"media_{request_id}_{count}{ext}"
                                    media_path = os.path.join(media_dir, media_filename)
                                    with open(media_path, "wb") as f:
                                        f.write(r.content)
                                    
                                    media_hash = get_sha256(media_path)
                                    relative_path = f"evidence/{db_req.case.case_number}/media/{media_filename}"
                                    
                                    downloaded_media.append({
                                        "path": relative_path,
                                        "type": media_type,
                                        "sha256": media_hash,
                                        "src_url": src
                                    })
                                    count += 1
                                    logger.info("Downloaded media asset %s from %s", count, src)
                            except Exception as dl_err:
                                logger.warning("Failed to download media asset from %s: %s", src, dl_err)
                except Exception as parse_err:
                    logger.warning("Failed to parse media elements from page: %s", parse_err)

            metadata_payload["downloaded_media"] = downloaded_media

            # 6. Compute SHA-256 integrity hash
            logger.info("Computing SHA-256 hashes...")
            screenshot_hash = get_sha256(screenshot_path)
            html_hash = get_sha256(html_path)

            metadata_payload["screenshot_sha256"] = screenshot_hash
            metadata_payload["html_sha256"] = html_hash

            # Save relative path representation in database record
            db_screenshot_relative = f"evidence/{db_req.case.case_number}/{screenshot_filename}"
            db_html_relative = f"evidence/{db_req.case.case_number}/{html_filename}"

            # 7. Database insertion for Record
            db_record = Record(
                request_id=request_id,
                screenshot_path=db_screenshot_relative,
                html_path=db_html_relative,
                sha256_hash=screenshot_hash,
                metadata_=metadata_payload,
                is_verified=True,
            )
            session.add(db_record)
            db_req.status = ArchiveStatus.COMPLETED
            await session.commit()
            logger.info("Archive processing completed successfully for ID %s.", request_id)
            return {"status": "success", "record_id": db_record.id}

        except Exception as e:
            logger.exception("Error processing archive request %s:", request_id)
            # Reset and update status to failed
            try:
                db_req.status = ArchiveStatus.FAILED
                await session.commit()
            except Exception as db_err:
                logger.error("Could not set status to FAILED in DB: %s", db_err)

            return {"status": "failed", "error": str(e)}

        finally:
            if driver:
                try:
                    driver.quit()
                except Exception as quit_err:
                    logger.warning("Error quitting webdriver: %s", quit_err)
            try:
                await engine.dispose()
                logger.info("SQLAlchemy engine connection pool disposed successfully.")
            except Exception as dispose_err:
                logger.warning("Failed to dispose SQLAlchemy engine: %s", dispose_err)


def process_archive_request(request_id: int) -> dict:
    """Wrapper function executed by RQ worker."""
    return asyncio.run(async_process_archive_request(request_id))
