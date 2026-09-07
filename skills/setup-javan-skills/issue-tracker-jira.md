# Issue tracker

Issues for this repo live in **Jira** at `https://SITE.atlassian.net`.

## Ticket key pattern

Project keys in use: `KEY1`, `KEY2`. Ticket keys appear in branch names (`feature/KEY1-123-short-description`), commit subjects (`KEY1-123: add thing`), and PR titles.

```
Key regex (case-insensitive):  \b(KEY1|KEY2)-\d+\b
```

Normalise matches to upper case before fetching.

## How to fetch an issue

Preferred: the Jira tool the agent harness exposes, if one is configured (an Atlassian integration or MCP server). Fetch the issue by key with its description and comments.

Fallback: the REST API with an API token in the environment.

```bash
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "https://SITE.atlassian.net/rest/api/3/issue/<KEY>?fields=summary,description,comment,status,issuetype" \
  -H 'Accept: application/json'
```

Create an API token at https://id.atlassian.com/manage-profile/security/api-tokens.

## Where acceptance criteria appear

In the description under an "Acceptance criteria" heading, in a dedicated custom field if the project has one, or as a Given/When/Then block. Comments frequently amend requirements; always read them.

## Pull requests as a reference surface

A PR title or body may carry the key and a checklist that refines the ticket. When a PR is under review, read its body as well as the ticket.
