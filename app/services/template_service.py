import json
import random
import os
from typing import List, Dict, Optional
from app.utils.logger import logger

class TemplateService:
    def __init__(self, templates_path: str = "templates.json"):
        self.templates_path = templates_path
        self._templates: Dict[str, List[str]] = {}
        self.load_templates()

    def load_templates(self):
        """Loads templates from the JSON file."""
        if not os.path.exists(self.templates_path):
            logger.error(f"Template file not found: {self.templates_path}")
            self._templates = {}
            return

        try:
            with open(self.templates_path, "r", encoding="utf-8") as f:
                self._templates = json.load(f)
            logger.info(f"Loaded {len(self._templates)} templates from {self.templates_path}")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse template file: {e}")
            self._templates = {}

    def get_template_keys(self) -> List[str]:
        """Returns a list of available template keys."""
        return list(self._templates.keys())

    def get_variation(self, template_key: str) -> Optional[str]:
        """
        Returns a random variation for the given template key.
        """
        variations = self._templates.get(template_key)
        if not variations:
            return None
        return random.choice(variations)

    def validate_template_key(self, template_key: str) -> bool:
        return template_key in self._templates

template_service = TemplateService()
