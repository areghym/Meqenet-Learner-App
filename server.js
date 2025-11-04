/**
 * Meqenet Backend API Server (Node.js + Express)
 * This file sets up the core Express application and implements the necessary API endpoints
 * for Authentication and Core Data Management.
 *
 * NOTE: The PostgreSQL connection and all security tools (hashing, JWT) are MOCKED,
 * as this environment cannot execute live database operations or external libraries.
 * The endpoints for Lesson Progress and CPD Progress are designed to handle the
 * batched updates that would be sent from the frontend's LocalStorage/IndexedDB sync layer.
 */
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// --- Mock Data and Counters ---
const MOCK_SCHOOLS = [
    { school_id: 1, name: 'Addis Ababa Primary School', city: 'Addis Ababa', country: 'Ethiopia' },
    { school_id: 2, name: 'Oromia Regional Academy', city: 'Adama', country: 'Ethiopia' },
];

let nextUserId = 102; // Start after MOCK_USERS[0]
const MOCK_USERS = [
    // Pre-hashed password for 'password123'
    { user_id: 101, school_id: 1, first_name: 'Abebe', last_name: 'Kebede', email: 'abebe.k@school1.et', role: 'Teacher', password_hash: 'hashed_password123_password', languagePreference: 'Amharic' },
];

let nextLearnerId = 2001;
const MOCK_LEARNERS = [
    { learner_id: 2000, school_id: 1, first_name: 'Elias', last_name: 'T', date_of_birth: '2015-01-01', grade_level: 3, unique_identifier: 'ET3001' },
    { learner_id: 2001, school_id: 1, first_name: 'Abebe', last_name: 'K', date_of_birth: '2016-01-01', grade_level: 2, unique_identifier: 'AK2001' },
];

let nextProgressId = 3001;
const MOCK_PROGRESS = [
    // Example progress record: Learner 2000 completed Lesson 'A-Z'
    { progress_id: 3000, learner_id: 2000, lesson_id: 'A-Z', completion_status: 'completed', score: 10, last_updated: new Date().toISOString() },
];

let nextCPDProgressId = 4001;
const MOCK_CPD_PROGRESS = [
    // Example CPD progress record: User 101 completed Module 'T101'
    { cpd_progress_id: 4000, user_id: 101, cpd_module_id: 'T101', completion_status: 'in progress', score: 50, last_updated: new Date().toISOString() },
];

// --- Mock Authentication Tools (Simulating bcrypt and jsonwebtoken) ---
const SECRET_KEY = 'super-secret-meqenet-key';

const authMock = {
    // Simulates bcrypt.hash: hashes a password.
    hashPassword: (password) => `hashed_${password}_password`,
    
    // Simulates bcrypt.compare: checks if the hash matches the password.
    comparePassword: (password, hash) => hash === `hashed_${password}_password`,
    
    // Simulates jwt.sign: generates a token.
    generateToken: (payload) => `mock_jwt_token.${Buffer.from(JSON.stringify(payload)).toString('base64')}.${SECRET_KEY.slice(0, 5)}`,
    
    // Simulates jwt.verify: validates and decodes a token.
    verifyToken: (token) => {
        try {
            const parts = token.split('.');
            if (parts.length === 3 && parts[0] === 'mock_jwt_token') {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                return { user_id: payload.user_id, email: payload.email, role: payload.role, school_id: payload.school_id, languagePreference: payload.languagePreference };
            }
        } catch (e) {
            console.error('Mock JWT verification failed:', e);
        }
        return null;
    }
};

// --- Middleware Setup ---
app.use(bodyParser.json());
app.use(express.json());

/**
 * Authentication Middleware
 * Checks for a valid JWT in the Authorization header.
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'Authentication token required' });

    const user = authMock.verifyToken(token);
    if (!user) return res.status(403).json({ message: 'Invalid or expired token' });

    req.user = user;
    next();
};

/**
 * Mock Database Query Function
 * Simulates executing a query against the PostgreSQL schema.
 */
const db = {
    query: async (sql, params = []) => {
        console.log(`[MOCK DB] Executing SQL: ${sql} with params: ${params.join(', ')}`);
        
        // --- SCHOOLS ---
        if (sql.includes('SELECT * FROM schools')) {
            return { rows: MOCK_SCHOOLS };
        }

        // --- USERS ---
        if (sql.includes('SELECT * FROM users WHERE email')) {
            const email = params[0];
            const user = MOCK_USERS.find(u => u.email === email);
            return { rows: user ? [user] : [] };
        }
        if (sql.includes('INSERT INTO users')) {
            const [school_id, first_name, last_name, email, role, password_hash] = params;
            const newUser = {
                user_id: nextUserId++,
                school_id: school_id,
                first_name,
                last_name,
                email,
                role,
                password_hash,
                created_at: new Date().toISOString(),
            };
            MOCK_USERS.push(newUser);
            return { rows: [newUser] };
        }
        
        // --- LEARNERS ---
        if (sql.includes('SELECT l.* FROM learners')) {
            // In a real app, this would filter by the user's school_id (req.user.school_id)
            return { rows: MOCK_LEARNERS };
        }
        if (sql.includes('INSERT INTO learners')) {
             // Params for INSERT INTO learners (school_id, first_name, last_name, dob, grade, unique_identifier)
             const [school_id, first_name, last_name, date_of_birth, grade_level, unique_identifier] = params;
             const newLearner = {
                learner_id: nextLearnerId++,
                school_id,
                first_name,
                last_name,
                date_of_birth,
                grade_level,
                unique_identifier,
                created_at: new Date().toISOString(),
            };
            MOCK_LEARNERS.push(newLearner);
            return { rows: [newLearner] };
        }

        // --- LESSON PROGRESS ---
        if (sql.includes('SELECT * FROM lesson_progress WHERE learner_id')) {
            const learner_id = parseInt(params[0], 10);
            const progress = MOCK_PROGRESS.filter(p => p.learner_id === learner_id);
            return { rows: progress };
        }
        if (sql.includes('INSERT INTO lesson_progress') || sql.includes('UPDATE lesson_progress')) {
            // Mocking simple insert/upsert
            const [learner_id, lesson_id, completion_status, score] = params;
            const newProgress = {
                progress_id: nextProgressId++,
                learner_id: parseInt(learner_id, 10),
                lesson_id,
                completion_status,
                score: parseInt(score, 10),
                last_updated: new Date().toISOString(),
            };
            MOCK_PROGRESS.push(newProgress);
            return { rows: [newProgress] };
        }

        // --- CPD PROGRESS ---
        if (sql.includes('SELECT * FROM teacher_cpd_progress WHERE teacher_id')) {
            const user_id = parseInt(params[0], 10);
            const cpd = MOCK_CPD_PROGRESS.filter(c => c.user_id === user_id);
            return { rows: cpd };
        }
        if (sql.includes('INSERT INTO teacher_cpd_progress') || sql.includes('UPDATE teacher_cpd_progress')) {
            // Mocking simple insert/upsert
            const [teacher_id, cpd_module_id, completion_status, score] = params;
            const newCPDProgress = {
                cpd_progress_id: nextCPDProgressId++,
                user_id: parseInt(teacher_id, 10),
                cpd_module_id,
                completion_status,
                score: parseInt(score, 10),
                last_updated: new Date().toISOString(),
            };
            MOCK_CPD_PROGRESS.push(newCPDProgress);
            return { rows: [newCPDProgress] };
        }
        
        return { rows: [] };
    }
};

// --- API Endpoints: AUTHENTICATION ---
app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName, role, schoolId } = req.body;

    if (!email || !password || !firstName || !schoolId) {
        return res.status(400).json({ message: 'Missing required fields for registration.' });
    }

    try {
        // 1. Check if user already exists
        let result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            return res.status(409).json({ message: 'User with this email already exists.' });
        }

        // 2. Hash Password (Mock)
        const passwordHash = authMock.hashPassword(password);
        
        // 3. Insert User (Mock)
        const userParams = [
            schoolId, firstName, lastName, email, role || 'Teacher', passwordHash
        ];
        result = await db.query(
            'INSERT INTO users (school_id, first_name, last_name, email, role, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, email, role, school_id',
            userParams
        );

        const user = result.rows[0];
        
        // 4. Generate Token (Mock)
        const token = authMock.generateToken({ user_id: user.user_id, email: user.email, role: user.role, school_id: user.school_id });

        res.status(201).json({ 
            message: 'Registration successful. User created.', 
            user: { id: user.user_id, email: user.email, role: user.role }, 
            token 
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Failed to register user.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // 1. Find User by Email
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 2. Compare Password (Mock)
        const isMatch = authMock.comparePassword(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 3. Generate Token (Mock)
        const token = authMock.generateToken({ user_id: user.user_id, email: user.email, role: user.role, school_id: user.school_id, languagePreference: user.languagePreference });

        res.status(200).json({ 
            message: 'Login successful.', 
            user: { id: user.user_id, email: user.email, role: user.role, school_id: user.school_id, languagePreference: user.languagePreference }, 
            token 
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed.' });
    }
});

// --- API Endpoints: CORE DATA (Protected by authenticateToken) ---

/**
 * Endpoint 3: GET /api/schools
 * Lists all registered schools (Not protected, allowing new users to select their school during registration).
 */
app.get('/api/schools', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM schools');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching schools:', error);
        res.status(500).json({ message: 'Failed to fetch schools' });
    }
});


/**
 * Endpoint 4: GET /api/learners
 * Lists learners associated with the authenticated user's school.
 */
app.get('/api/learners', authenticateToken, async (req, res) => {
    // In a real query, we would use req.user.school_id
    try {
        const result = await db.query('SELECT l.* FROM learners l JOIN users u ON l.school_id = u.school_id WHERE u.user_id = $1', [req.user.user_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching learners:', error);
        res.status(500).json({ message: 'Failed to fetch learners' });
    }
});

/**
 * Endpoint 5: POST /api/learners
 * Registers a new learner under the authenticated user's school.
 */
app.post('/api/learners', authenticateToken, async (req, res) => {
    // Extract data from the request body and user token
    const { firstName, lastName, dateOfBirth, gradeLevel, uniqueIdentifier } = req.body;
    const schoolId = req.user.school_id; // Get schoolId from authenticated user

    if (!firstName || !gradeLevel || !schoolId) {
        return res.status(400).json({ message: 'Missing required learner fields.' });
    }

    try {
        const learnerParams = [
            schoolId, firstName, lastName, dateOfBirth, gradeLevel, uniqueIdentifier
        ];
        
        // Insert Learner (Mock)
        const result = await db.query(
            'INSERT INTO learners (school_id, first_name, last_name, date_of_birth, grade_level, unique_identifier) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            learnerParams
        );

        res.status(201).json({ 
            message: 'Learner added successfully.',
            learner: result.rows[0]
        });

    } catch (error) {
        console.error('Learner creation error:', error);
        res.status(500).json({ message: 'Failed to add learner.' });
    }
});

/**
 * Endpoint 6: GET /api/learners/:id/progress
 * Fetches lesson progress for a specific learner.
 */
app.get('/api/learners/:id/progress', authenticateToken, async (req, res) => {
    const learnerId = parseInt(req.params.id, 10);
    try {
        // Query progress for the requested learner
        const result = await db.query('SELECT * FROM lesson_progress WHERE learner_id = $1', [learnerId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching learner progress:', error);
        res.status(500).json({ message: 'Failed to fetch learner progress.' });
    }
});

/**
 * Endpoint 7: POST /api/learners/:id/progress
 * Updates/Syncs lesson progress for a specific learner (used in offline sync).
 */
app.post('/api/learners/:id/progress', authenticateToken, async (req, res) => {
    const learnerId = parseInt(req.params.id, 10);
    // Assuming the body contains the progress update data, which might be a batch of records in a real-world scenario.
    const { lessonId, completionStatus, score } = req.body; 

    if (!lessonId || !completionStatus) {
        return res.status(400).json({ message: 'Missing required progress fields.' });
    }

    try {
        // Mocking an UPSERT operation in the PostgreSQL database
        const progressParams = [learnerId, lessonId, completionStatus, score || 0];
        const result = await db.query(
            'INSERT INTO lesson_progress (learner_id, lesson_id, completion_status, score) VALUES ($1, $2, $3, $4) ON CONFLICT (learner_id, lesson_id) DO UPDATE SET completion_status = $3, score = $4 RETURNING *',
            progressParams
        );
        
        res.status(200).json({ 
            message: 'Learner progress updated/synced successfully.',
            progress: result.rows[0]
        });
    } catch (error) {
        console.error('Progress sync error:', error);
        res.status(500).json({ message: 'Failed to sync learner progress.' });
    }
});

/**
 * Endpoint 8: GET /api/teachers/:id/cpd-progress
 * Fetches CPD progress for a specific teacher.
 */
app.get('/api/teachers/:id/cpd-progress', authenticateToken, async (req, res) => {
    const teacherId = parseInt(req.params.id, 10);
    
    if (req.user.user_id !== teacherId && req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Unauthorized to view this progress.' });
    }

    try {
        const result = await db.query('SELECT * FROM teacher_cpd_progress WHERE teacher_id = $1', [teacherId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching CPD progress:', error);
        res.status(500).json({ message: 'Failed to fetch CPD progress.' });
    }
});

/**
 * Endpoint 9: POST /api/teachers/:id/cpd-progress
 * Updates/Syncs CPD progress for a specific teacher.
 */
app.post('/api/teachers/:id/cpd-progress', authenticateToken, async (req, res) => {
    const teacherId = parseInt(req.params.id, 10);
    const { cpdModuleId, completionStatus, score } = req.body;

    if (req.user.user_id !== teacherId) {
        return res.status(403).json({ message: 'Cannot update progress for another teacher.' });
    }
    if (!cpdModuleId || !completionStatus) {
        return res.status(400).json({ message: 'Missing required CPD progress fields.' });
    }

    try {
        // Mocking an UPSERT operation in the PostgreSQL database
        const progressParams = [teacherId, cpdModuleId, completionStatus, score || 0];
        const result = await db.query(
            'INSERT INTO teacher_cpd_progress (teacher_id, cpd_module_id, completion_status, score) VALUES ($1, $2, $3, $4) ON CONFLICT (teacher_id, cpd_module_id) DO UPDATE SET completion_status = $3, score = $4 RETURNING *',
            progressParams
        );
        
        res.status(200).json({ 
            message: 'CPD progress updated/synced successfully.',
            progress: result.rows[0]
        });
    } catch (error) {
        console.error('CPD progress sync error:', error);
        res.status(500).json({ message: 'Failed to sync CPD progress.' });
    }
});


/**
 * Endpoint 10: GET /api/status
 * Simple health check endpoint.
 */
app.get('/api/status', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        service: 'Meqenet Backend',
        environment: 'Mock PostgreSQL Ready'
    });
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Meqenet Backend Server running on port ${PORT}`);
    console.log('Core API Endpoints now active.');
});
