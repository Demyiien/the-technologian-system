-- The Technologian Student Press — MVP database schema
-- Safe to run on a fresh technologian_db database.
-- Workflow this schema supports: Article -> Request -> Task -> Completion

-- 1. USERS
-- Everyone who can be assigned work: writers, editors, cluster members.
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  cluster VARCHAR(20) NOT NULL CHECK (cluster IN ('Writing', 'Creatives', 'Online & Digital')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. ARTICLES
-- A story moving through the newsroom, from draft to published.
CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'In Progress', 'For Review', 'Ready', 'Published')),
  author_id INTEGER REFERENCES users(id),
  deadline DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. REQUESTS
-- Cross-cluster asks, e.g. Writing asking Online & Digital for research.
-- article_id is nullable: a request doesn't always need to be tied to an article.
CREATE TABLE IF NOT EXISTS requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER REFERENCES users(id),
  target_cluster VARCHAR(20) NOT NULL CHECK (target_cluster IN ('Writing', 'Creatives', 'Online & Digital')),
  request_type VARCHAR(30) NOT NULL CHECK (request_type IN (
    'Research', 'Fact-check', 'Photography', 'Graphic Design', 'Illustration',
    'Video', 'Social Media', 'Website', 'Technical Support', 'Publication Assistance', 'Other'
  )),
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  priority VARCHAR(10) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  deadline DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Accepted', 'In Progress', 'Submitted', 'Completed', 'Closed')),
  article_id INTEGER REFERENCES articles(id),
  assigned_to INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. TASKS
-- The actual unit of work. May trace back to a request and/or an article.
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assignee_id INTEGER REFERENCES users(id),
  cluster VARCHAR(20) NOT NULL CHECK (cluster IN ('Writing', 'Creatives', 'Online & Digital')),
  priority VARCHAR(10) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started'
    CHECK (status IN ('Not Started', 'In Progress', 'Review', 'Completed')),
  deadline DATE,
  article_id INTEGER REFERENCES articles(id),
  request_id INTEGER REFERENCES requests(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes on foreign keys and fields we'll filter/sort by often.
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

CREATE INDEX IF NOT EXISTS idx_requests_requester_id ON requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_article_id ON requests(article_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_target_cluster ON requests(target_cluster);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_article_id ON tasks(article_id);
CREATE INDEX IF NOT EXISTS idx_tasks_request_id ON tasks(request_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);