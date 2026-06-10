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
from app.database import AsyncSessionLocal
from app.models import ArchiveRequest, ArchiveStatus, Record

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
                driver = webdriver.Edge(options=edge_options)
                logger.info("Initialized Edge driver.")
            except Exception as edge_err:
                logger.warning("Edge driver failed, trying Chrome: %s", edge_err)
                chrome_options = ChromeOptions()
                chrome_options.add_argument("--headless=new")
                chrome_options.add_argument("--disable-gpu")
                chrome_options.add_argument("--no-sandbox")
                chrome_options.add_argument("--disable-dev-shm-usage")
                chrome_options.add_argument("--window-size=1280,1024")
                driver = webdriver.Chrome(options=chrome_options)
                logger.info("Initialized Chrome driver.")

            # 2. Load URL
            logger.info("Navigating to URL: %s", db_req.url)
            driver.get(db_req.url)
            time.sleep(5)  # Allow page JS elements/images to render

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


def process_archive_request(request_id: int) -> dict:
    """Wrapper function executed by RQ worker."""
    return asyncio.run(async_process_archive_request(request_id))
