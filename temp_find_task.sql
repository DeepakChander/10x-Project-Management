-- Find Epic 2 task
SELECT id, title, assignee, status, project_id 
FROM archon_tasks 
WHERE title ILIKE '%Epic 2%' OR title ILIKE '%Content Creation%'
LIMIT 5;
