--
-- Meqenet Core Database Schema (PostgreSQL)
-- Defines the foundational tables for organizational and user data.
--

-- Table 1: Schools
-- Represents the organizational unit (e.g., a single school or institution).
CREATE TABLE schools (
    school_id           SERIAL PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    city                VARCHAR(100),
    country             VARCHAR(100),
    created_at          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Users
-- Represents the staff, teachers, or administrators who use the platform.
-- Links to the school they belong to.
CREATE TABLE users (
    user_id             SERIAL PRIMARY KEY,
    school_id           INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    role                VARCHAR(50) NOT NULL, -- e.g., 'Teacher', 'Admin', 'Staff'
    password_hash       TEXT, -- Storage for securely hashed passwords
    created_at          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: Learners
-- Represents the students/learners being managed by the school and users.
CREATE TABLE learners (
    learner_id          SERIAL PRIMARY KEY,
    school_id           INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    date_of_birth       DATE,
    grade_level         INTEGER,
    unique_identifier   VARCHAR(50) UNIQUE, -- Internal student ID number
    created_at          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: Lesson_Plans
-- Stores the curriculum content created by users, currently being managed in the frontend.
-- Uses JSONB to store the flexible, detailed structure of the lesson plan content.
CREATE TABLE lesson_plans (
    plan_id             SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    school_id           INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
    title               VARCHAR(255) NOT NULL,
    subject             VARCHAR(100),
    target_grade        INTEGER,
    -- JSONB is optimized for storing, indexing, and querying unstructured JSON data
    content_json        JSONB NOT NULL,
    updated_at          TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for common foreign key lookups to improve query performance
CREATE INDEX idx_users_school_id ON users (school_id);
CREATE INDEX idx_learners_school_id ON learners (school_id);
CREATE INDEX idx_plans_user_id ON lesson_plans (user_id);
CREATE INDEX idx_plans_school_id ON lesson_plans (school_id);
