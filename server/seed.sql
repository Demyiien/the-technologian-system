-- Optional sample data for The Technologian Student Press.
-- Run this AFTER schema.sql, only if you want sample rows to test with.
-- Safe to run more than once against an empty set of these tables;
-- if you've already seeded, clear the tables first or skip this file.

INSERT INTO users (name, email, cluster) VALUES
  ('Maria Santos', 'maria.santos@technologian.test', 'Writing'),
  ('Rico Alonzo', 'rico.alonzo@technologian.test', 'Writing'),
  ('Sofia Ramos', 'sofia.ramos@technologian.test', 'Creatives'),
  ('Ella Navarro', 'ella.navarro@technologian.test', 'Online & Digital');

INSERT INTO articles (title, description, status, author_id, deadline) VALUES
  (
    'Enrollment Numbers Hit Record High',
    'Coverage of this term''s record enrollment figures.',
    'In Progress',
    (SELECT id FROM users WHERE email = 'maria.santos@technologian.test'),
    '2026-09-02'
  );

INSERT INTO requests (requester_id, target_cluster, request_type, subject, description, priority, deadline, status, article_id, assigned_to) VALUES
  (
    (SELECT id FROM users WHERE email = 'maria.santos@technologian.test'),
    'Online & Digital',
    'Research',
    'Enrollment Statistics',
    'Need the latest enrollment figures for the article.',
    'High',
    '2026-08-31',
    'In Progress',
    (SELECT id FROM articles WHERE title = 'Enrollment Numbers Hit Record High'),
    (SELECT id FROM users WHERE email = 'ella.navarro@technologian.test')
  );

INSERT INTO tasks (title, description, assignee_id, cluster, priority, status, deadline, article_id, request_id) VALUES
  (
    'Verify enrollment historical data',
    'Confirm the 5-year figures before handoff to Writing.',
    (SELECT id FROM users WHERE email = 'ella.navarro@technologian.test'),
    'Online & Digital',
    'High',
    'In Progress',
    '2026-08-31',
    (SELECT id FROM articles WHERE title = 'Enrollment Numbers Hit Record High'),
    (SELECT id FROM requests WHERE subject = 'Enrollment Statistics')
  );