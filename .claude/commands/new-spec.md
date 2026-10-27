# /new-spec

Generate a spec file for a LibraryHub feature.

## How to use

Run: /new-spec
The command asks three questions, then generates the spec.

## Steps

1. Ask the user:
   - "What is the feature name?" (example: catalog, auth, loans, reservations)
   - "Describe the feature in one sentence."
   - "List the business rules and edge cases, or say none."

2. Read these files for context before writing anything:
   - `CLAUDE.md` (project rules and business rules)
   - Any existing spec files in `.claude/specs/` to match the format.

3. Decide the feature number: count the existing spec files and add 1.
   Pad it to two digits (01, 02, ... 10), so the files sort correctly.

4. Generate the spec using this structure:

# Feature N: <Feature name>

## Goal
One paragraph: what this feature does and why it exists.

## Requirements
Numbered, specific, testable requirements. For each API endpoint include
the HTTP method and path, request shape, response shape, status codes,
validation rules and error cases.

## Out of scope
What this feature deliberately does not include. Anything from the
business rules that belongs to another feature goes here.

## Acceptance criteria
A checklist where each item is independently verifiable. Include the
happy path, at least two error cases, unit test coverage, and no
secrets or .env files committed.

## Curl checks (for API features)
Copy-pasteable curl commands for every endpoint.

5. Save the file to `.claude/specs/0N-<feature-name>.md`.

6. Print: "Spec saved to .claude/specs/0N-<feature-name>.md. Review it before planning."