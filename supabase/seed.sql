-- Demo job catalog for local development.
insert into public.jobs
  (title, company, location, is_remote, employment_type, seniority_level, salary_min, salary_max, description, skills, apply_url, posted_at)
values
  ('Product Designer', 'Acme Inc.', 'Remote', true, 'full_time', 'mid', 95000, 125000,
   'We''re looking for a product designer who is passionate about creating beautiful, meaningful experiences that solve real user problems.',
   array['Figma', 'UI Design', 'Prototyping', 'User Research'], 'https://example.com/jobs/product-designer', now() - interval '2 days'),
  ('UI/UX Designer', 'Vertex', 'Hybrid', false, 'full_time', 'senior', 110000, 140000,
   'Lead the design of our flagship product experience, partnering closely with product and engineering.',
   array['Design Systems', 'Figma', 'Accessibility'], 'https://example.com/jobs/ui-ux-designer', now() - interval '3 days'),
  ('Design System Designer', 'Flow Studio', 'Remote', true, 'full_time', 'mid', 100000, 130000,
   'Own and evolve our design system across web and mobile products.',
   array['Design Systems', 'Component Libraries', 'Tokens'], 'https://example.com/jobs/design-system-designer', now() - interval '4 days'),
  ('Senior Frontend Engineer', 'Northwind Labs', 'Remote', true, 'full_time', 'senior', 140000, 175000,
   'Build fast, accessible, and delightful web interfaces used by thousands of professionals every day.',
   array['TypeScript', 'React', 'Next.js', 'Accessibility'], 'https://example.com/jobs/senior-frontend-engineer', now() - interval '1 day'),
  ('Product Manager', 'Meridian', 'San Francisco, CA', false, 'full_time', 'senior', 150000, 190000,
   'Drive product strategy and execution for our career platform''s core experience.',
   array['Product Strategy', 'Roadmapping', 'User Research'], 'https://example.com/jobs/product-manager', now() - interval '5 days');

-- Demo learning catalog for the Learning Hub.
insert into public.learning_resources
  (title, description, category, resource_type, skill_tags, url, duration_minutes)
values
  ('Mastering the STAR Method', 'Structure compelling behavioral interview answers using Situation, Task, Action, Result.', 'Interviewing', 'article', array['Interviewing', 'Communication'], 'https://example.com/learning/star-method', 10),
  ('Portfolio Case Studies That Get Callbacks', 'How to structure a case study that shows real product thinking, not just polished screens.', 'Design', 'article', array['Portfolio', 'Design'], 'https://example.com/learning/portfolio-case-studies', 15),
  ('Negotiating Your Offer with Confidence', 'A practical walkthrough of salary negotiation scripts and timing.', 'Negotiation', 'video', array['Negotiation', 'Salary'], 'https://example.com/learning/negotiating-offers', 22),
  ('Design Systems Fundamentals', 'A short course on tokens, component APIs, and governance for design systems.', 'Design', 'course', array['Design Systems', 'Figma'], 'https://example.com/learning/design-systems-fundamentals', 90),
  ('Modern React Patterns', 'Hooks, composition, and server components explained through practical examples.', 'Engineering', 'course', array['React', 'TypeScript'], 'https://example.com/learning/modern-react-patterns', 120),
  ('Writing Cover Letters That Aren''t Generic', 'A framework for tailoring a cover letter to a specific role in under 20 minutes.', 'Job Search', 'article', array['Cover Letters', 'Writing'], 'https://example.com/learning/cover-letters', 12);
