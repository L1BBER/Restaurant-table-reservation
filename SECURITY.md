# Security and private data

This project is a portfolio/development project, not a security-certified production service.

- Never commit access tokens, passwords, private keys, pairing credentials, personal contact details, or private runtime data.
- Keep credentials in local environment files or a secret manager; commit only empty/example configuration.
- Review staged changes before pushing. A `.gitignore` does not remove already tracked files or clean Git history.
- Run a local secret scan before publishing: `gitleaks git --log-opts="--all --full-history" --redact=100`.
- If a credential is exposed, revoke or rotate it first, then remove it from the repository and affected history. Deleting the current file is not sufficient.
- Report a security issue through GitHub's private vulnerability reporting feature if available. Do not put secrets or personal data in public issues.

Secret scanners are a safeguard, not proof that a repository contains no sensitive information. Review images, databases, logs, archives, and third-party redistribution rights separately.
