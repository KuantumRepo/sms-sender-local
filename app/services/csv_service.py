import csv
import io
import phonenumbers
from typing import List, Dict, Optional, Tuple
from app.utils.logger import logger
from app.config import settings

class CSVService:
    LIKELY_PHONE_COLUMNS = ["phone", "mobile", "number", "msisdn", "cell", "telephone"]

    def detect_phone_column(self, fieldnames: List[str]) -> Optional[str]:
        """
        Auto-detects the column name likely to contain phone numbers.
        """
        for field in fieldnames:
            if field.lower().strip() in self.LIKELY_PHONE_COLUMNS:
                return field
        # Fallback: look for any column containing 'phone' or 'mobile'
        for field in fieldnames:
            if "phone" in field.lower() or "mobile" in field.lower():
                return field
        return None

    def normalize_number(self, phone: str, region: str = None) -> Optional[str]:
        """
        Normalizes a phone number to E.164 format.
        """
        if not region:
            region = settings.DEFAULT_REGION

        try:
            # Parse the number
            parsed_number = phonenumbers.parse(phone, region)
            
            # Check if it's a valid number
            if not phonenumbers.is_valid_number(parsed_number):
                return None
            
            # Format to E.164
            return phonenumbers.format_number(
                parsed_number, phonenumbers.PhoneNumberFormat.E164
            )
        except phonenumbers.NumberParseException:
            return None

    async def process_csv(self, file_content: bytes) -> Tuple[List[str], int, int]:
        """
        Processes the CSV file content.
        
        Returns:
            Tuple containing:
            - List of valid, unique E.164 phone numbers
            - Count of total rows
            - Count of invalid/duplicate rows
        """
        content_str = file_content.decode("utf-8")
        csv_file = io.StringIO(content_str)
        
        try:
            reader = csv.DictReader(csv_file)
        except Exception as e:
            logger.error(f"Failed to parse CSV: {e}")
            raise ValueError("Invalid CSV format")

        if not reader.fieldnames:
            raise ValueError("CSV file is empty or missing headers")

        phone_col = self.detect_phone_column(reader.fieldnames)
        if not phone_col:
            raise ValueError(
                f"Could not check phone number column. "
                f"Expected one of: {', '.join(self.LIKELY_PHONE_COLUMNS)}"
            )

        valid_numbers = set()
        total_rows = 0
        invalid_count = 0

        for row in reader:
            total_rows += 1
            raw_number = row.get(phone_col, "").strip()
            
            if not raw_number:
                invalid_count += 1
                continue

            normalized = self.normalize_number(raw_number)
            if normalized:
                valid_numbers.add(normalized)
            else:
                logger.warning(f"Invalid phone number found: {raw_number}")
                invalid_count += 1
        
        # Calculate true invalid/duplicate count
        # invalid_count tracks invalid formats
        # duplicates are filtered by set()
        # We might want to report duplicates specifically, but for now simple stats:
        unique_valid_count = len(valid_numbers)
        failed_or_duplicate = total_rows - unique_valid_count

        logger.info(
            f"CSV Processed: {total_rows} rows, {unique_valid_count} valid unique numbers, "
            f"{failed_or_duplicate} invalid or duplicates."
        )

        return list(valid_numbers), total_rows, failed_or_duplicate
