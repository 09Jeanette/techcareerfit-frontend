# TechCareerFit — API Reference for Frontend

Base URL: `` (collection variable in postman)

Auth
- POST `/auth/register` — register user. Body: `{ full_name, email, password }`
- POST `/auth/login` — login. Body: `{ email, password }`. Response contains `access_token`. Set `Authorization: Bearer {{access_token}}` for protected endpoints.
 - POST `/auth/password-reset/request` — request password reset. Body: `{ email }`. Response (dev): `{ message, reset_token }`. Note: in production the reset token should be emailed to the user; do not expose tokens to the frontend UI.
 - POST `/auth/password-reset/confirm` — confirm password reset. Body: `{ reset_token, new_password }`. Response: `{ message }` on success.

CV
- POST `/cv/upload` — multipart form-data `file` (PDF/DOCX). Returns `id` and `file_url`.
- POST `/cv/{cv_id}/parse` — parse remote CV; returns `parsed_data`.
- GET `/cv/{cv_id}` — fetch CV metadata (owner-only).
- GET `/admin/cvs/{cv_id}/parsed` — admin-only parsed view.
- GET `/admin/cvs/{cv_id}/download` — admin-only download of the original CV file.

Jobs & ATS
- POST `/ats/jobs` — create job description. Body: `{ title, company, description }`.
- POST `/ats/analyze` — analyze CV vs job. Body: `{ cv_id, job_id }`. Response: `{ score, missing_skills, recommendations, learning_resources }`.

Reports
- GET `/reports/{report_id}/download` — download JSON ATS report (owner or admin).

Applications
- POST `/applications/` — create application. Supports `job_link` or `application_email`/`application_subject`.
- GET `/applications/` — list user's applications.
- GET/PUT/DELETE `/applications/{id}` — manage single application.

Admin (requires `role='admin'`)
- GET `/admin/` — summary stats.
- POST `/admin/users/` — create user (body: `full_name,email,password`).
- POST `/admin/users/{user_id}/promote` — make user admin.
- POST `/admin/users/{user_id}/suspend` — suspend account.
- POST `/admin/users/{user_id}/unsuspend` — unsuspend account.
- GET/DELETE `/admin/jobs/` `/admin/jobs/{id}` — list/delete job descriptions.
- GET/DELETE `/admin/reports/` `/admin/reports/{id}` — list/delete reports.
- GET `/admin/cvs/` — list all CVs; see parsed/download endpoints above.

Notes for frontend
- Use `{{access_token}}` collection variable after login for Authorization headers.
- File uploads use multipart form-data; field name is `file`.
- `learning_resources` in ATS analyze is an array of objects: `{ skill, title, provider, url, type, level }`.

Password reset notes
- The `/auth/password-reset/request` endpoint will generate a short-lived `reset_token`. In development the token is returned in the response for testing; in production, send the token via email and accept only the `reset_token` plus `new_password` at `/auth/password-reset/confirm`.
- The frontend flow should be: collect user's email -> call `password-reset/request` -> prompt user to check email for token/link -> submit token + new password to `password-reset/confirm`.

See the included Postman collection: `docs/postman_collection.json`.
