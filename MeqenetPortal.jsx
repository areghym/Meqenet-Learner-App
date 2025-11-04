import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Home, BookOpen, Layers, Zap, Download, Users, Bell, Settings, Languages, CheckCircle, Clock, Loader2, Feather, Plus, Edit, User, Trash2 } from 'lucide-react';

// --- Firebase Imports (for Data Persistence) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';

// --- Global Setup ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'meqenet-portal';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firestore Path Helpers
const getUserSettingsDocPath = (userId) => `/artifacts/${appId}/users/${userId}/portalData/settings`;
const getTrainingCollectionPath = () => `/artifacts/${appId}/public/data/trainingModules`;
const getPortalDataDocPath = (userId) => `/artifacts/${appId}/users/${userId}/portalData/data`; // Stores lesson plan and learners

// --- Multilingual Dictionary ---
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'am', name: 'Amharic' },
  { code: 'om', name: 'Fuula Duraa' },
  { code: 'ti', name: 'መበገሲ ገጽ' },
];

const T = {
    // Nav/Headers
    home: { en: 'Home', am: 'ዋና ገጽ', om: 'Fuula Duraa', ti: 'መበገሲ ገጽ' },
    training: { en: 'Training', am: 'ሥልጠና', om: 'Leenjii', ti: 'ስልጠና' },
    planner: { en: 'Lesson Planner', am: 'የክፍል እቅድ', om: 'Karoora Barnootaa', ti: 'መደብ ትምህርቲ' },
    learners: { en: 'Learners', am: 'ተማሪዎች', om: 'Barattoota', ti: 'ተምሃሮ' }, // New Key
    learnerManagement: { en: 'Learner Management', am: 'የተማሪ አስተዳደር', om: 'Bulchiinsa Barataa', ti: 'ምሕደራ ተምሃሮ' }, // New Key
    progress: { en: 'Progress Report', am: 'የውጤት ሪፖርት', om: 'Gabaasa Guddinaa', ti: 'ጸብጻብ ውጽኢት' },
    resources: { en: 'Resources', am: 'መገልገያዎች', om: 'Qabeenya', ti: 'መወከሲታት' },
    notifications: { en: 'Alerts', am: 'ማሳወቂያዎች', om: 'Beeksisa', ti: 'መጽናዕቲ' },
    settings: { en: 'Settings', am: 'ቅንብሮች', om: 'Qindaaʼina', ti: 'ኣቀማምጣታት' },
    
    // Core Content
    welcome: { en: 'Welcome to Meqenet Portal', am: 'ወደ መቅነት መግቢያ እንኳን ደህና መጡ', om: 'Gara Meqenetatti baga nagaan dhuftan', ti: 'እንቋዕ ናብ መቐነት መእተዊ ብደሓን መጻእኹም' },
    selectLang: { en: 'Select Language', am: 'ቋንቋ ይምረጡ', om: 'Afaan Filadhu', ti: 'ቋንቋ ሕረይ' },
    microTraining: { en: 'Micro-Training Modules', am: 'አጭር ሥልጠና ሞዱሎች', om: 'Mooduloota Leenjii Gaggabaaboo', ti: 'ዓጸድቲ ስልጠና ሞዱላት' },
    startLesson: { en: 'Start Lesson', am: 'ትምህርት ጀምር', om: 'Barnoota Jalqabi', ti: 'ትምህርቲ ጀምር' },
    completed: { en: 'Completed', am: 'ተጠናቀቀ', om: 'Xumurame', ti: 'ተወዲኡ' },
    lessonPlanTitle: { en: 'Current Lesson Plan', am: 'ወቅታዊ የክፍል እቅድ', om: 'Karoora Barnootaa Ammaa', ti: 'ዘለናዮ መደብ ትምህርቲ' },
    adaptActivity: { en: 'Adapt Activity Tool', am: 'እንቅስቃሴ ማስተካከያ መሳሪያ', om: 'Mala Hojii Qopheessaa', ti: 'መሳርሒ ምትዕርራይ ንጥፈታት' },
    adaptTip: { en: 'Use this tool to adapt existing activities for specific learning needs (e.g., larger fonts, simplified instructions, peer support).', am: 'ያለውን እንቅስቃሴ ለተለየ የመማር ፍላጎት (እንደ ትልቅ ፊደል፣ የቀለለ መመሪያ) ለማስተካከል ይጠቀሙ።', om: 'Hojii jiru barbaachisummaa barumsa addaatiif (fkn. qubee gurguddaa, ajaja salphaa) fooyessuuf gargaara.', ti: 'ንዝተፈላለየ ትምህርቲ ፍላጎትታት (ከም ዝዓበየ ፊደል፣ ቀሊል መምርሒ) ንጥፈታት ንምምጥን ተጠቐም።' },
    downloadable: { en: 'Downloadable Resources', am: 'ሊወርዱ የሚችሉ መገልገያዎች', om: 'Qabeenya Buufamuu Danda’u', ti: 'ብምውራድ ዝርከብ መወከሲ' },
    progressReport: { en: 'View Progress', am: 'ውጤት እይ', om: 'Guddina Ilaali', ti: 'ውጽኢት ርአ' },
    noAlerts: { en: 'No new alerts.', am: 'አዲስ ማሳወቂያ የለም።', om: 'Beeksisa haaraa hin jiru.', ti: 'ሓዱሽ መጽናዕቲ የልቦን።' },
    notificationSettings: { en: 'Notification Settings', am: 'የማሳወቂያ ቅንብሮች', om: 'Qindaaʼina Beeksisaa', ti: 'ኣቀማምጣ መጽናዕቲ' },
    smsEmail: { en: 'SMS / Email Notifications', am: 'የኤስኤምኤስ / ኢሜይል ማሳወቂያ', om: 'Beeksisa SMS / Email', ti: 'ኤስኤምኤስ / ኢሜይል መጽናዕቲ' },
    updatePlan: { en: 'Update Lesson Plan', am: 'የክፍል እቅድ አዘምን', om: 'Karoora Barnootaa Haaresu', ti: 'መደብ ትምህርቲ ኣሐድስ' },
    saveChanges: { en: 'Save Changes', am: 'ለውጦችን አስቀምጥ', om: 'Jijjiirama Quunnamuu', ti: 'ለውጢ ኣቐምጥ' },
    addLearner: { en: 'Add New Learner', am: 'አዲስ ተማሪ ጨምር', om: 'Barataa Haaraa Dabali', ti: 'ሓዱሽ ተምሃራይ ወስኽ' }, // New Key
    name: { en: 'Name', am: 'ስም', om: 'Maqaa', ti: 'ስም' }, // New Key
    grade: { en: 'Grade', am: 'ክፍል', om: 'Kutaa', ti: 'ክፍሊ' }, // New Key
    needs: { en: 'Needs', am: 'ፍላጎቶች', om: 'Barbaachisummaa', ti: 'ዘድልዩ ነገራት' }, // New Key
    
    // Roles
    teacher: { en: 'Teacher', am: 'አስተማሪ', om: 'Barsiisaa', ti: 'መምህር' },
    caregiver: { en: 'Caregiver', am: 'ተንከባካቢ', om: 'Kununsaa', ti: 'ተንከባኻቢ' },
};

// Mock Data
const MOCK_TRAINING = [
    { id: 1, title: 'Introduction to Universal Design for Learning (5 min)', status: 'completed' },
    { id: 2, title: 'Tips for Visual Impairment Adaptations (10 min)', status: 'pending' },
    { id: 3, title: 'Simple Sign Language for Classroom Management (15 min)', status: 'pending' },
    { id: 4, title: 'Effective Parent-Teacher Communication (8 min)', status: 'pending' },
];

const MOCK_RESOURCES = [
    { id: 1, title: 'Inclusive Classroom Checklist (PDF)', icon: 'pdf' },
    { id: 2, title: 'Amharic Sight Word Flashcards (Printable)', icon: 'print' },
    { id: 3, title: 'Numeracy Adaptation Guide (Guide)', icon: 'guide' },
];

const MOCK_LEARNERS = [
    { id: 'l1', name: 'Elias T.', grade: 'P3', needs: 'Visual Supports, Extra time', lastScore: 85 },
    { id: 'l2', name: 'Abebe K.', grade: 'P2', needs: 'Hearing Impairment, Sign Language', lastScore: 92 },
    { id: 'l3', name: 'Tsehay M.', grade: 'P1', needs: 'Cognitive Support, Simplified tasks', lastScore: 78 },
];

// Initial state for the Lesson Plan section
const initialLessonPlan = {
    topic: 'Basic Addition using fingers',
    materials: 'Counting rods, large print worksheets',
    adaptationNotes: 'Provide tactile materials for learners with visual impairment.',
};

// --- Core App Component ---
const App = () => {
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState('home');
    const [isLoading, setIsLoading] = useState(true);

    // State Management for Features
    const [language, setLanguage] = useState('en');
    const [role, setRole] = useState('teacher'); // Teacher or Caregiver
    const [trainingModules, setTrainingModules] = useState(MOCK_TRAINING);
    const [lessonPlan, setLessonPlan] = useState(initialLessonPlan);
    const [learners, setLearners] = useState(MOCK_LEARNERS); // Updated to store array of learners
    const [selectedLearnerId, setSelectedLearnerId] = useState(MOCK_LEARNERS[0]?.id || null);

    // Toast Notification State
    const [showToast, setShowToast] = useState(null); // { message: string, type: 'success' | 'error' }

    // --- Localization Hook ---
    const t = useCallback((key) => {
        return T[key]?.[language] || T[key]?.['en'] || key;
    }, [language]);
    
    // --- Toast Handlers (replaced alerts) ---
    const showSuccessToast = (message) => setShowToast({ message, type: 'success' });
    const showErrorToast = (message) => setShowToast({ message, type: 'error' });


    // --- Firebase/Auth/Data Initialization ---
    useEffect(() => {
        if (!firebaseConfig) {
            console.warn("Firebase config not found. Running in offline mode.");
            setIsLoading(false);
            setIsAuthReady(true);
            return;
        }

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestore);

        // Authentication and User ID setup
        const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
            if (!user) {
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }
            }
            const currentUid = firebaseAuth.currentUser?.uid || crypto.randomUUID();
            setUserId(currentUid);
            setIsAuthReady(true);
            setIsLoading(false); // Auth is ready, move to data loading
        });

        return () => unsubscribeAuth();
    }, []);

    // Fetch and Sync User Data
    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;

        // 1. Fetch/Sync Settings
        const settingsRef = doc(db, getUserSettingsDocPath(userId));
        const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const settings = docSnap.data();
                setLanguage(settings.language || 'en');
                setRole(settings.role || 'teacher');
            } else {
                // If no settings, save default ones
                setDoc(settingsRef, { language: 'en', role: 'teacher' }, { merge: true }).catch(console.error);
            }
        }, (error) => console.error("Error syncing settings:", error));

        // 2. Fetch/Sync Portal Data (Lesson Plan, Learners, etc.)
        const portalDataRef = doc(db, getPortalDataDocPath(userId));
        const unsubscribePortalData = onSnapshot(portalDataRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Ensure data from Firestore updates state
                setLessonPlan(data.lessonPlan || initialLessonPlan);
                setLearners(data.learners || MOCK_LEARNERS);
                setSelectedLearnerId(data.selectedLearnerId || MOCK_LEARNERS[0]?.id || null);

            } else {
                // Save mock data if not exists
                setDoc(portalDataRef, { lessonPlan: initialLessonPlan, learners: MOCK_LEARNERS, selectedLearnerId: MOCK_LEARNERS[0]?.id || null }, { merge: true }).catch(console.error);
            }
        }, (error) => console.error("Error syncing portal data:", error));

        // 3. Sync Public Training Modules (optional, using mock for simplicity)
        // In a real app, this would query getTrainingCollectionPath()

        return () => {
            unsubscribeSettings();
            unsubscribePortalData();
        };
    }, [isAuthReady, db, userId]);

    // Save Settings Handler
    const saveSettings = useCallback(async (newLang, newRole) => {
        setLanguage(newLang);
        setRole(newRole);

        if (db && userId) {
            try {
                const settingsRef = doc(db, getUserSettingsDocPath(userId));
                await setDoc(settingsRef, { language: newLang, role: newRole }, { merge: true });
                showSuccessToast(t('settings') + ' updated successfully.');
            } catch (e) {
                console.error("Error saving settings:", e);
                showErrorToast('Failed to save settings.');
            }
        } else {
            showSuccessToast(t('settings') + ' updated locally (Offline Mode).');
        }
    }, [db, userId, t]);

    // Save Lesson Plan Handler
    const handleSaveLessonPlan = useCallback(async (newPlan) => {
        setLessonPlan(newPlan);
        if (db && userId) {
            try {
                const portalDataRef = doc(db, getPortalDataDocPath(userId));
                await setDoc(portalDataRef, { lessonPlan: newPlan }, { merge: true });
                showSuccessToast(t('saveChanges') + '!');
            } catch (e) {
                console.error("Error saving lesson plan:", e);
                showErrorToast('Error saving lesson plan.');
            }
        } else {
             // Offline save simulation
             showSuccessToast(t('saveChanges') + ' (Local Save)');
        }
    }, [db, userId, t]);
    
    // Save Learners Handler
    const handleSaveLearners = useCallback(async (newLearners, newSelectedId) => {
        setLearners(newLearners);
        setSelectedLearnerId(newSelectedId);

        if (db && userId) {
            try {
                const portalDataRef = doc(db, getPortalDataDocPath(userId));
                await setDoc(portalDataRef, { learners: newLearners, selectedLearnerId: newSelectedId }, { merge: true });
                showSuccessToast(t('saveChanges') + '!');
            } catch (e) {
                console.error("Error saving learners:", e);
                showErrorToast('Error saving learners.');
            }
        } else {
             showSuccessToast(t('saveChanges') + ' (Local Save)');
        }
    }, [db, userId, t]);

    // Derived State
    const selectedLearner = useMemo(() => learners.find(l => l.id === selectedLearnerId), [learners, selectedLearnerId]);

    // --- UI Components ---

    const Layout = ({ children }) => (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full">
            {children}
        </div>
    );

    const Card = ({ title, children, icon: Icon, className = "" }) => (
        <div className={`bg-white rounded-xl shadow-lg p-6 border-t-4 border-indigo-600 ${className}`}>
            <div className="flex items-center mb-4">
                {Icon && <Icon className="w-6 h-6 mr-3 text-indigo-600" />}
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            </div>
            {children}
        </div>
    );

    const ActionButton = ({ label, onClick, icon: Icon, primary = false, className = "" }) => (
        <button
            onClick={onClick}
            className={`w-full text-center py-3 px-4 rounded-lg font-semibold transition-colors duration-200 shadow-md flex items-center justify-center
                ${primary ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'} ${className}`}
        >
            <Icon className="w-5 h-5 mr-2" />
            {label}
        </button>
    );
    
    // Toast Component for non-blocking feedback
    const Toast = ({ message, type }) => {
        useEffect(() => {
            if (message) {
                const timer = setTimeout(() => {
                    setShowToast(null);
                }, 3000);
                return () => clearTimeout(timer);
            }
        }, [message]);
    
        if (!message) return null;
    
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const Icon = type === 'success' ? CheckCircle : Bell;
    
        return (
            <div className="fixed bottom-24 right-4 p-4 rounded-lg shadow-xl text-white font-semibold transition-opacity duration-300 z-50 flex items-center" style={{ backgroundColor: bgColor }}>
                <Icon className="w-5 h-5 mr-3" />
                {message}
            </div>
        );
    };


    // --- Screens ---

    const HomeScreen = () => (
        <Layout>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-gray-800 text-center">
                {t('welcome')}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title={t('training')} icon={BookOpen}>
                    <p className="text-gray-600 mb-4">{trainingModules.filter(m => m.status === 'pending').length} {t('training')} {t('modules')} {t('pending')}.</p>
                    <ActionButton label={t('training')} icon={BookOpen} primary onClick={() => setCurrentPage('training')} />
                </Card>

                <Card title={t('learners')} icon={Users}>
                    <p className="text-gray-600 mb-4">{learners.length} {t('learners')} {t('currently')} {t('managed')}.</p>
                    <ActionButton label={t('learnerManagement')} icon={Users} primary onClick={() => setCurrentPage('learners')} />
                </Card>

                <Card title={t('planner')} icon={Layers}>
                    <p className="text-gray-600 mb-4">Topic: <span className="font-semibold">{lessonPlan.topic}</span></p>
                    <ActionButton label={t('updatePlan')} icon={Edit} primary onClick={() => setCurrentPage('planner')} />
                </Card>

                <Card title={t('notifications')} icon={Bell}>
                    <p className="text-gray-600 mb-4">{t('noAlerts')}</p>
                    <ActionButton label={t('notifications')} icon={Bell} onClick={() => setCurrentPage('notifications')} />
                </Card>
            </div>
        </Layout>
    );

    const TrainingScreen = () => (
        <Layout>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                <BookOpen className="inline mr-3 w-7 h-7 text-indigo-600" /> {t('microTraining')}
            </h2>
            <div className="space-y-4">
                {trainingModules.map(module => (
                    <div key={module.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex-1">
                            <h4 className="font-semibold text-lg">{module.title}</h4>
                        </div>
                        {module.status === 'completed' ? (
                            <div className="flex items-center text-green-600 font-bold">
                                <CheckCircle className="w-5 h-5 mr-1" /> {t('completed')}
                            </div>
                        ) : (
                            <ActionButton 
                                label={t('startLesson')} 
                                icon={Clock} 
                                onClick={() => showSuccessToast(`Starting lesson: ${module.title}`)} 
                                className="w-auto px-4 py-2"
                            />
                        )}
                    </div>
                ))}
            </div>
        </Layout>
    );

    const LessonPlannerScreen = () => {
        // Use a local state for editing, initialized from global state
        const [plan, setPlan] = useState(lessonPlan);

        // Keep local state in sync if global state changes externally
        useEffect(() => {
            setPlan(lessonPlan);
        }, [lessonPlan]);


        const handleInputChange = (e) => {
            const { name, value } = e.target;
            setPlan(prev => ({ ...prev, [name]: value }));
        };

        return (
            <Layout>
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                    <Layers className="inline mr-3 w-7 h-7 text-indigo-600" /> {t('planner')}
                </h2>

                <Card title={t('lessonPlanTitle')} icon={Feather} className="mb-8">
                    <form className="space-y-4">
                        <label className="block">
                            <span className="text-gray-700 font-medium">Topic:</span>
                            <input
                                type="text"
                                name="topic"
                                value={plan.topic}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            />
                        </label>
                        <label className="block">
                            <span className="text-gray-700 font-medium">Materials:</span>
                            <textarea
                                name="materials"
                                value={plan.materials}
                                onChange={handleInputChange}
                                rows="3"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            ></textarea>
                        </label>
                    </form>
                </Card>

                <Card title={t('adaptActivity')} icon={Zap} className="mb-8 bg-yellow-50 border-yellow-400">
                    <p className="text-sm text-yellow-800 mb-4">{t('adaptTip')}</p>
                    <label className="block">
                        <span className="text-gray-700 font-medium">Adaptation Notes (Specific Learner Needs):</span>
                        <textarea
                            name="adaptationNotes"
                            value={plan.adaptationNotes}
                            onChange={handleInputChange}
                            rows="4"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        ></textarea>
                    </label>
                </Card>

                <ActionButton
                    label={t('saveChanges')}
                    icon={CheckCircle}
                    primary
                    onClick={() => handleSaveLessonPlan(plan)}
                />

                <ResourceSection />
            </Layout>
        );
    };

    const ResourceSection = () => (
        <Card title={t('downloadable')} icon={Download} className="mt-8">
            <p className="text-sm text-gray-600 mb-4">Download and print materials to support your inclusive classroom.</p>
            <div className="space-y-3">
                {MOCK_RESOURCES.map(res => (
                    <div key={res.id} className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                        <span className="font-medium">{res.title}</span>
                        <button 
                            onClick={() => showSuccessToast(`Simulating download for: ${res.title}`)} 
                            className="text-indigo-600 font-semibold hover:text-indigo-800"
                        >
                            {res.icon === 'pdf' ? 'Download PDF' : 'Print'}
                        </button>
                    </div>
                ))}
            </div>
        </Card>
    );

    const LearnerManagementScreen = () => {
        // Local state for the Add/Edit form, for a quick mock implementation
        const [isModalOpen, setIsModalOpen] = useState(false);
        const [editingLearner, setEditingLearner] = useState(null); // null for adding, object for editing

        const initialFormState = { name: '', grade: 'P1', needs: '' };
        const [formData, setFormData] = useState(initialFormState);

        const handleAddClick = () => {
            setEditingLearner(null);
            setFormData(initialFormState);
            setIsModalOpen(true);
        };

        const handleEditClick = (learner) => {
            setEditingLearner(learner);
            setFormData({ name: learner.name, grade: learner.grade, needs: learner.needs });
            setIsModalOpen(true);
        };

        const handleFormChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handleFormSubmit = () => {
            if (!formData.name) return showErrorToast('Learner name is required.');
            
            let newLearners;
            let newSelectedId = selectedLearnerId;

            if (editingLearner) {
                // Edit existing learner
                newLearners = learners.map(l => 
                    l.id === editingLearner.id ? { ...editingLearner, ...formData } : l
                );
                showSuccessToast(`${formData.name} updated successfully.`);
            } else {
                // Add new learner
                const newId = 'l' + (learners.length + 1);
                const newLearner = { id: newId, ...formData, lastScore: 0 };
                newLearners = [...learners, newLearner];
                newSelectedId = newId; // Auto-select the newly added learner
                showSuccessToast(`${formData.name} added successfully.`);
            }

            handleSaveLearners(newLearners, newSelectedId);
            setIsModalOpen(false);
        };

        const handleDelete = (id, name) => {
            // Confirmation via Toast/Modal is needed in a real app, but for this context:
            const newLearners = learners.filter(l => l.id !== id);
            const newSelectedId = newLearners[0]?.id || null;
            handleSaveLearners(newLearners, newSelectedId);
            showSuccessToast(`${name} has been removed.`);
        };


        const LearnerFormModal = () => (
            <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 ${isModalOpen ? '' : 'hidden'}`}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">{editingLearner ? t('editLearner') : t('addLearner')}</h3>
                    
                    <form className="space-y-4">
                        <label className="block">
                            <span className="text-gray-700 font-medium">{t('name')}:</span>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                placeholder="Elias T."
                                required
                            />
                        </label>
                        <label className="block">
                            <span className="text-gray-700 font-medium">{t('grade')}:</span>
                            <select
                                name="grade"
                                value={formData.grade}
                                onChange={handleFormChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            >
                                {['P1', 'P2', 'P3', 'P4', 'P5'].map(g => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-gray-700 font-medium">Specific {t('needs')}:</span>
                            <textarea
                                name="needs"
                                value={formData.needs}
                                onChange={handleFormChange}
                                rows="2"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                                placeholder="e.g., Visual Supports, Extra time"
                            ></textarea>
                        </label>
                    </form>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button 
                            onClick={() => setIsModalOpen(false)} 
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleFormSubmit} 
                            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 font-semibold"
                        >
                            {editingLearner ? t('saveChanges') : t('addLearner')}
                        </button>
                    </div>
                </div>
            </div>
        );

        return (
            <Layout>
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                    <Users className="inline mr-3 w-7 h-7 text-indigo-600" /> {t('learnerManagement')}
                </h2>

                <div className="mb-6">
                    <ActionButton 
                        label={t('addLearner')}
                        icon={Plus}
                        primary
                        onClick={handleAddClick}
                    />
                </div>

                <Card title={t('learners')} icon={User}>
                    <div className="space-y-3">
                        {learners.length === 0 ? (
                            <p className="text-gray-500">No learners added yet. Use the button above to start.</p>
                        ) : (
                            learners.map(learner => (
                                <div key={learner.id} className={`flex justify-between items-center p-4 rounded-xl shadow-sm border ${selectedLearnerId === learner.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-lg">{learner.name} ({learner.grade})</h4>
                                        <p className="text-sm text-gray-600 truncate">{t('needs')}: {learner.needs}</p>
                                        <p className="text-xs text-indigo-600 font-medium mt-1">Last Score: {learner.lastScore}%</p>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button 
                                            onClick={() => {setSelectedLearnerId(learner.id); setCurrentPage('progress')}}
                                            className="p-2 text-sm text-white bg-green-500 rounded-full hover:bg-green-600 shadow-md transition-colors"
                                            title={t('progressReport')}
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleEditClick(learner)}
                                            className="p-2 text-white bg-indigo-500 rounded-full hover:bg-indigo-600 shadow-md transition-colors"
                                            title={t('editLearner')}
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(learner.id, learner.name)}
                                            className="p-2 text-white bg-red-500 rounded-full hover:bg-red-600 shadow-md transition-colors"
                                            title="Delete Learner"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <LearnerFormModal />
            </Layout>
        );
    };


    const ProgressTrackerScreen = () => {
        if (!selectedLearner) {
            return (
                <Layout>
                    <Card title={t('progress')} icon={Users}>
                        <p className="text-gray-600">Please select a learner from the **{t('learners')}** tab to view their progress report.</p>
                        <ActionButton 
                            label={`Go to ${t('learners')}`} 
                            icon={Users} 
                            primary 
                            onClick={() => setCurrentPage('learners')}
                            className="mt-4"
                        />
                    </Card>
                </Layout>
            );
        }

        return (
            <Layout>
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                    <Users className="inline mr-3 w-7 h-7 text-indigo-600" /> {t('progressReport')}
                </h2>

                <Card title={`Learner: ${selectedLearner.name}`} icon={User} className="mb-8">
                    <div className="space-y-3 text-lg">
                        <p><strong>{t('grade')}:</strong> {selectedLearner.grade}</p>
                        <p><strong>Last Score:</strong> <span className="text-2xl font-bold text-indigo-600">{selectedLearner.lastScore}%</span></p>
                        <p><strong>Specific {t('needs')}:</strong> <span className="font-semibold text-red-500">{selectedLearner.needs}</span></p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <ActionButton 
                            label={`Change ${t('learner')}`} 
                            icon={Users} 
                            onClick={() => setCurrentPage('learners')}
                            className="mt-4 w-1/2 mx-auto"
                        />
                    </div>
                </Card>

                <Card title="Assessment History" icon={Clock}>
                    <p className="text-sm text-gray-600 mb-4">Detailed records of all formal and informal assessments.</p>
                    <div className="h-40 bg-gray-100 p-4 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Visualization of progress over time (Graph Placeholder)</p>
                    </div>
                </Card>
            </Layout>
        );
    };

    const NotificationsScreen = () => (
        <Layout>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                <Bell className="inline mr-3 w-7 h-7 text-indigo-600" /> {t('notifications')}
            </h2>

            <Card title={t('notificationSettings')} icon={Settings} className="mb-8">
                <p className="text-sm text-gray-600 mb-4">{t('smsEmail')}</p>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                    <span className="font-medium">Daily Progress Summary</span>
                    <input type="checkbox" defaultChecked className="form-checkbox h-5 w-5 text-indigo-600 rounded" />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg mt-3">
                    <span className="font-medium">New Lesson Plan Alert</span>
                    <input type="checkbox" className="form-checkbox h-5 w-5 text-indigo-600 rounded" />
                </div>
            </Card>

            <Card title="Recent Alerts" icon={Bell}>
                <p className="text-gray-500">{t('noAlerts')}</p>
            </Card>
        </Layout>
    );


    const SettingsScreen = () => (
        <Layout>
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
                <Settings className="inline mr-3 w-7 h-7 text-indigo-600" /> {t('settings')}
            </h2>

            <Card title={t('selectLang')} icon={Languages} className="mb-8">
                <div className="grid grid-cols-2 gap-4">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => saveSettings(lang.code, role)}
                            className={`p-3 rounded-lg font-bold transition-all border-2
                                ${lang.code === language ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
                        >
                            {lang.name}
                        </button>
                    ))}
                </div>
            </Card>

            <Card title="Your Role" icon={Users}>
                <p className="text-sm text-gray-600 mb-3">Select your role to tailor the interface.</p>
                <div className="grid grid-cols-2 gap-4">
                    {['teacher', 'caregiver'].map(r => (
                        <button
                            key={r}
                            onClick={() => saveSettings(language, r)}
                            className={`p-3 rounded-lg font-bold transition-all border-2
                                ${r === role ? 'bg-green-600 text-white border-green-700' : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'}`}
                        >
                            {t(r)}
                        </button>
                    ))}
                </div>
                <p className="mt-4 text-xs text-gray-400">User ID: {userId}</p>
            </Card>
        </Layout>
    );


    // --- Main Render ---

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="mt-4 text-lg text-gray-600">Loading Portal...</p>
                </div>
            );
        }
        switch (currentPage) {
            case 'home': return <HomeScreen />;
            case 'training': return <TrainingScreen />;
            case 'planner': return <LessonPlannerScreen />;
            case 'learners': return <LearnerManagementScreen />; // New Route
            case 'progress': return <ProgressTrackerScreen />; // Progress page, reachable from Learners list
            case 'notifications': return <NotificationsScreen />;
            case 'settings': return <SettingsScreen />;
            default: return <HomeScreen />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-['Inter'] flex flex-col">
            <script src="https://cdn.tailwindcss.com"></script>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />

            {/* Header (Top Nav) */}
            <header className="bg-indigo-600 text-white p-4 shadow-xl sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold">Meqenet Portal</h1>
                    <button onClick={() => setCurrentPage('settings')} className="p-2 rounded-full hover:bg-indigo-700">
                        <Settings className="w-6 h-6" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow pb-24">
                {renderContent()}
            </main>

            {/* Toast Notification */}
            <Toast message={showToast?.message} type={showToast?.type} />

            {/* Fixed Bottom Navigation (Mobile/Accessibility Focus) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-indigo-600 shadow-2xl z-20">
                <div className="flex justify-around max-w-lg mx-auto py-2">
                    <NavButton icon={Home} label={t('home')} page="home" currentPage={currentPage} setCurrentPage={setCurrentPage} />
                    <NavButton icon={BookOpen} label={t('training')} page="training" currentPage={currentPage} setCurrentPage={setCurrentPage} />
                    <NavButton icon={Layers} label={t('planner')} page="planner" currentPage={currentPage} setCurrentPage={setCurrentPage} />
                    <NavButton icon={Users} label={t('learners')} page="learners" currentPage={currentPage} setCurrentPage={setCurrentPage} /> {/* Updated */}
                    <NavButton icon={Bell} label={t('notifications')} page="notifications" currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </div>
            </div>
        </div>
    );
};

const NavButton = ({ icon: Icon, label, page, currentPage, setCurrentPage }) => {
    const isActive = currentPage === page;
    return (
        <button
            onClick={() => setCurrentPage(page)}
            className={`flex flex-col items-center p-1 rounded-lg transition-colors duration-200 w-1/5 text-sm
                ${isActive ? 'text-indigo-600 bg-indigo-100 font-bold' : 'text-gray-500 hover:text-indigo-600'}`}
        >
            <Icon className="w-6 h-6" />
            <span className="text-xs mt-1 truncate">{label}</span>
        </button>
    );
};


export default App;
