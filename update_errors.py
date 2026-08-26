import re

with open('netlify/functions/subscribers.mts', 'r') as f:
    content = f.read()

content = re.sub(r'\{ error: "Subscriber not found" \}', '{ code: "NOT_FOUND", message: "Subscriber not found" }', content)
content = re.sub(r'\{ error: "Email is required" \}', '{ code: "VALIDATION_FAILED", message: "Email is required" }', content)
content = re.sub(r'\{ error: "ID query parameter is required" \}', '{ code: "VALIDATION_FAILED", message: "ID query parameter is required" }', content)
content = re.sub(r'\{ error: "ID or email query parameter is required" \}', '{ code: "VALIDATION_FAILED", message: "ID or email query parameter is required" }', content)
content = re.sub(r'\{ error: "Method not allowed" \}', '{ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" }', content)
content = re.sub(r'\{ error: "Internal server error" \}', '{ code: "INTERNAL_ERROR", message: "Internal server error" }', content)

with open('netlify/functions/subscribers.mts', 'w') as f:
    f.write(content)
