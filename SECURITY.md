# Security Policy

## Supported Versions

The following table outlines which versions of this project are actively supported with security patches and updates.  
Only the most recent stable release and main development branch receive regular security maintenance.

| Version | Supported          |
| -------- | ------------------ |
| main (active) | :white_check_mark: |
| proj2 (development) | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please report it responsibly** to help protect users and maintain project integrity.

### 🧭 How to Report
- **Email:** `tiffintrails.team@gmail.com` (replace with the maintainer’s address)  
- **GitHub:** Use the *“Report a Vulnerability”* option under the project’s **Security tab**, or open a private issue if available.  

Please include:
1. A clear and concise description of the vulnerability.  
2. Steps to reproduce (if possible).  
3. The affected files, APIs, or versions.  
4. Any potential impact (e.g., data exposure, privilege escalation, etc.).  

---

### ⏱ Expected Response Time
- You will receive an **acknowledgment within 7 business days**.  
- If validated, a **fix or mitigation plan** will be shared within **30 days**.  
- Updates on investigation status will be communicated periodically until resolution.

---

### 🧩 Disclosure Policy
- Please **do not** publicly disclose the issue before a patch is released.  
- Once the vulnerability is fixed and released, the issue will be transparently documented in the **CHANGELOG** and **Security Advisories** section.  
- Contributors who report valid vulnerabilities may be acknowledged for responsible disclosure (if they wish).

---

### 🛠 Responsible Development Practices
To maintain secure contributions:
- Do **not commit secrets, tokens, or credentials** to the repository.  
- Sanitize all inputs and outputs.  
- Use environment variables for sensitive configurations.  
- Regularly update dependencies (`npm audit fix` / `pip install --upgrade -r requirements.txt`).  
- Avoid insecure code constructs such as `eval()`, dynamic imports, or arbitrary file writes.  

---

### 📘 Additional Resources
- [OWASP Top 10: Web Application Security Risks](https://owasp.org/www-project-top-ten/)  
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)  
- [Responsible Disclosure Guidelines (CNCF)](https://github.com/cncf/foundation/blob/main/responsible-disclosure.md)
