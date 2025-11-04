import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, TrendingUp, Users, Settings, BarChart3, Clipboard, UploadCloud, ChevronRight, CheckCircle, XCircle, Clock, Globe, Plus } from 'lucide-react';

// --- Firebase Imports (for context, though data here is mocked) ---
// NOTE: In a real system, the Core Service data would sync here.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Global Setup (Required Boilerplate) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'meqenet-ivr-admin';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Mock Data based on ivr_sms_design.md ---
const MOCK_SMS_TIPS = [
    { id: 1, content: 'Tip: Use large-print materials for visual learners.', lang: 'Amharic', status: 'Active', type: 'Daily Tip' },
    { id: 2, content: 'What is the best way to present instructions?', lang: 'English', status: 'Active', type: 'Mini-Quiz', answer: 'C (Both)' },
    { id: 3, content: 'How long should a micro-lesson be? Reply A (5-15 min) or B (30 min+).', lang: 'Oromoo', status: 'Draft', type: 'Mini-Quiz', answer: 'A' },
];

const MOCK_IVR_MODULES = [
    { id: 101, title: 'UDL Basics', duration: 10, assessment: '2 Qs', status: 'Live' },
    { id: 102, title: 'Adaptations for Visual Impairment', duration: 15, assessment: '2 Qs', status: 'Live' },
    { id: 103, title: 'Classroom Sign Language Basics', duration: 12, assessment: '3 Qs', status: 'Draft' },
];

const MOCK_ENGAGEMENT_METRICS = {
    totalUsers: 4520,
    smsResponseRate: 68, // %
    ivrCompletionRate: 82, // %
    avgCallDuration: '7:45 min',
    languageBreakdown: {
        Amharic: 55,
        Oromoo: 25,
        Tigrinya: 15,
        English: 5,
    },
};

// --- Utility Components ---

const Card = ({ title, value, icon: Icon, color = 'indigo' }) => (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center">
            <Icon className={`w-8 h-8 text-${color}-500 p-1.5 bg-${color}-100 rounded-full mr-4`} />
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    </div>
);

const SectionTitle = ({ title, icon: Icon }) => (
    <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2 border-gray-200">
        <Icon className="w-6 h-6 mr-3 text-indigo-600" />
        {title}
    </h2>
);

// --- Content Management Screens ---

const SmsContentManager = () => {
    const [smsList, setSmsList] = useState(MOCK_SMS_TIPS);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <SectionTitle title="SMS Tips & Mini-Quizzes" icon={MessageSquare} />
            <p className="text-sm text-gray-600 mb-6">Manage the daily push content delivered via the SMS Aggregator Gateway.</p>

            <button className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold mb-6 hover:bg-green-700 transition-colors shadow-md">
                <Plus className="w-5 h-5 mr-2" /> New SMS Content
            </button>

            <div className="space-y-3">
                {smsList.map((sms) => (
                    <div key={sms.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-lg text-gray-800">{sms.type}</span>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${sms.status === 'Active' ? 'bg-indigo-100 text-indigo-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {sms.status}
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-2 italic">"{sms.content}"</p>
                        <div className="flex text-xs text-gray-500 space-x-4">
                            <span><Globe className="w-3 h-3 inline mr-1" /> Lang: {sms.lang}</span>
                            {sms.type === 'Mini-Quiz' && (
                                <span><CheckCircle className="w-3 h-3 inline mr-1" /> Answer: {sms.answer}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const IvrContentManager = () => {
    const [moduleList, setModuleList] = useState(MOCK_IVR_MODULES);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <SectionTitle title="IVR Audio Modules" icon={Phone} />
            <p className="text-sm text-gray-600 mb-6">Manage pre-recorded audio files for the IVR Engine and define assessment questions.</p>

            <button className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg font-semibold mb-6 hover:bg-green-700 transition-colors shadow-md">
                <UploadCloud className="w-5 h-5 mr-2" /> Upload New Audio
            </button>

            <div className="space-y-3">
                {moduleList.map((module) => (
                    <div key={module.id} className="p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-lg text-gray-800">{module.title}</span>
                            <span className="text-sm text-gray-500">{module.duration} min</span>
                        </div>
                        <div className="flex text-xs text-gray-500 space-x-4">
                            <span><Clipboard className="w-3 h-3 inline mr-1" /> Assessment: {module.assessment}</span>
                            <span className={`font-semibold ${module.status === 'Live' ? 'text-green-600' : 'text-yellow-600'}`}>
                                Status: {module.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Tracking & Metrics Screen ---
const TrackingDashboard = () => {
    const metrics = MOCK_ENGAGEMENT_METRICS;
    const totalPercentage = Object.values(metrics.languageBreakdown).reduce((sum, p) => sum + p, 0);

    // Function to assign a color based on performance
    const getColor = (value) => {
        if (value >= 80) return 'green';
        if (value >= 60) return 'yellow';
        return 'red';
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card 
                    title="Total Registered Users" 
                    value={metrics.totalUsers.toLocaleString()} 
                    icon={Users} 
                    color="indigo" 
                />
                <Card 
                    title="SMS Response Rate" 
                    value={`${metrics.smsResponseRate}%`} 
                    icon={MessageSquare} 
                    color={getColor(metrics.smsResponseRate)} 
                />
                <Card 
                    title="IVR Completion Rate" 
                    value={`${metrics.ivrCompletionRate}%`} 
                    icon={Phone} 
                    color={getColor(metrics.ivrCompletionRate)} 
                />
                <Card 
                    title="Avg. Call Duration" 
                    value={metrics.avgCallDuration} 
                    icon={Clock} 
                    color="cyan" 
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <SectionTitle title="Engagement & Proficiency Tracking" icon={TrendingUp} />
                    <p className="text-sm text-gray-600 mb-6">Real-time assessment scores and tracking from the IVR/SMS interactions.</p>
                    
                    {/* Mock Table showing recent assessment performance */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone No.</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">+251-912-***01</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">SMS Quiz</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">Visual Aids</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 font-bold">100%</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm"><CheckCircle className="w-4 h-4 text-green-500" /></td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">+251-933-***45</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">IVR Module</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">UDL Basics</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-yellow-600 font-bold">50%</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm"><XCircle className="w-4 h-4 text-red-500" /></td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">+251-925-***88</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">SMS Quiz</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">Peer Support</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 font-bold">75%</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm"><CheckCircle className="w-4 h-4 text-green-500" /></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Language Breakdown Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <SectionTitle title="Language Preference" icon={Globe} />
                    <p className="text-sm text-gray-600 mb-6">Distribution of users by their preferred language selected via the IVR Call Flow.</p>
                    <div className="space-y-4">
                        {Object.entries(metrics.languageBreakdown).map(([lang, percent]) => (
                            <div key={lang}>
                                <div className="flex justify-between mb-1 text-sm font-medium">
                                    <span>{lang}</span>
                                    <span>{percent}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="h-2.5 rounded-full bg-indigo-500" style={{ width: `${percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-4 text-xs text-gray-500">Total tracked percentage: {totalPercentage}%</p>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    // State for Firebase context (required boilerplate)
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [currentPage, setCurrentPage] = useState('tracking');

    useEffect(() => {
        if (!firebaseConfig) {
            setIsAuthReady(true);
            return;
        }

        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);
        setDb(firestore);

        const authenticate = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }
            } catch (e) {
                console.error("Authentication failed:", e);
            }
            const currentUid = firebaseAuth.currentUser?.uid || crypto.randomUUID();
            setUserId(currentUid);
            setIsAuthReady(true);
        };
        authenticate();
    }, []);


    const renderPage = () => {
        switch (currentPage) {
            case 'tracking':
                return <TrackingDashboard />;
            case 'sms':
                return <SmsContentManager />;
            case 'ivr':
                return <IvrContentManager />;
            default:
                return <TrackingDashboard />;
        }
    };

    const navItems = [
        { id: 'tracking', label: 'Engagement Tracking', icon: BarChart3, color: 'indigo' },
        { id: 'sms', label: 'SMS Content', icon: MessageSquare, color: 'green' },
        { id: 'ivr', label: 'IVR Modules', icon: Phone, color: 'yellow' },
    ];

    // Main UI Render
    return (
        <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-6 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900">
                    Meqenet IVR/SMS Admin Dashboard
                </h1>
                <p className="text-gray-500">Core Service Management & Offline Data Monitoring</p>
            </header>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar Navigation */}
                <nav className="w-full md:w-64 bg-white p-4 rounded-xl shadow-lg flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-500 uppercase mb-4">Navigation</p>
                    <ul className="space-y-2">
                        {navItems.map((item) => (
                            <li key={item.id}>
                                <button
                                    onClick={() => setCurrentPage(item.id)}
                                    className={`w-full flex items-center p-3 rounded-lg font-medium transition-colors duration-150 ${
                                        currentPage === item.id 
                                            ? `bg-${item.color}-100 text-${item.color}-700 border-l-4 border-${item.color}-500`
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5 mr-3" />
                                    {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-500">
                            <Settings className="w-4 h-4 mr-2" />
                            User ID: <span className="ml-1 text-xs font-mono bg-gray-200 p-1 rounded break-all">{userId || 'Loading...'}</span>
                        </div>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-grow">
                    {renderPage()}
                </main>
            </div>
        </div>
    );
};

export default App;
