# LinkedIn integration without signed-in scraping

RoleLinked does not automate a signed-in LinkedIn session, collect cookies, or
scrape account-only pages. LinkedIn does not offer a general open job-search
API, and browser-session scraping creates privacy, reliability, and account
risk. RoleLinked uses two safer workflows instead.

## Import your own LinkedIn jobs export

1. In LinkedIn, open **Settings & Privacy → Data privacy → Get a copy of your data**.
2. Request the export containing saved jobs and job applications.
3. Extract the downloaded archive into this private, Git-ignored folder:

   ```text
   data/linkedin-export/
   ```

4. Preview the import. Preview is read-only:

   ```bash
   npm run linkedin:import
   ```

5. Optionally write a private review document:

   ```bash
   node linkedin-jobs-import.mjs --write-report --summary
   ```

6. Only when you explicitly choose to do so, queue exported **Saved Jobs** for
   the normal evaluation workflow:

   ```bash
   node linkedin-jobs-import.mjs --queue --summary
   ```

Exported application history remains review-only. RoleLinked never marks those
rows Applied automatically because exports can be incomplete or stale.

## Find warm introductions from your connections export

Place LinkedIn's `Connections.csv` at `data/Connections.csv`, then run:

```bash
node linkedin-join.mjs --summary
```

This is an offline join against companies already in your local tracker and
portal list. It does not contact anyone. See `docs/LINKEDIN_JOIN.md` for filters
and formats.

## Privacy and removal

The export folder, review file, and connection CSV are covered by the private
user-data ignore rules. Confirm with:

```bash
git check-ignore -v data/linkedin-export data/linkedin-jobs-review.md data/Connections.csv
```

You may delete those files after import. Never commit them, attach them to an
issue, or include them in a bug report.
