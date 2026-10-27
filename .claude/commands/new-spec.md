# /new-spec

Generate a new spec file for a TaskFlow feature.

## How to use

Run: /new-spec
The command will ask you two questions, then generate the spec.

## Steps

1. Ask the user:
   - "What is the feature name?" (example: projects-api, board-ui, comments)
   - "Describe the feature in one sentence."

2. Read these files for context before writing anything:
   - `AGENTS.md` (project rules)
   - `backend/AGENTS.md`
   - `frontend/AGENTS.md`
   - Any existing spec files in `.claude/specs/` to match the format.

3. Decide the feature number by counting the existing spec files and adding 1.

4. Generate the spec using this structure:

---

# Feature N: <Feature name>

## Goal

<One paragraph: what this feature does and why it exists>

## Requirements

<Numbered list of specific, testable requirements.
Each one has: the HTTP method and path (for API work),
the request shape, the response shape, status codes,
validation rules, and error cases.>

## Out of scope

<What this feature deliberately does not include>

## Acceptance criteria

<Checklist. Each item is independently verifiable.
Include: the happy path, at least two error cases,
test coverage, and no secrets committed.>

## Curl checks (for API features)

## <Copy-pasteable curl commands for every endpoint>

5. Save the file to `.claude/specs/0N-<feature-name>.md`.
6. Print: "Spec saved to .claude/specs/0N-<feature-name>.md. Review it before running /new-plan."
