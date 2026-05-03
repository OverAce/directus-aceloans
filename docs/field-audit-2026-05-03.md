# Directus Field Audit — 2026-05-03

Snapshot of every column across the user-facing collections joined with its
Directus field metadata. Use this to mark which fields to hide, group, mark
readonly, or drop from the manifest.

**Read this column-by-column:**
- `sort`: Directus form-order (`-` = no meta = renders at end alphabetically).
- `hidden`/`readonly`: `false`/`true` from `directus_fields`. `-` = no meta row → defaults (visible, editable).
- `interface`/`display`: Directus UI widgets. `-` = no meta → falls back to type-default.
- `group`: Field-group name within the form layout. `-` = ungrouped.

**How to mark up:**
- Strike through (`~~field~~`) fields you want hidden.
- Add `(readonly)` after the field name for ones that should be readonly.
- Add `(drop)` for fields that should be removed from the schema entirely (separate migration).
- Add `(group: foo)` for fields that should be moved into a named group.

Generated: 2026-05-03 from `localhost:54322`.

## events.calendar

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id` | text | - | - | - | - | - |  |
| - | `id_consultation` | text | - | - | - | - | - |  |
| - | `ical_uid` | text | - | - | - | - | - |  |
| - | `etag` | text | - | - | - | - | - |  |
| - | `name_event` | text | - | - | - | - | - | Esemény neve - AD-5 naming |
| - | `event_description` | text | - | - | - | - | - |  |
| - | `status_event` | text | - | - | - | - | - | Esemény státusza - AD-5 naming |
| - | `event_start` | timestamp with time zone | - | - | - | - | - |  |
| - | `event_end` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_event_created` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_event_modified` | timestamp with time zone | - | - | - | - | - |  |
| - | `location` | text | - | - | - | - | - |  |
| - | `conference_link` | text | - | - | - | - | - |  |
| - | `calendar_link` | text | - | - | - | - | - |  |
| - | `coda_source_url` | text | - | - | - | - | - |  |
| - | `id_lead` | text | - | - | - | - | - | Lead azonosító - AD-5 naming |
| - | `name_lead` | text | - | - | - | - | - |  |
| - | `lead_email` | text | - | - | - | - | - |  |
| - | `name_consultant` | text | - | - | - | - | - |  |
| - | `consultant_email` | text | - | - | - | - | - |  |
| - | `sales_phase` | text | - | - | - | - | - |  |
| - | `event_type` | text | - | - | - | - | - |  |
| - | `id_contact` | uuid | - | - | - | - | - | Contact identifier (UUID) - references public.contact.id_contact |
| - | `color_id` | text | - | - | - | - | - |  |
| - | `visibility` | text | - | - | - | - | - |  |
| - | `count_sequence` | bigint | - | - | - | - | - |  |
| - | `event_type_calendar` | text | - | - | - | - | - |  |
| - | `is_source_event_sync` | boolean | - | - | - | - | - |  |
| - | `is_source_consultation` | boolean | - | - | - | - | - |  |
| - | `match_method` | text | - | - | - | - | - |  |
| - | `date_created` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_modified` | timestamp with time zone | - | - | - | - | - |  |
| - | `id_meeting` | uuid | - | - | - | - | - | Találkozó Azonosító - Reference to public.meeting for sales meetings |
| - | `meeting_notes_file_id` | text | - | - | - | - | - | Google Drive file ID for meeting notes document |
| - | `meeting_notes_folder_id` | text | - | - | - | - | - | Target Google Drive folder ID for organizing notes |
| - | `meeting_notes_url` | text | - | - | - | - | - | Direct URL to meeting notes Google Doc |
| - | `drive_folder_path` | text | - | - | - | - | - | Full path in Drive folder structure |
| - | `id_consultant` | uuid | - | - | - | - | - | Tanácsadó Felhasználó Azonosító - Reference to public.user |

## events.consent

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_consent` | uuid | - | - | - | - | - | Hozzájárulás Azonosító - AD-5 naming |
| - | `id_contact` | uuid | - | - | - | - | - |  |
| - | `id_lead` | character varying | - | - | - | - | - |  |
| - | `type_consent` | text | - | - | - | - | - | Hozzájárulás típusa - AD-5 naming |
| - | `action_consent` | text | - | - | - | - | - | Action taken: consent-request, consent-duplicate-request, consent-withdrawal, co |
| - | `method_consent` | text | - | - | - | - | - |  |
| - | `id_consent_entry` | text | - | - | - | - | - | Gravity Forms entry ID |
| - | `form_version` | text | - | - | - | - | - |  |
| - | `name_customer` | text | - | - | - | - | - |  |
| - | `customer_email` | text | - | - | - | - | - |  |
| - | `customer_phone` | text | - | - | - | - | - |  |
| - | `gender` | text | - | - | - | - | - |  |
| - | `name_lead_owner` | text | - | - | - | - | - |  |
| - | `consultant_zoho_id` | text | - | - | - | - | - | Zoho Bigin consultant ID for external system mapping |
| - | `ip_address` | inet | - | - | - | - | - |  |
| - | `user_agent` | text | - | - | - | - | - |  |
| - | `date_expires` | timestamp with time zone | - | - | - | - | - | When consent expires (NULL for indefinite) |
| - | `date_consent` | timestamp with time zone | - | - | - | - | - | Hozzájárulás dátuma - AD-5 naming |
| - | `date_modified` | timestamp with time zone | - | - | - | - | - |  |
| - | `notes` | text | - | - | - | - | - |  |
| - | `id_consultant` | uuid | - | - | - | - | - | Tanácsadó azonosító - FK to public.user(id_user) |
| - | `consent_statement` | text | - | - | - | - | - | The actual consent text/agreement that customer accepted |
| - | `id_consent_request` | uuid | - | - | - | - | - |  |

## events.consent_request

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_request` | uuid | - | - | - | - | - | Kérelem Azonosító - Unique consent request identifier |
| - | `id_contact` | uuid | - | - | - | - | - |  |
| - | `id_lead` | character varying | - | - | - | - | - |  |
| - | `id_consultant` | uuid | - | - | - | - | - |  |
| - | `id_email_message` | text | - | - | - | - | - |  |
| - | `form_link_token` | text | - | - | - | - | - |  |
| - | `form_link_url` | text | - | - | - | - | - |  |
| - | `status_request` | text | - | - | - | - | - | Request status: pending → sent → delivered → clicked → submitted/bounced/expired |
| - | `status_method` | text | - | - | - | - | - |  |
| - | `expires_at` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_request` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_created` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_modified` | timestamp with time zone | - | - | - | - | - |  |
| - | `id_request_entry` | text | - | - | - | - | - |  |
| - | `type_request` | text | - | - | - | - | - | Why the request was made: consent-request (first time), consent-request-correcti |
| - | `origin_system` | text | - | - | - | - | - |  |
| - | `origin_type` | text | - | - | - | - | - |  |
| - | `origin_entry_id` | text | - | - | - | - | - |  |
| - | `origin_parent_entry_id` | text | - | - | - | - | - |  |
| - | `id_meeting` | uuid | - | - | - | - | - |  |
| - | `origin_context` | jsonb | - | - | - | - | - |  |
| - | `contact_email` | text | - | - | - | - | - | Email address the request was sent to (snapshot at send time). Independent of pu |

## events.email

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id` | bigint | - | - | - | - | - |  |
| - | `message_id` | text | - | - | - | - | - |  |
| - | `status` | text | - | - | - | - | - |  |
| - | `sent_at` | timestamp with time zone | - | - | - | - | - |  |
| - | `delivered_at` | timestamp with time zone | - | - | - | - | - |  |
| - | `bounced_at` | timestamp with time zone | - | - | - | - | - |  |
| - | `complained_at` | timestamp with time zone | - | - | - | - | - |  |
| - | `is_opened` | boolean | - | - | - | - | - |  |
| - | `first_opened_at` | timestamp with time zone | - | - | - | - | - |  |
| - | `is_clicked` | boolean | - | - | - | - | - |  |
| - | `first_clicked_at` | timestamp with time zone | - | - | - | - | - |  |
| - | `event_details` | jsonb | - | - | - | - | - |  |
| - | `sender` | text | - | - | - | - | - |  |
| - | `subject` | text | - | - | - | - | - |  |
| - | `sender_id` | uuid | - | - | - | - | - | User/consultant who triggered the email send (FK to public.user.id_user) |

## public.account

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| 5 | `code` | text | false | true | input | raw | - | Affiliate Identifier |
| 6 | `slug` | text | false | false | input | - | - |  |
| - | `id_account` | bigint | - | - | - | - | - | FK to address_entity.id - address data ONLY. WordPress site_id stored in externa |
| - | `name_company` | text | false | false | input | - | - | Cégnév - AD-5 naming |
| - | `name_office` | text | false | false | input | - | - | Iroda neve - AD-5 naming |
| - | `email_office` | text | false | false | input | formatted-value | - |  |
| - | `phone_office` | text | false | false | input | - | - | The phone for the partner |
| - | `phone_mobile` | text | - | - | - | - | - |  |
| - | `phone_landline` | text | - | - | - | - | - |  |
| - | `is_active` | boolean | false | false | boolean | - | - | Aktív-e - AD-5 naming |
| - | `date_created` | timestamp with time zone | false | true | datetime | - | - |  |
| - | `date_modified` | timestamp with time zone | false | true | datetime | - | - |  |

## public.contact

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| 3 | `sort` | integer | true | false | input | - | - |  |
| 5 | `date_created` | timestamp with time zone | true | true | datetime | datetime | - |  |
| 11 | `email` | character varying | false | false | input | formatted-value | - |  |
| 12 | `date_birth` | date | false | false | datetime | - | - |  |
| - | `id_contact` | uuid | false | true | input | - | - | Kapcsolat Azonosító - AD-5 naming |
| - | `status_contact` | character varying | - | - | - | - | - | Kapcsolat státusza - AD-5 naming |
| - | `id_user_created` | uuid | - | - | - | - | - |  |
| - | `id_user_modified` | uuid | - | - | - | - | - |  |
| - | `date_modified` | timestamp with time zone | false | true | datetime | - | - | Módosítás dátuma - Last modification timestamp |
| - | `name_first` | character varying | false | false | input | - | - | Keresztnév - First name |
| - | `name_last` | character varying | false | false | input | - | - | Vezetéknév - Last name |
| - | `name_middle` | character varying | false | false | input | - | - | Középső név - Middle name |
| - | `phone` | character varying | false | false | input | - | - |  |
| - | `gender` | character varying | false | false | select-dropdown | - | - |  |
| - | `status_outcome` | text | false | false | select-dropdown | labels | - | CRM outcome: won (deal closed), off (no longer interested). NULL = no outcome ye |
| - | `is_unreachable` | boolean | false | false | boolean | - | - | NVF flag - 3+ unanswered call attempts (Nem volt felvéve). Source: Bigin Tag NVF |
| - | `is_protected` | boolean | false | false | boolean | - | - | Select flag - deal closing stage, owner reassignment blocked. Source: Bigin Tag  |
| - | `interest` | text | false | false | input | - | - | Product interest flag. ltp = Lakástakarékpénztár. Source: Bigin Tag LTP. |
| - | `is_needs_review` | boolean | - | - | - | - | - | Flags record for manual review (ETL data quality issues) |
| - | `review_notes` | text | - | - | - | - | - | Notes explaining why review is needed |
| - | `is_name_corrected` | boolean | - | - | - | - | - |  |
| - | `date_synced_to_crm` | timestamp with time zone | - | - | - | - | - | Last time corrected data was pushed back to Bigin CRM. NULL = never synced. |

## public.deal

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_deal` | uuid | false | true | input | - | - |  |
| - | `id_lead` | character varying | false | true | select-dropdown-m2o | related-values | - | Lead this deal belongs to |
| - | `id_owner` | uuid | false | true | select-dropdown-m2o | related-values | - | Sales consultant who owns this deal |
| - | `id_application` | uuid | false | true | select-dropdown-m2o | related-values | - | Linked loan application (if submitted) |
| - | `status_deal` | text | false | false | select-dropdown | labels | - | Deal pipeline status: in_progress → submitted → approved → contracted → disburse |
| - | `amount_deal` | numeric | false | false | input | formatted-value | - | Deal value (loan amount) |
| - | `date_start` | timestamp with time zone | false | false | datetime | - | - |  |
| - | `date_end` | timestamp with time zone | false | false | datetime | - | - |  |
| - | `date_created` | timestamp with time zone | false | true | datetime | - | - |  |
| - | `date_modified` | timestamp with time zone | false | true | datetime | - | - |  |
| - | `is_needs_review` | boolean | - | - | - | - | - | Flags record for manual review (ETL data quality issues) |
| - | `review_notes` | text | - | - | - | - | - | Notes explaining why review is needed |
| - | `date_archived` | timestamp with time zone | false | true | datetime | - | - | When the deal was archived. NULL = active deal. |

## public.file

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_file` | uuid | - | - | - | - | - |  |
| - | `id_folder` | uuid | - | - | - | - | - |  |
| - | `id_google_drive` | text | - | - | - | - | - |  |
| - | `name_file` | text | - | - | - | - | - |  |
| - | `mime_type` | text | - | - | - | - | - |  |
| - | `url` | text | - | - | - | - | - |  |
| - | `date_created` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_modified` | timestamp with time zone | - | - | - | - | - |  |

## public.folder

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_folder` | uuid | - | - | - | - | - | Unique folder identifier (UUID primary key) |
| - | `name` | text | - | - | - | - | - | Google Drive folder name (unique) |
| - | `date_created` | timestamp with time zone | - | - | - | - | - | Timestamp when folder record was created |
| - | `date_modified` | timestamp with time zone | - | - | - | - | - | Timestamp when folder record was last modified |

## public.lead

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| 2 | `date_created` | timestamp with time zone | false | true | datetime | - | - |  |
| 7 | `category` | text | false | false | input | - | - |  |
| 8 | `notes` | text | false | false | input-multiline | - | - |  |
| 13 | `source_url` | text | true | false | - | - | - |  |
| 18 | `workflow_step` | text | false | false | input | - | - |  |
| - | `id_lead` | character varying | false | true | input | - | - | Lead Azonosító - AD-5 naming (VARCHAR for legacy compatibility) |
| - | `date_modified` | timestamp with time zone | false | true | datetime | - | - | Date Modified - Last modification timestamp |
| - | `amount_lead` | numeric | false | false | input | formatted-value | - | Lead Amount - Total requested mortgage amount |
| - | `amount_loan` | numeric | false | false | input | formatted-value | - | Loan Amount - Final approved loan amount |
| - | `amount_down` | numeric | false | false | input | formatted-value | - | Down Payment Amount - Customer down payment |
| - | `is_updates_requested` | boolean | false | false | boolean | - | - | Updates Requested - Boolean flag for source data refresh needs |
| - | `status_approval` | text | false | false | select-dropdown | labels | - | Approval Status - Current approval state (approved, pending, rejected) |
| - | `status_workflow` | text | false | false | select-dropdown | labels | - | Workflow Status - Current position in sales workflow |
| - | `date_workflow` | timestamp with time zone | - | - | - | - | - | Workflow Date - Last workflow status change timestamp |
| - | `status_final` | text | false | false | select-dropdown | labels | - | Final Status - Outcome of lead (won, lost, abandoned) |
| - | `id_source_account` | text | false | true | select-dropdown-m2o | related-values | - |  |
| - | `id_source_user` | uuid | false | true | select-dropdown-m2o | related-values | - |  |
| - | `id_lead_entry` | text | - | - | - | - | - | Gravity Forms entry ID from initial contact form |
| - | `is_needs_review` | boolean | - | - | - | - | - | Flags record for manual review (ETL data quality issues) |
| - | `review_notes` | text | - | - | - | - | - | Notes explaining why review is needed |
| - | `rating` | integer | false | false | select-dropdown | - | - | Lead quality rating: 1=High priority, 2=Medium, 3=Cold |
| - | `name_first` | text | false | true | input | - | - | Denormalized from primary applicant (lead_contact.is_primary=true → contact.name |
| - | `name_last` | text | false | true | input | - | - | Denormalized from primary applicant contact. Maintained by trigger. |
| - | `email` | text | false | true | input | - | - | Denormalized from primary applicant contact. Maintained by trigger. |
| - | `phone` | text | false | true | input | - | - | Denormalized from primary applicant contact. Maintained by trigger. |

## public.lead_contact

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| 2 | `id_contact` | uuid | false | false | select-dropdown-m2o | related-values | - | Reference to contact entity |
| 3 | `id_lead` | character varying | false | false | select-dropdown-m2o | related-values | - | Reference to lead (legacy varchar type from Zoho) |
| 4 | `is_primary` | boolean | false | false | - | - | - | Indicates if this is the primary contact for the lead |
| 5 | `relationship_type` | text | false | false | - | - | - | Type of relationship (e.g., primary_applicant, co_applicant, guarantor) |
| 6 | `date_created` | timestamp with time zone | false | false | - | - | - |  |
| - | `id_lead_contact` | uuid | - | - | - | - | - | Primary key for lead-contact relationship |
| - | `date_modified` | timestamp with time zone | - | - | - | - | - |  |

## public.loan

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_loan` | uuid | false | true | input | - | - |  |
| - | `id_application` | uuid | false | true | select-dropdown-m2o | related-values | - | Pályázat Azonosító - Linked loan application |
| - | `id_created_by` | uuid | false | true | select-dropdown-m2o | related-values | - | Létrehozó - User who created this record |
| - | `type_loan` | text | false | false | select-dropdown | - | - | Hitel típusa - mortgage, personal_loan, refinance, home_equity, bridge_loan |
| - | `class_loan` | text | false | false | select-dropdown | - | - | Hitel osztály - market, subsidized, mixed |
| - | `amount_loan` | numeric | false | false | input | formatted-value | - | Hitel összege - Loan amount |
| - | `count_term` | integer | false | false | input | formatted-value | - | Futamidő (hónap) - Loan term in months |
| - | `status_loan` | text | false | false | select-dropdown | labels | - | Loan lifecycle: created → disbursed_partial/disbursed → repaid. Also: defaulted, |
| - | `is_legacy_format` | boolean | false | true | boolean | - | - | Pre-2023 record imported from legacy tracking |
| - | `legacy_source` | text | - | - | - | - | - | Source system for legacy records |
| - | `is_needs_review` | boolean | false | false | boolean | - | - | Flags record for manual review (ETL data quality issues) |
| - | `review_notes` | text | false | false | input-multiline | - | - | Notes explaining why review is needed |
| - | `date_created` | timestamp with time zone | false | true | datetime | - | - |  |
| - | `date_modified` | timestamp with time zone | false | true | datetime | - | - |  |

## public.loan_application

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_application` | uuid | false | true | input | - | - |  |
| - | `id_lead` | character varying | false | true | select-dropdown-m2o | related-values | - | Lead this application belongs to |
| - | `id_vendor` | uuid | false | true | select-dropdown-m2o | related-values | - | Bank/vendor application submitted to |
| - | `id_contact` | uuid | false | true | select-dropdown-m2o | related-values | - | Primary applicant contact |
| - | `id_deal` | uuid | - | - | - | - | - | Associated deal (if exists) |
| - | `type_application` | text | - | - | - | - | - | Application type: mortgage, personal_loan, refinance, home_equity |
| - | `status_application` | text | false | false | select-dropdown | labels | - | Application lifecycle: draft → submitted → under_review → approved_conditionally |
| - | `amount_requested` | numeric | - | - | - | - | - |  |
| - | `amount_approved` | numeric | - | - | - | - | - |  |
| - | `date_submitted` | timestamp with time zone | false | false | datetime | - | - |  |
| - | `date_accepted` | timestamp with time zone | - | - | - | - | - |  |
| - | `date_approved` | timestamp with time zone | false | false | datetime | - | - |  |
| - | `date_disbursed` | timestamp with time zone | - | - | - | - | - |  |
| - | `id_created_by` | uuid | false | true | select-dropdown-m2o | related-values | - |  |
| - | `id_modifier` | uuid | false | true | select-dropdown-m2o | related-values | - |  |
| - | `external_application_id` | text | - | - | - | - | - | Bank reference number for this application |
| - | `date_created` | timestamp with time zone | false | true | datetime | - | - |  |
| - | `date_modified` | timestamp with time zone | false | true | datetime | - | - |  |
| - | `is_needs_review` | boolean | - | - | - | - | - | Flags record for manual review (ETL data quality issues) |
| - | `review_notes` | text | - | - | - | - | - | Notes explaining why review is needed |
| - | `id_previous_application` | uuid | - | - | - | - | - | Self-FK to previous application when customer restarts process with same or diff |
| - | `date_expired` | timestamp with time zone | false | true | datetime | - | - | When the application expired. NULL = not expired. |

## public.meeting

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_meeting` | uuid | - | - | - | - | - | Találkozó Azonosító - AD-5 naming |
| - | `id_lead` | character varying | - | - | - | - | - | Lead Azonosító - Reference to lead in sales pipeline |
| - | `id_contact` | uuid | - | - | - | - | - | Kapcsolat Azonosító - Reference to customer contact |
| - | `id_user` | uuid | - | - | - | - | - | Felhasználó Azonosító - Assigned consultant (sales agent) |
| - | `name_meeting` | text | - | - | - | - | - | Találkozó neve - AD-5 naming |
| - | `status_type` | USER-DEFINED | - | - | - | - | - | Találkozó Típusa - Meeting format (online, in_person, phone, loan_package_signin |
| - | `date_scheduled` | timestamp with time zone | - | - | - | - | - | Ütemezett Időpont - When meeting is scheduled to start |
| - | `date_actual_start` | timestamp with time zone | - | - | - | - | - | Tényleges Kezdés - When meeting actually started |
| - | `date_actual_end` | timestamp with time zone | - | - | - | - | - | Tényleges Befejezés - When meeting actually ended |
| - | `location` | text | - | - | - | - | - | Helyszín - Physical location or address |
| - | `meeting_link` | text | - | - | - | - | - | Találkozó Link - Video conference URL |
| - | `status_outcome` | USER-DEFINED | - | - | - | - | - | Business outcome after meeting completion (deal_created, follow_up_needed, not_i |
| - | `next_steps` | text | - | - | - | - | - | Következő Lépések - Action items and next steps |
| - | `notes` | text | - | - | - | - | - | Jegyzetek - Meeting notes and observations |
| - | `intake_documents` | jsonb | - | - | - | - | - | Bejövő Dokumentumok - Array of intake document references |
| - | `google_calendar_url` | text | - | - | - | - | - | Google Naptár URL - Direct link to Google Calendar event |
| - | `id_google_calendar_event` | text | - | - | - | - | - | Google Esemény Azonosító - Google Calendar event ID |
| - | `id_calendar_event` | text | - | - | - | - | - | Naptár Esemény Azonosító - Reference to events.calendar for Google Calendar sync |
| - | `id_created_by` | uuid | - | - | - | - | - | Létrehozta - User who created the meeting record |
| - | `date_created` | timestamp with time zone | - | - | - | - | - | Létrehozva - When record was created |
| - | `date_modified` | timestamp with time zone | - | - | - | - | - | Módosítás dátuma - AD-5 naming |
| - | `status_meeting` | USER-DEFINED | - | - | - | - | - | Meeting lifecycle status — did the meeting happen? (scheduled, confirmed, comple |
| - | `id_address` | bigint | - | - | - | - | - |  |
| - | `id_meeting_notes_file` | uuid | - | - | - | - | - |  |
| - | `id_meeting_notes_folder` | uuid | - | - | - | - | - |  |

## public.user

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_user` | uuid | false | true | input | - | - | Felhasználó Azonosító - Auto-generated UUID primary key (not linked to auth) |
| - | `email` | text | false | false | input | - | - | Bejelentkezési email - Login email address |
| - | `role` | USER-DEFINED | false | false | select-dropdown | labels | - | Szerepkör - Business role (admin, agent, consultant, etc.) |
| - | `id_contact` | uuid | false | true | select-dropdown-m2o | related-values | - | Kapcsolattartó Azonosító - Personal info via contact record |
| - | `id_account` | text | false | true | select-dropdown-m2o | related-values | - | Iroda Kód - Real estate office by account code |
| - | `id_legacy_agent` | bigint | true | true | input | - | - | WordPress felhasználó azonosító - Legacy WordPress user ID |
| - | `id_crm_bigin` | text | false | true | input | - | - | Zoho Bigin felhasználó azonosító - CRM user ID (staff login) |
| - | `date_created` | timestamp with time zone | false | true | datetime | datetime | - | Létrehozás dátuma - Record creation timestamp |
| - | `date_modified` | timestamp with time zone | false | true | datetime | datetime | - | Módosítás dátuma - Last modification timestamp |
| - | `id_auth` | uuid | - | - | - | - | - | Auth azonosító - Optional link to auth.users (populated when user authenticates) |

## public.vendor

| sort | field | type | hidden | readonly | interface | display | group | comment |
|------|-------|------|--------|----------|-----------|---------|-------|---------|
| - | `id_vendor` | uuid | false | true | input | - | - |  |
| - | `id_brand` | uuid | false | true | select-dropdown-m2o | related-values | - |  |
| - | `id_folder` | uuid | - | - | - | - | - |  |
| - | `id_branch` | uuid | - | - | - | - | - |  |
| - | `name_vendor` | text | false | false | input | - | - |  |
| - | `name_legal` | text | false | false | input | - | - |  |
| - | `code_vendor` | text | false | false | input | - | - |  |
| - | `url_website` | text | false | false | input | formatted-value | - |  |
| - | `url_logo` | text | false | false | input | - | - |  |
| - | `name_drive_folder` | text | - | - | - | - | - |  |
| - | `status_vendor` | text | false | false | select-dropdown | labels | - |  |
| - | `identifier_registration` | text | false | false | input | - | - |  |
| - | `date_created` | timestamp with time zone | false | true | datetime | - | - |  |
| - | `date_modified` | timestamp with time zone | false | true | datetime | - | - |  |
