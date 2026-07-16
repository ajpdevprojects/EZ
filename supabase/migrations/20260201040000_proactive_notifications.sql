-- Product Experience Directive: Proactive Software Brain. The daily
-- background job needs two additional notification types so it can
-- surface follow-up nudges and resume-performance wins alongside the
-- existing daily briefing / new opportunity notifications.

alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'daily_briefing', 'new_opportunity', 'recruiter_replied',
    'interview_scheduled', 'interview_reminder', 'offer_received',
    'journey_completed', 'follow_up_recommended', 'resume_performing_well'
  ));
