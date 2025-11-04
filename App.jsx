<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meqenet Learner App - A-Z & 1-100 Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Use Inter font for clean, accessible text -->
    <style>
        body { 
            font-family: 'Inter', sans-serif; 
            transition: background-color 0.3s, color 0.3s; 
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        /* Style for large, touch-friendly buttons */
        .large-touch-target {
            padding: 1rem;
            border-radius: 0.75rem;
            font-weight: bold;
            transition: all 0.2s;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
        }
    </style>
</head>
<body id="app-body" class="bg-white text-gray-900 min-h-screen">

    <!-- Application Wrapper -->
    <div id="app-container" class="max-w-4xl mx-auto p-4 sm:p-8">

        <header class="mb-6 pb-3 border-b-2">
            <h1 class="text-3xl font-extrabold text-indigo-600">Meqenet Learner App</h1>
            <p id="status" class="text-sm font-semibold mt-1 flex items-center">
                <span id="sync-dot" class="inline-block w-3 h-3 rounded-full mr-2 bg-green-500"></span>
                Offline Ready (P1-P3 Content)
            </p>
        </header>
        
        <!-- --- Module Selector (Literacy/Numeracy) --- -->
        <div class="flex space-x-4 mb-6">
            <button onclick="loadModule('literacy')" id="literacy-tab" class="flex-1 large-touch-target bg-indigo-600 text-white shadow-indigo-400">
                📚 Literacy (A-Z)
            </button>
            <button onclick="loadModule('numeracy')" id="numeracy-tab" class="flex-1 large-touch-target bg-gray-300 text-gray-800 shadow-gray-400">
                ➕ Numeracy (1-100)
            </button>
        </div>

        <!-- --- Accessibility Settings Panel --- -->
        <section id="settings-panel" class="mb-8 p-4 bg-gray-100 rounded-xl shadow-inner border border-gray-200">
            <h2 class="text-xl font-bold mb-3 text-gray-700">Customize Your Lesson</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                <!-- Language Selector -->
                <select id="lang-select" onchange="setLanguage(this.value)" class="large-touch-target bg-white border border-gray-300">
                    <option value="am">አማርኛ (Amharic)</option>
                    <option value="en">English</option>
                    <!-- Oromo and Tigrinya included in future versions -->
                </select>

                <!-- Contrast Mode Selector -->
                <select id="contrast-select" onchange="setContrastMode(this.value)" class="large-touch-target bg-white border border-gray-300">
                    <option value="standard">Standard Contrast</option>
                    <option value="high">High Contrast</option>
                    <option value="cognitive">Cognitive Mode</option>
                </select>

                <!-- Text Size Buttons -->
                <button onclick="setTextSize('standard')" class="large-touch-target bg-indigo-500 text-white hover:bg-indigo-600 text-sm">A</button>
                <button onclick="setTextSize('extra-large')" class="large-touch-target bg-indigo-500 text-white hover:bg-indigo-600 text-lg">A++</button>

            </div>
        </section>

        <!-- --- Multisensory Lesson Content --- -->
        <section id="lesson-content" class="p-6 rounded-xl shadow-2xl transition-all">
            <h2 id="lesson-title" class="text-3xl font-bold mb-4 text-center text-indigo-700"></h2>
            
            <!-- Core Content Display (Big Text & Visuals) -->
            <div id="lesson-text-container" class="p-6 my-6 border-4 rounded-xl text-center bg-white shadow-lg transition-all">
                <div id="lesson-visuals" class="mb-4 text-8xl flex justify-center items-center h-20"></div>
                <p id="lesson-word" class="font-extrabold leading-tight text-5xl" style="font-size: 80px;"></p>
                <p id="lesson-example" class="mt-2 text-xl italic"></p>
            </div>
            
            <!-- Navigation and Media Controls -->
            <div class="flex justify-between items-center gap-4 mb-6">
                <button onclick="navigateContent('prev')" id="prev-button" class="large-touch-target bg-red-500 text-white hover:bg-red-600">
                    <span class="text-2xl">← Previous</span>
                </button>

                <div class="flex space-x-3">
                    <button onclick="playAudioHint()" id="audio-button" class="large-touch-target bg-green-500 text-white hover:bg-green-600 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-volume-2 w-6 h-6 mr-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                        <span id="audio-label">Speak</span>
                    </button>
                    <button onclick="showSignLanguage()" class="large-touch-target bg-yellow-500 text-gray-800 hover:bg-yellow-600">
                        Sign Video
                    </button>
                </div>
                
                <button onclick="navigateContent('next')" id="next-button" class="large-touch-target bg-blue-500 text-white hover:bg-blue-600">
                    <span class="text-2xl">Next →</span>
                </button>
            </div>

            <!-- Quiz Simulation -->
            <div id="quiz-area" class="p-6 mt-8 rounded-xl shadow-xl bg-indigo-50">
                <h3 id="quiz-instruction" class="text-2xl font-bold mb-4 text-center text-indigo-700">Choose the correct object/number.</h3>
                <div id="quiz-options" class="grid grid-cols-2 gap-4">
                    <!-- Quiz options will be injected here -->
                </div>
                <p id="quiz-message" class="mt-4 text-center text-xl font-bold"></p>
            </div>

        </section>

    </div>

    <script>
        // --- Core Data and State Management ---

        let appState = {
            module: 'literacy', // 'literacy' or 'numeracy'
            language: 'am',
            textSize: 'extra-large',
            contrastMode: 'standard',
            currentIndex: 0
        };

        const FONT_SIZES = {
            'standard': { word: '40px', example: '1.25rem' },
            'large': { word: '60px', example: '1.5rem' },
            'extra-large': { word: '80px', example: '2rem' }
        };

        const CONTRAST_THEMES = {
            standard: { bg: 'bg-white', text: 'text-gray-900', secondary: 'bg-indigo-600', border: 'border-indigo-600' },
            high: { bg: 'bg-black', text: 'text-yellow-400', secondary: 'bg-yellow-500', border: 'border-yellow-400' },
            cognitive: { bg: 'bg-blue-100', text: 'text-gray-800', secondary: 'bg-green-600', border: 'border-green-600' },
        };
        
        // Data Structure for Literacy (A-Z)
        const LITERACY_DATA = [
            // Only using a subset for a demonstration, scalable to the full Amharic/English alphabet
            { am: 'አ', en: 'A', amWord: 'አፕል', enWord: 'Apple', visual: '🍎' },
            { am: 'በ', en: 'B', amWord: 'ኳስ', enWord: 'Ball', visual: '⚽' },
            { am: 'ከ', en: 'C', amWord: 'ድመት', enWord: 'Cat', visual: '🐈' },
            { am: 'ደ', en: 'D', amWord: 'ውሻ', enWord: 'Dog', visual: '🐕' },
        ];

        // Data Structure for Numeracy (1-100)
        // Using 1-5 for demo, scalable to 100
        const NUMERACY_DATA = [
            { num: 1, amWord: 'አንድ', enWord: 'One', visual: '⭐' },
            { num: 2, amWord: 'ሁለት', enWord: 'Two', visual: '⭐⭐' },
            { num: 3, amWord: 'ሶስት', enWord: 'Three', visual: '⭐⭐⭐' },
            { num: 4, amWord: 'አራት', enWord: 'Four', visual: '⭐⭐⭐⭐' },
            { num: 5, amWord: 'አምስት', enWord: 'Five', visual: '⭐⭐⭐⭐⭐' },
        ];
        
        // --- UI Update Functions ---

        function applyTheme(themeKey) {
            const theme = CONTRAST_THEMES[themeKey];
            const body = document.getElementById('app-body');
            const textContainer = document.getElementById('lesson-text-container');
            const audioButton = document.getElementById('audio-button');
            
            // 1. Apply body background/text colors
            body.className = `${theme.bg} ${theme.text} min-h-screen`;
            
            // 2. Apply border and shadow to lesson container
            const containerBaseClasses = 'p-6 my-6 border-4 rounded-xl text-center shadow-lg transition-all';
            textContainer.className = `${containerBaseClasses} ${theme.border} ${theme.bg === 'bg-black' ? 'bg-gray-900' : 'bg-white'}`;
            
            // 3. Update state
            appState.contrastMode = themeKey;
        }

        function updateLessonContent() {
            const isLiteracy = appState.module === 'literacy';
            const dataSet = isLiteracy ? LITERACY_DATA : NUMERACY_DATA;
            const currentItem = dataSet[appState.currentIndex];
            
            if (!currentItem) return;

            const lang = appState.language;
            const lessonTitleEl = document.getElementById('lesson-title');
            const lessonVisualsEl = document.getElementById('lesson-visuals');
            const lessonWordEl = document.getElementById('lesson-word');
            const lessonExampleEl = document.getElementById('lesson-example');
            
            // Set titles and core text based on module and language
            if (isLiteracy) {
                lessonTitleEl.textContent = lang === 'am' ? 'ፊደላት መማር (አ-ደ)' : 'Learning Letters (A-D)';
                lessonVisualsEl.innerHTML = currentItem.visual;
                lessonWordEl.textContent = lang === 'am' ? currentItem.am : currentItem.en;
                lessonExampleEl.textContent = lang === 'am' ? `${currentItem.am} ለ ${currentItem.amWord}` : `${currentItem.en} is for ${currentItem.enWord}`;
            } else {
                lessonTitleEl.textContent = lang === 'am' ? 'ቁጥሮች መማር (1-5)' : 'Learning Numbers (1-5)';
                lessonVisualsEl.innerHTML = currentItem.visual;
                lessonWordEl.textContent = currentItem.num;
                lessonExampleEl.textContent = lang === 'am' ? currentItem.amWord : currentItem.enWord;
            }

            // Redraw quiz for multisensory check
            renderQuiz();
        }

        function applyTextSize(sizeKey) {
            const size = FONT_SIZES[sizeKey];
            const wordElement = document.getElementById('lesson-word');
            const exampleElement = document.getElementById('lesson-example');
            
            wordElement.style.fontSize = size.word;
            exampleElement.style.fontSize = size.example;

            appState.textSize = sizeKey;
        }

        // --- Navigation and Interaction ---

        function loadModule(moduleKey) {
            appState.module = moduleKey;
            appState.currentIndex = 0; // Reset index when changing modules
            
            // Update tab styles
            const tabs = { literacy: 'literacy-tab', numeracy: 'numeracy-tab' };
            document.getElementById(tabs[moduleKey]).className = document.getElementById(tabs[moduleKey]).className.replace('bg-gray-300 text-gray-800', 'bg-indigo-600 text-white');
            const otherModule = moduleKey === 'literacy' ? 'numeracy' : 'literacy';
            document.getElementById(tabs[otherModule]).className = document.getElementById(tabs[otherModule]).className.replace('bg-indigo-600 text-white', 'bg-gray-300 text-gray-800');

            updateLessonContent();
        }
        
        function navigateContent(direction) {
            const dataSet = appState.module === 'literacy' ? LITERACY_DATA : NUMERACY_DATA;
            let newIndex = appState.currentIndex;
            
            if (direction === 'next') {
                newIndex = (appState.currentIndex + 1) % dataSet.length;
            } else if (direction === 'prev') {
                newIndex = (appState.currentIndex - 1 + dataSet.length) % dataSet.length;
            }
            
            appState.currentIndex = newIndex;
            updateLessonContent();
        }

        function setLanguage(code) {
            appState.language = code;
            updateLessonContent();
        }

        function setContrastMode(mode) {
            applyTheme(mode);
        }

        function setTextSize(size) {
            applyTextSize(size);
        }

        function playAudioHint() {
            // Simulated TTS/Voice-Guided reading
            const currentItem = appState.module === 'literacy' ? LITERACY_DATA[appState.currentIndex] : NUMERACY_DATA[appState.currentIndex];
            const word = appState.module === 'literacy' ? 
                (appState.language === 'am' ? currentItem.amWord : currentItem.enWord) :
                (appState.language === 'am' ? currentItem.amWord : currentItem.enWord);

            const audioLabel = document.getElementById('audio-label');

            audioLabel.textContent = "🔊 Speaking: " + word;
            document.getElementById('audio-button').disabled = true;

            // Simulate the audio delay
            setTimeout(() => {
                audioLabel.textContent = "Speak";
                document.getElementById('audio-button').disabled = false;
            }, 1800);
        }

        function showSignLanguage() {
            showFeedback("Simulating Ethiopian Sign Language Video for this concept.", 'info');
        }

        function handleQuizSelection(isCorrect) {
            const message = isCorrect ? "🎉 በጣም ጥሩ! (Excellent!)" : "እንደገና ይሞክሩ (Try again).";
            const type = isCorrect ? 'success' : 'error';
            
            showFeedback(message, type);

            // Optional: Auto-advance after correct answer
            if (isCorrect) {
                setTimeout(() => navigateContent('next'), 1500);
            }
        }

        // --- Renderer and Initialization ---

        function renderQuiz() {
            const isLiteracy = appState.module === 'literacy';
            const currentItem = isLiteracy ? LITERACY_DATA[appState.currentIndex] : NUMERACY_DATA[appState.currentIndex];
            const lang = appState.language;
            const optionsContainer = document.getElementById('quiz-options');
            optionsContainer.innerHTML = '';
            
            // Quiz options structure: The correct answer + one incorrect decoy
            let correctOption, decoyOption;

            if (isLiteracy) {
                correctOption = { label: lang === 'am' ? currentItem.amWord : currentItem.enWord, visual: currentItem.visual, correct: true };
                
                // Use a decoy from the next item or just a simple mismatch
                const decoyData = LITERACY_DATA[(appState.currentIndex + 1) % LITERACY_DATA.length];
                decoyOption = { label: lang === 'am' ? decoyData.amWord : decoyData.enWord, visual: decoyData.visual, correct: false };
            } else {
                correctOption = { label: lang === 'am' ? currentItem.amWord : currentItem.enWord, visual: currentItem.visual, correct: true };
                // Decoy is a nearby number
                const decoyNum = (currentItem.num % 5) + 1;
                const decoyData = NUMERACY_DATA.find(d => d.num === decoyNum);
                decoyOption = { label: lang === 'am' ? decoyData.amWord : decoyData.enWord, visual: decoyData.visual, correct: false };
            }
            
            const options = [correctOption, decoyOption].sort(() => Math.random() - 0.5);

            options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'large-touch-target bg-white text-gray-800 border-2 border-indigo-300 hover:bg-indigo-100 flex flex-col items-center justify-center';
                button.innerHTML = `<span class="text-3xl">${option.label}</span><span class="text-4xl mt-2">${option.visual}</span>`;
                button.onclick = () => handleQuizSelection(option.correct);
                optionsContainer.appendChild(button);
            });
        }

        function showFeedback(message, type) {
            const quizMessage = document.getElementById('quiz-message');
            quizMessage.textContent = message;
            
            if (type === 'success') {
                quizMessage.className = 'mt-4 text-center text-3xl font-bold text-green-600';
            } else if (type === 'error') {
                quizMessage.className = 'mt-4 text-center text-3xl font-bold text-red-600';
            } else { // info
                quizMessage.className = 'mt-4 text-center text-3xl font-bold text-blue-600';
            }

            // Clear message after 3 seconds
            setTimeout(() => {
                quizMessage.textContent = '';
                quizMessage.className = 'mt-4 text-center text-xl font-bold';
            }, 3000);
        }

        // Initial setup on load
        window.onload = function() {
            // Apply initial accessibility state
            applyTheme(appState.contrastMode);
            applyTextSize(appState.textSize);
            
            // Load the default module (Literacy)
            loadModule(appState.module); 
            // Set default language after loading content
            setLanguage(appState.language);

            console.log("Meqenet Learner App initialized.");
        };

    </script>
</body>
</html>
