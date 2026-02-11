Getting Started
Quick start guide to integrate ViteMobile SMS API into your application. Get up and running in minutes.

Prerequisites
What you need before getting started
A ViteMobile account with an active license
Access token from your account settings
Sufficient wallet balance for sending messages
Basic knowledge of REST APIs and HTTP requests
Step 1: Get Your Access Token
Authenticate and obtain your API access token
To use the ViteMobile API, you need to authenticate using your account credentials. The API uses JWT (JSON Web Tokens) for authentication.

1. Login to get access token:

POST /auth/login/
Content-Type: application/json

{
  "username": "your_email@example.com",
  "password": "your_password"
}
2. Use the access token in subsequent requests:

Authorization: Bearer eyJ0eXAiOiJKV1QiLCJh...
Important
You can also find your access token in your account settings page. Keep your token secure and never expose it in client-side code.
Step 2: Send Your First SMS
Send a test message to verify your setup
Once you have your access token, you can start sending SMS messages. Here's a simple example using cURL:

curl -X POST https://core.vitemobile.com/api/messages/send/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lead": "15551234567",
    "message": "Hello from ViteMobile!",
    "server_type": "PUBLIC",
    "protocol": "SMS"
  }'
Expected Response:

{
  "id": 981,
  "status": "SENDING"
}
Step 3: Understanding Server Types
Choose the right server type for your use case
Public Relay (Default)
Use the shared public infrastructure. Perfect for getting started and low to medium volume sending.

{
  "server_type": "PUBLIC"
}
Private Server (SVM)
Use your own dedicated SMS Virtual Machine for higher volume, better performance, and dedicated resources.

{
  "server_type": "PRIVATE",
  "server_id": "your_svm_id"
}








Learn how to send SMS messages using the ViteMobile API. This guide covers everything from basic sending to advanced features.

Overview
The send SMS endpoint supports multiple sending modes and features
The /api/messages/send/ endpoint is a unified solution for sending SMS and MMS messages. It supports public relay infrastructure, private dedicated servers (SVMs), and SID-enabled campaigns for Enterprise tier users.

SMS & MMS
Bulk Sending
Public & Private Servers
SID Support
Basic Usage
Send your first SMS message
Endpoint
POST /api/messages/send/
Required Headers
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
Request Body
{
  "lead": "15551234567\n15557654321",
  "message": "Hello from ViteMobile!",
  "server_type": "PUBLIC",
  "protocol": "SMS"
}
Response
{
  "id": 981,
  "status": "SENDING"
}
Parameters
Complete parameter reference
lead Required
Newline-separated list of recipient phone numbers in E.164 format (e.g., +15551234567)

"15551234567\n15557654321"
message Required
The SMS message content. Messages longer than 160 characters are automatically split into multiple parts.

server_type optional
Either "PUBLIC" (default) for shared infrastructure or "PRIVATE" for dedicated SVM.

server_id optional
Required when server_type is "PRIVATE". The ID of your dedicated SVM.

protocol optional
"SMS" (default) or "MMS" for multimedia messages. MMS requires business or enterprise license.

sid optional
Service ID for Enterprise tier users. Allows sending from a custom alphanumeric sender ID.

image_0, image_1, ... optional
Image files for MMS messages. Maximum 5 images per message. Use multipart/form-data when including images.

Sending Modes
Choose the right mode for your use case
Public Relay (Default)
Use the shared public infrastructure. Perfect for getting started and low to medium volume sending.

{
  "server_type": "PUBLIC"
}
Private Server (SVM)
Use your own dedicated SMS Virtual Machine for higher volume, better performance, and dedicated resources.

{
  "server_type": "PRIVATE",
  "server_id": "your_svm_id"
}
SID Campaign (Enterprise Only)
Send from a custom alphanumeric sender ID. Requires Enterprise tier license and A2P registration completion.

{
  "server_type": "PUBLIC",
  "sid": "YourBrand"
}
Sending MMS Messages
Send multimedia messages with images
License Requirement
MMS is only available for business and enterprise tier licenses.
To send MMS messages, use multipart/form-data and include image files:

FormData:
  lead: "15551234567\n15557654321"
  message: "Check out these images"
  server_type: "PUBLIC"
  protocol: "MMS"
  image_0: [file]
  image_1: [file]
  ... (up to 5 images)
Maximum 5 images per message. Each image adds to the MMS cost.

Error Handling
Common errors and how to handle them
400 Bad Request
Invalid parameters or missing required fields. Check your request body.

401 Unauthorized
Invalid or expired access token. Refresh your token and try again.

403 Forbidden
Feature not available for your license tier (e.g., MMS, SID).

406 Not Acceptable
No valid phone numbers found in the lead list.

428 Precondition Required
Account verification required for bulk sending (more than 1 recipient).

429 Too Many Requests
Daily limit exceeded. Wait until the next day or upgrade your plan.



Code Examples
Ready-to-use code snippets in multiple programming languages for sending SMS with ViteMobile API.

Send SMS Examples
Copy and customize these examples for your application
cURL
JavaScript
Python
PHP
Java
Ruby

import requests

url = 'https://core.vitemobile.com/api/messages/send/'
headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}
data = {
    'lead': '15551234567\n15557654321',
    'message': 'Hello from ViteMobile SMS API',
    'server_type': 'PUBLIC',
    'protocol': 'SMS'
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(f"Campaign ID: {result['id']}")
print(f"Status: {result['status']}")
Send MMS Example
Example for sending multimedia messages with images
For MMS messages, use multipart/form-data and include image files:


// JavaScript example with FormData
const formData = new FormData();
formData.append('lead', '15551234567\n15557654321');
formData.append('message', 'Check out these images');
formData.append('server_type', 'PUBLIC');
formData.append('protocol', 'MMS');
formData.append('image_0', fileInput.files[0]);
formData.append('image_1', fileInput.files[1]);

const response = await fetch('https://core.vitemobile.com/api/messages/send/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  },
  body: formData
});
Note: MMS is only available for business and enterprise tier licenses. Maximum 5 images per message.

Using Private Server (SVM)
Example for sending SMS through your dedicated SVM

const response = await fetch('https://core.vitemobile.com/api/messages/send/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    lead: '15551234567\n15557654321',
    message: 'Hello from ViteMobile SMS API',
    server_type: 'PRIVATE',
    server_id: 'your_svm_id',
    protocol: 'SMS'
  })
});