---
alwaysApply: true
scene: git_message
---

# Strictly enforce Conventional Commits layout

format: "Conventional Commits style (<type>(<scope>): <short summary>)"

# Length restrictions to prevent Husky/commitlint failures

rules:

- "The first line (header) MUST NEVER exceed 100 characters."
- "The body description MUST be separated from the header by exactly one empty line."
- "CRITICAL: Hard-wrap the body text manually. No single line in the body or footer can exceed 90 characters."
- "Write the message in clear, concise imperative mood (e.g., 'add feature' instead of 'added feature')."

# Scope context mapping helpers for the AI

context:

- "Infer the <scope> using the primary domain or component modified (e.g., 'creatorcard', 'auth', 'database')."
- "If files are added to specs/ or models/, prefer scopes related to those core data structures."

# Example output formatting target for the AI model

example: |
feat(creatorcard): add initial creator card specification files

Add shared common timestamp model fields, complete CreatorCard
data model definitions, and initial endpoint stub file.
