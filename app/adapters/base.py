from abc import ABC, abstractmethod

class SMSProviderAdapter(ABC):

    @abstractmethod
    async def send_sms(self, to: str, message: str) -> dict:
        """
        Sends an SMS message to the specified recipient.

        Args:
            to (str): The recipient's phone number in E.164 format.
            message (str): The message content.

        Returns:
            dict: The response from the provider, containing at least the status.
        """
        pass
