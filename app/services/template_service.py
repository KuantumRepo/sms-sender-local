import json
import random
import os
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.utils.logger import logger
from app.models import Template, TemplateVariation
from app.database import SessionLocal

class TemplateService:
    def __init__(self, templates_path: str = "templates.json"):
        self.templates_path = templates_path

    def load_templates(self):
        """Migrates templates from the JSON file to the database if the DB is empty."""
        if not os.path.exists(self.templates_path):
            return

        db = SessionLocal()
        try:
            # Check if we already have templates in the DB
            existing_count = db.query(Template).count()
            if existing_count > 0:
                logger.info("Templates already exist in database. Skipping JSON migration.")
                return

            with open(self.templates_path, "r", encoding="utf-8") as f:
                json_templates = json.load(f)
            
            for key, variations in json_templates.items():
                name = key.replace("_", " ").title()
                new_template = Template(name=name, key=key)
                db.add(new_template)
                db.flush() # Get the new_template.id
                
                for msg_text in variations:
                    variation = TemplateVariation(template_id=new_template.id, message_text=msg_text)
                    db.add(variation)
            
            db.commit()
            logger.info(f"Migrated {len(json_templates)} templates from {self.templates_path} to Database.")
        except Exception as e:
            logger.error(f"Failed to migrate template file: {e}")
            db.rollback()
        finally:
            db.close()

    def get_template_keys(self) -> List[str]:
        """Returns a list of available template keys directly from the database."""
        db = SessionLocal()
        try:
            templates = db.query(Template).all()
            return [t.key for t in templates]
        finally:
            db.close()

    def get_variation(self, template_key: str) -> Optional[str]:
        """
        Returns a random variation for the given template key from the database.
        """
        db = SessionLocal()
        try:
            template = db.query(Template).filter(Template.key == template_key).first()
            if not template or not template.variations:
                return None
            
            variations = [v.message_text for v in template.variations]
            return random.choice(variations)
        finally:
            db.close()

    def validate_template_key(self, template_key: str) -> bool:
        db = SessionLocal()
        try:
            return db.query(Template).filter(Template.key == template_key).first() is not None
        finally:
            db.close()

template_service = TemplateService()
