/**
 * Seed Companion App - Parent Transparency Portal Logic
 * Coordinates parent controls, interactive story library, nutrition insights, 
 * settings sync, and the child's Storybox hardware simulator.
 */

// ==========================================================================
// 1. Initial State & Prepopulated History
// ==========================================================================

const DEFAULT_STORIES = [
    {
        id: "story_1",
        title: "Barnaby Bear's Heavy Branch",
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
        wordCount: 312,
        pacing: "Calm",
        beads: { meat: 3, veggies: 1, grains: 1, dairy: 0 },
        favorite: false,
        notes: "Liam wanted to carry a heavy twig just like Barnaby Bear in the garden today. Helpful story!",
        protagonist: "Barnaby Bear",
        content: "Continuing from the path where they last rested, a new morning arrived with soft, grey light. Early light broke through the silent forest, warming the dew on the ferns. The sky was a pale, gentle blue, and the grass was cool underfoot. Barnaby Bear walked along the river path with steady confidence, taking in the scent of the pine needles. From behind the mossy logs, Gideon Grain and Miss Broccoli followed along, each finding their own unhurried way side by side. As they continued down the dirt path, they noticed the wind had knocked down a small twig. It lay across the pathway, surrounded by yellow leaves. Mr. Claws the Crab stepped around it with a soft, guiding movement, while the others paused to inspect its rough bark. Each friend helped in their own quiet way, moving at a comfortable pace without force. The air felt warm, and the birds chirped softly from the higher branches. They could feel the dry soil under their feet and hear the rhythmic rustle of the leaves above. It was a pleasant moment of shared effort in the shade of the valley. Taking small, steady steps can open the way for everyone.",
        insight: "This story featured a high Meat/Fish count (3 beads) and Grains (1 bead). The narrative focused on Barnaby Bear's physical presence and steady determination. The obstacle was a small twig (Dairy=0 constraint), encouraging Liam to think about resolving group tasks calmly without forced actions. Liam's choices show a high interest in animal-themed stories today."
    },
    {
        id: "story_2",
        title: "Sylvia Strawberry and the Hidden Brook",
        timestamp: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(), // 1.5 days ago
        wordCount: 345,
        pacing: "Calming",
        beads: { meat: 1, veggies: 1, grains: 1, dairy: 1 },
        favorite: true,
        notes: "Liam loved the character Daisy the Cow! He asked for a glass of milk while listening.",
        protagonist: "Sylvia Strawberry",
        content: "A soft morning breeze drifted through the green meadows, bringing a clean, warm scent of wet moss. The afternoon sun warmed the smooth river rocks, painting the sky in soft shades of butter yellow and amber. Sylvia Strawberry and Gideon Grain continued side by side, quietly taking in the peaceful surroundings. Together, Daisy the Cow and Barnaby Bear walked down the winding trail, sharing the quietness of the woods. They wanted to inspect the small hollow at the base of the great elm. A light tangle of dry meadow grass was blocking the narrow entryway. Captain Cheese stepped forward with a calm sense of purpose, helping to clear the dry stalks without rush. They worked slowly and steadily, enjoying the feel of the cool air and the smell of the damp earth. A sense of calm achievement filled the clearing as the sun began to filter through the canopy. They sat down on a smooth log to rest, listening to the peaceful murmur of the forest. The yellow buttercups swayed gently in the meadow breeze, their petals catching the soft light. A perfectly balanced day leaves everyone feeling rested and content.",
        insight: "This story was perfectly balanced, utilizing 1 bead from all four categories. The narrative had a calming pace, introducing Sylvia Strawberry, Gideon Grain, Daisy the Cow, and Captain Cheese working in harmony to clear dry meadow grass. This reflects excellent dietary balance, showing that a mixture of all food categories builds a balanced day."
    },
    {
        id: "story_3",
        title: "Gideon Grain's Gentle Climb",
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
        wordCount: 295,
        pacing: "Dynamic",
        beads: { meat: 0, veggies: 0, grains: 4, dairy: 1 },
        favorite: false,
        notes: "",
        protagonist: "Gideon Grain",
        content: "The forest was waking up slowly, filled with the fresh smell of damp soil. A light mist hung over the grassy knoll, and the morning air smelled clean and crisp like pine needles. Gideon Grain lead the way, while Captain Cheese stepped along close behind, checking the smooth bark of the birch trees. As they continued down the dirt path, they noticed the wind had knocked down a small pile of firewood. It lay across the pathway, surrounded by yellow leaves. Gideon Grain helped to move the small logs with a soft, steady push, taking care not to snag their clothing. Step by step, the path became clear, and they continued their journey under the warm sunshine. A small grey squirrel sat on a nearby branch, watching their progress with quiet curiosity. The sound of the brook was a comforting murmur that filled the silent gaps in their journey. Even a winding road is easy when friends find their rhythm.",
        insight: "This story was dominated by Grains (4 beads), indicating energy and active pacing. Gideon Grain was the protagonist, teaching a lesson on stamina and steady climbing. Grains supply slow-release energy, reflecting Liam's choice for a highly active storyline today."
    }
];

const DEFAULT_SETTINGS = {
    volume: 60,
    voice: "FEMALE_WARM",
    bedtimeLock: false,
    bedtimeTime: "20:00",
    storyLength: "medium",
    wifiSsid: "MyHomeWiFi",
    wifiPass: "sweetstorybox",
    apiKey: ""
};

// Date Formatting Helpers for Locale Safety
function formatStoryDate(dateStr) {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        return "Recent";
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatStoryDateTime(dateStr) {
    if (!dateStr) return "Recent";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
        return "Recent";
    }
    return d.toLocaleString([], { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Application State
let appState = {
    stories: [],
    settings: {},
    activeTab: "screen-home",
    selectedStoryId: null,
    
    // Simulator State
    simBeads: { meat: 0, veggies: 0, grains: 0, dairy: 0 },
    simStatus: "idle", // idle, generating, playing
    simBattery: 85,
    simCpuTemp: 34.2,
    simWifiRssi: -46,
    simTime: new Date()
};

// Load state from localStorage or use defaults
function initLocalStorageState() {
    const savedStories = localStorage.getItem("seed_stories");
    const savedSettings = localStorage.getItem("seed_settings");

    try {
        if (savedStories) {
            const parsed = JSON.parse(savedStories);
            if (Array.isArray(parsed)) {
                let repairedStories = [];
                let needsRepair = false;

                parsed.forEach((s, idx) => {
                    if (!s || typeof s !== "object") {
                        needsRepair = true;
                        return; // Discard completely invalid items
                    }

                    let repaired = { ...s };

                    // Verify/Repair required fields
                    if (typeof repaired.id !== "string" && typeof repaired.id !== "number") {
                        repaired.id = "story_" + (Date.now() + idx);
                        needsRepair = true;
                    }

                    if (typeof repaired.title !== "string") {
                        repaired.title = "A Whimsical Story";
                        needsRepair = true;
                    }

                    const d = new Date(repaired.timestamp);
                    if (!repaired.timestamp || isNaN(d.getTime())) {
                        repaired.timestamp = new Date().toISOString();
                        needsRepair = true;
                    } else {
                        repaired.timestamp = d.toISOString();
                    }

                    if (typeof repaired.wordCount !== "number") {
                        repaired.wordCount = repaired.content ? repaired.content.split(/\s+/).filter(Boolean).length : 0;
                        needsRepair = true;
                    }

                    if (typeof repaired.pacing !== "string") {
                        repaired.pacing = "Calm";
                        needsRepair = true;
                    }

                    // Validate beads object
                    if (!repaired.beads || typeof repaired.beads !== "object") {
                        repaired.beads = { meat: 0, veggies: 0, grains: 0, dairy: 0 };
                        needsRepair = true;
                    } else {
                        const categories = ["meat", "veggies", "grains", "dairy"];
                        categories.forEach(cat => {
                            const val = parseInt(repaired.beads[cat]);
                            if (isNaN(val) || val < 0 || val > 5) {
                                repaired.beads[cat] = 0;
                                needsRepair = true;
                            } else {
                                repaired.beads[cat] = val;
                            }
                        });
                    }

                    if (typeof repaired.favorite !== "boolean") {
                        repaired.favorite = !!repaired.favorite;
                        needsRepair = true;
                    }

                    if (typeof repaired.notes !== "string") {
                        repaired.notes = "";
                        needsRepair = true;
                    }

                    if (typeof repaired.protagonist !== "string") {
                        let maxCount = -1;
                        let dominantCat = "veggies";
                        Object.keys(repaired.beads).forEach(cat => {
                            if (repaired.beads[cat] > maxCount) {
                                maxCount = repaired.beads[cat];
                                dominantCat = cat;
                            }
                        });
                        repaired.protagonist = characterMap[dominantCat] ? characterMap[dominantCat].name : "Miss Broccoli";
                        needsRepair = true;
                    }

                    if (typeof repaired.content !== "string") {
                        repaired.content = "Liam and his friends had a lovely adventure today.";
                        needsRepair = true;
                    }

                    if (typeof repaired.insight !== "string") {
                        repaired.insight = "No description available.";
                        needsRepair = true;
                    }

                    repairedStories.push(repaired);
                });

                appState.stories = repairedStories;
                if (needsRepair || repairedStories.length !== parsed.length) {
                    localStorage.setItem("seed_stories", JSON.stringify(appState.stories));
                }
            } else {
                appState.stories = [...DEFAULT_STORIES];
                localStorage.setItem("seed_stories", JSON.stringify(appState.stories));
            }
        } else {
            appState.stories = [...DEFAULT_STORIES];
            localStorage.setItem("seed_stories", JSON.stringify(appState.stories));
        }
    } catch (e) {
        console.error("Error parsing seed_stories, resetting defaults", e);
        appState.stories = [...DEFAULT_STORIES];
        localStorage.setItem("seed_stories", JSON.stringify(appState.stories));
    }

    try {
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings && typeof parsedSettings === "object" && !Array.isArray(parsedSettings)) {
                let repaired = { ...DEFAULT_SETTINGS, ...parsedSettings };
                let needsRepair = false;

                if (typeof repaired.volume !== "number" || repaired.volume < 10 || repaired.volume > 100) {
                    repaired.volume = DEFAULT_SETTINGS.volume;
                    needsRepair = true;
                }
                if (typeof repaired.voice !== "string") {
                    repaired.voice = DEFAULT_SETTINGS.voice;
                    needsRepair = true;
                }
                if (typeof repaired.bedtimeLock !== "boolean") {
                    repaired.bedtimeLock = DEFAULT_SETTINGS.bedtimeLock;
                    needsRepair = true;
                }
                if (typeof repaired.bedtimeTime !== "string" || !/^\d{2}:\d{2}$/.test(repaired.bedtimeTime)) {
                    repaired.bedtimeTime = DEFAULT_SETTINGS.bedtimeTime;
                    needsRepair = true;
                }
                const validLengths = ["short", "medium", "long"];
                if (typeof repaired.storyLength !== "string" || !validLengths.includes(repaired.storyLength)) {
                    repaired.storyLength = DEFAULT_SETTINGS.storyLength;
                    needsRepair = true;
                }
                if (typeof repaired.wifiSsid !== "string") {
                    repaired.wifiSsid = DEFAULT_SETTINGS.wifiSsid;
                    needsRepair = true;
                }
                if (typeof repaired.wifiPass !== "string") {
                    repaired.wifiPass = DEFAULT_SETTINGS.wifiPass;
                    needsRepair = true;
                }
                if (typeof repaired.apiKey !== "string") {
                    repaired.apiKey = "";
                    needsRepair = true;
                }

                appState.settings = repaired;
                if (needsRepair) {
                    localStorage.setItem("seed_settings", JSON.stringify(appState.settings));
                }
            } else {
                appState.settings = { ...DEFAULT_SETTINGS };
                localStorage.setItem("seed_settings", JSON.stringify(appState.settings));
            }
        } else {
            appState.settings = { ...DEFAULT_SETTINGS };
            localStorage.setItem("seed_settings", JSON.stringify(appState.settings));
        }
    } catch (e) {
        console.error("Error parsing seed_settings, resetting defaults", e);
        appState.settings = { ...DEFAULT_SETTINGS };
        localStorage.setItem("seed_settings", JSON.stringify(appState.settings));
    }
}

// Character mappings for Seed v2.2
const characterMap = {
    meat: { name: "Barnaby Bear", icon: "🐻", label: "Meat/Fish", color: "#E76F51" },
    veggies: { name: "Miss Broccoli", icon: "🥦", label: "Veggies/Fruit", color: "#4EAA78" },
    grains: { name: "Gideon Grain", icon: "🌾", label: "Grains", color: "#E9C46A" },
    dairy: { name: "Captain Cheese", icon: "🥛", label: "Dairy", color: "#4EA8DE" }
};

// ==========================================================================
// 2. UI Elements & Event Listeners Cache
// ==========================================================================

let domElements = {};

function cacheDomElements() {
    // Nav & Screen selectors
    domElements.navButtons = document.querySelectorAll(".nav-item");
    domElements.screens = document.querySelectorAll(".app-screen");
    domElements.phoneTime = document.getElementById("phone-time-display");
    domElements.phoneBatteryDisplay = document.getElementById("phone-battery-display");
    domElements.phoneBatteryFill = document.getElementById("phone-battery-fill");
    domElements.appNotification = document.getElementById("app-notification");
    domElements.notificationTitle = document.getElementById("notification-title");
    domElements.notificationBody = document.getElementById("notification-body");
    domElements.btnCloseNotification = document.getElementById("btn-close-notification");
    domElements.appDeviceBadge = document.getElementById("app-device-badge");
    domElements.globalConnectionBadge = document.getElementById("global-connection-badge");

    // Home Screen elements
    domElements.homeDeviceStatusTxt = document.getElementById("home-device-status-txt");
    domElements.statusValBattery = document.getElementById("status-val-battery");
    domElements.statusValWifi = document.getElementById("status-val-wifi");
    domElements.statusValVolume = document.getElementById("status-val-volume");
    domElements.homeLiveRing = document.getElementById("home-live-ring");
    domElements.homeLiveIcon = document.getElementById("home-live-icon");
    domElements.homeLiveStatusTitle = document.getElementById("home-live-status-title");
    domElements.homeLiveStatusDesc = document.getElementById("home-live-status-desc");
    domElements.homePillMeat = document.getElementById("home-pill-meat");
    domElements.homePillVeggies = document.getElementById("home-pill-veggies");
    domElements.homePillGrains = document.getElementById("home-pill-grains");
    domElements.homePillDairy = document.getElementById("home-pill-dairy");
    domElements.statCountToday = document.getElementById("stat-count-today");
    domElements.statCountFavorites = document.getElementById("stat-count-favorites");
    domElements.homeInsightsCard = document.getElementById("home-insights-card");
    domElements.homeInsightsText = document.getElementById("home-insights-text");
    domElements.btnGoToInsights = document.getElementById("btn-go-to-insights");

    // Stories Archive Screen elements
    domElements.storiesSearchInput = document.getElementById("stories-search-input");
    domElements.filterBadgesBar = document.getElementById("filter-badges-bar");
    domElements.archiveStoriesList = document.getElementById("archive-stories-list");
    domElements.storiesEmptyState = document.getElementById("stories-empty-state");

    // Detail Screen elements
    domElements.screenStoryDetail = document.getElementById("screen-story-detail");
    domElements.btnCloseDetail = document.getElementById("btn-close-detail");
    domElements.detailBtnFav = document.getElementById("detail-btn-fav");
    domElements.detailAvatar = document.getElementById("detail-avatar");
    domElements.detailTitle = document.getElementById("detail-title");
    domElements.detailDate = document.getElementById("detail-date");
    domElements.detailWordcount = document.getElementById("detail-wordcount");
    domElements.detailBeadBadges = document.getElementById("detail-bead-badges");
    domElements.detailTextBody = document.getElementById("detail-text-body");
    domElements.detailNutritionDesc = document.getElementById("detail-nutrition-desc");
    domElements.detailNotesInput = document.getElementById("detail-notes-input");
    domElements.notesSavedLbl = document.getElementById("notes-saved-lbl");
    domElements.detailBtnDelete = document.getElementById("detail-btn-delete");

    // Player elements
    domElements.playerPlayBtn = document.getElementById("player-play-btn");
    domElements.playerStatusTxt = document.getElementById("player-status-txt");
    domElements.playerSpeed = document.getElementById("player-speed");
    domElements.playerWaveform = document.getElementById("player-waveform");

    // Insights Screen elements
    domElements.insightsDonutChart = document.getElementById("insights-donut-chart");
    domElements.donutTotalBeads = document.getElementById("donut-total-beads");
    domElements.legendCountMeat = document.getElementById("legend-count-meat");
    domElements.legendCountVeggies = document.getElementById("legend-count-veggies");
    domElements.legendCountGrains = document.getElementById("legend-count-grains");
    domElements.legendCountDairy = document.getElementById("legend-count-dairy");
    domElements.coachAssessmentText = document.getElementById("coach-assessment-text");
    domElements.badgeFirstStory = document.getElementById("badge-first-story");
    domElements.badgeRainbowPlate = document.getElementById("badge-rainbow-plate");
    domElements.badgeVeggieExplorer = document.getElementById("badge-veggie-explorer");
    domElements.badgePerfectBalance = document.getElementById("badge-perfect-balance");

    // Settings Screen elements
    domElements.settingsVolume = document.getElementById("settings-volume");
    domElements.settingsVolumeLbl = document.getElementById("settings-volume-lbl");
    domElements.settingsVoice = document.getElementById("settings-voice");
    domElements.settingsBedtimeToggle = document.getElementById("settings-bedtime-toggle");
    domElements.settingsBedtimeHoursRow = document.getElementById("settings-bedtime-hours-row");
    domElements.settingsBedtimeTime = document.getElementById("settings-bedtime-time");
    domElements.settingsLenTxt = document.getElementById("settings-len-txt");
    domElements.btnLenMinus = document.getElementById("btn-len-minus");
    domElements.btnLenPlus = document.getElementById("btn-len-plus");
    domElements.settingsWifiSsid = document.getElementById("settings-wifi-ssid");
    domElements.settingsWifiPass = document.getElementById("settings-wifi-pass");
    domElements.btnSaveWifi = document.getElementById("btn-save-wifi");
    domElements.btnCheckOta = document.getElementById("btn-check-ota");
    domElements.otaStatusLbl = document.getElementById("ota-status-lbl");
    domElements.settingsApiKey = document.getElementById("settings-api-key");

    // Accordions
    domElements.accWifiTrigger = document.getElementById("acc-wifi-trigger");
    domElements.accWifiContent = document.getElementById("acc-wifi-content");
    domElements.accDiagTrigger = document.getElementById("acc-diag-trigger");
    domElements.accDiagContent = document.getElementById("acc-diag-content");

    // Diagnostics logs
    domElements.diagAdcMeat = document.getElementById("diag-adc-meat");
    domElements.diagAdcVeggies = document.getElementById("diag-adc-veggies");
    domElements.diagAdcGrains = document.getElementById("diag-adc-grains");
    domElements.diagAdcDairy = document.getElementById("diag-adc-dairy");
    domElements.diagCpuTemp = document.getElementById("diag-cpu-temp");

    // Hardware Simulator elements
    domElements.simLedRing = document.getElementById("sim-led-ring");
    domElements.simCountMeat = document.getElementById("sim-count-meat");
    domElements.simCountVeggies = document.getElementById("sim-count-veggies");
    domElements.simCountGrains = document.getElementById("sim-count-grains");
    domElements.simCountDairy = document.getElementById("sim-count-dairy");
    domElements.simStackMeat = document.getElementById("sim-stack-meat");
    domElements.simStackVeggies = document.getElementById("sim-stack-veggies");
    domElements.simStackGrains = document.getElementById("sim-stack-grains");
    domElements.simStackDairy = document.getElementById("sim-stack-dairy");
    domElements.simBtnStart = document.getElementById("sim-btn-start");
    domElements.simBtnStop = document.getElementById("sim-btn-stop");
    domElements.simTelStatus = document.getElementById("sim-tel-status");
    domElements.simTelBattery = document.getElementById("sim-tel-battery");
    domElements.simTelRssi = document.getElementById("sim-tel-rssi");
    domElements.simConsoleOutput = document.getElementById("sim-console-output");
    domElements.btnClearSimLogs = document.getElementById("btn-clear-sim-logs");

    // Mobile Simulator Toggle
    domElements.btnMobileSimToggle = document.getElementById("btn-mobile-sim-toggle");
    domElements.simulatorWrapper = document.querySelector(".simulator-wrapper");
}

// ==========================================================================
// 3. Application Routing & Tab Navigation
// ==========================================================================

function setupNavigation() {
    domElements.navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetScreen = btn.dataset.target;
            switchScreen(targetScreen);
        });
    });

    domElements.btnGoToInsights.addEventListener("click", () => {
        switchScreen("screen-insights");
    });

    // Close notification toast
    domElements.btnCloseNotification.addEventListener("click", () => {
        domElements.appNotification.classList.add("hidden");
    });
}

function switchScreen(screenId) {
    appState.activeTab = screenId;
    
    // Toggle navigation active states
    domElements.navButtons.forEach(btn => {
        if (btn.dataset.target === screenId) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // Toggle screen displays
    domElements.screens.forEach(screen => {
        if (screen.id === screenId) {
            screen.classList.remove("hidden");
        } else {
            screen.classList.add("hidden");
        }
    });

    // Hide detailed screen overlay if navigating
    domElements.screenStoryDetail.classList.add("hidden");
    stopAudioSpeech();

    // Specific screen entry refreshes
    if (screenId === "screen-home") {
        updateHomeWidgets();
    } else if (screenId === "screen-stories") {
        renderStoriesArchive();
    } else if (screenId === "screen-insights") {
        updateInsightsScreen();
    }
}

// Update Phone status bar time & battery
function startPhoneSystemSimulation() {
    const updateTime = () => {
        const now = new Date();
        let hrs = now.getHours();
        let mins = now.getMinutes();
        hrs = hrs < 10 ? "0" + hrs : hrs;
        mins = mins < 10 ? "0" + mins : mins;
        domElements.phoneTime.textContent = `${hrs}:${mins}`;
        
        // Match simulator battery status
        domElements.phoneBatteryDisplay.textContent = `${appState.simBattery}%`;
        domElements.phoneBatteryFill.style.width = `${appState.simBattery}%`;
        domElements.statusValBattery.textContent = `${appState.simBattery}%`;
        domElements.simTelBattery.textContent = `${appState.simBattery}%`;
    };

    updateTime();
    setInterval(updateTime, 10000); // every 10s
}

// Custom push notification
function showPushNotification(title, message) {
    domElements.notificationTitle.textContent = title;
    domElements.notificationBody.textContent = message;
    domElements.appNotification.classList.remove("hidden");

    // Auto dismiss after 5s
    if (window.notiTimeout) clearTimeout(window.notiTimeout);
    window.notiTimeout = setTimeout(() => {
        domElements.appNotification.classList.add("hidden");
    }, 5000);
}

// Accordion toggle helpers
function setupAccordions() {
    const toggleAccordion = (trigger, content) => {
        trigger.parentElement.classList.toggle("open");
        content.classList.toggle("hidden");
    };

    domElements.accWifiTrigger.addEventListener("click", () => {
        toggleAccordion(domElements.accWifiTrigger, domElements.accWifiContent);
    });

    domElements.accDiagTrigger.addEventListener("click", () => {
        toggleAccordion(domElements.accDiagTrigger, domElements.accDiagContent);
    });
}

// ==========================================================================
// 4. Sync settings (Parent App <-> State <-> Simulator)
// ==========================================================================

function setupSettingsListeners() {
    // Volume slider
    domElements.settingsVolume.addEventListener("input", (e) => {
        const val = e.target.value;
        appState.settings.volume = parseInt(val);
        domElements.settingsVolumeLbl.textContent = `${val}%`;
        domElements.statusValVolume.textContent = `${val}%`;
        saveSettingsToLocal();
        logHardwareEvent(`[CMD] Speaker Volume set to ${val}%`, "info");
    });

    // Voice Selector
    domElements.settingsVoice.addEventListener("change", (e) => {
        appState.settings.voice = e.target.value;
        saveSettingsToLocal();
        logHardwareEvent(`[CMD] Voice profile changed to ${e.target.value}`, "info");
    });

    // Bedtime Lock
    domElements.settingsBedtimeToggle.addEventListener("change", (e) => {
        appState.settings.bedtimeLock = e.target.checked;
        if (e.target.checked) {
            domElements.settingsBedtimeHoursRow.classList.remove("hidden");
        } else {
            domElements.settingsBedtimeHoursRow.classList.add("hidden");
        }
        saveSettingsToLocal();
        logHardwareEvent(`[CMD] Bedtime lock set to ${e.target.checked ? "ON" : "OFF"}`, "info");
    });

    domElements.settingsBedtimeTime.addEventListener("change", (e) => {
        appState.settings.bedtimeTime = e.target.value;
        saveSettingsToLocal();
        logHardwareEvent(`[CMD] Bedtime lock threshold configured for ${e.target.value}`, "info");
    });

    // Story Length Stepper
    const lengths = ["short", "medium", "long"];
    const lengthLabels = { short: "Short (3m)", medium: "Medium (7m)", long: "Long (15m)" };

    domElements.btnLenPlus.addEventListener("click", () => {
        const currIdx = lengths.indexOf(appState.settings.storyLength);
        if (currIdx < lengths.length - 1) {
            const nextLen = lengths[currIdx + 1];
            appState.settings.storyLength = nextLen;
            domElements.settingsLenTxt.textContent = lengthLabels[nextLen];
            saveSettingsToLocal();
            logHardwareEvent(`[CMD] Target story length set to ${nextLen.toUpperCase()}`, "info");
        }
    });

    domElements.btnLenMinus.addEventListener("click", () => {
        const currIdx = lengths.indexOf(appState.settings.storyLength);
        if (currIdx > 0) {
            const prevLen = lengths[currIdx - 1];
            appState.settings.storyLength = prevLen;
            domElements.settingsLenTxt.textContent = lengthLabels[prevLen];
            saveSettingsToLocal();
            logHardwareEvent(`[CMD] Target story length set to ${prevLen.toUpperCase()}`, "info");
        }
    });

    // Wi-Fi details push
    domElements.btnSaveWifi.addEventListener("click", () => {
        const ssid = domElements.settingsWifiSsid.value.trim();
        const pass = domElements.settingsWifiPass.value.trim();

        if (!ssid) {
            alert("Please enter a Wi-Fi Network Name (SSID).");
            return;
        }

        appState.settings.wifiSsid = ssid;
        appState.settings.wifiPass = pass;
        saveSettingsToLocal();

        logHardwareEvent(`[CMD] Broadcasting Wi-Fi credentials: SSID "${ssid}"`, "info");
        
        // Simulate pushing to board
        domElements.btnSaveWifi.textContent = "Pushing...";
        domElements.btnSaveWifi.disabled = true;
        
        setTimeout(() => {
            logHardwareEvent(`[WIFI ACK] Connection established on "${ssid}". IP: 192.168.1.15.`, "sys");
            domElements.btnSaveWifi.textContent = "Push Wi-Fi to Device";
            domElements.btnSaveWifi.disabled = false;
            domElements.settingsWifiSsid.value = "";
            domElements.settingsWifiPass.value = "";
            alert("Wi-Fi settings synchronized successfully!");
        }, 1500);
    });

    // OTA updates check
    domElements.btnCheckOta.addEventListener("click", () => {
        domElements.btnCheckOta.disabled = true;
        domElements.btnCheckOta.textContent = "Checking Firmware...";
        logHardwareEvent(`[OTA] Querying server: current version v2.2.0`, "info");

        setTimeout(() => {
            logHardwareEvent(`[OTA ACK] Latest matches current. Device is up to date.`, "sys");
            domElements.btnCheckOta.textContent = "Check OTA Updates";
            domElements.btnCheckOta.disabled = false;
            alert("Your Seed Storybox has the latest firmware version (v2.2.0).");
        }, 1500);
    });

    // Gemini API Key listener
    domElements.settingsApiKey.addEventListener("input", (e) => {
        appState.settings.apiKey = e.target.value.trim();
        saveSettingsToLocal();
        logHardwareEvent(`[CMD] Gemini API Key updated`, "info");
    });
}

function loadSettingsIntoUI() {
    const s = appState.settings;
    domElements.settingsVolume.value = s.volume;
    domElements.settingsVolumeLbl.textContent = `${s.volume}%`;
    domElements.statusValVolume.textContent = `${s.volume}%`;
    domElements.settingsVoice.value = s.voice;
    domElements.settingsBedtimeToggle.checked = s.bedtimeLock;
    domElements.settingsBedtimeTime.value = s.bedtimeTime;

    if (s.bedtimeLock) {
        domElements.settingsBedtimeHoursRow.classList.remove("hidden");
    } else {
        domElements.settingsBedtimeHoursRow.classList.add("hidden");
    }

    const lengthLabels = { short: "Short (3m)", medium: "Medium (7m)", long: "Long (15m)" };
    domElements.settingsLenTxt.textContent = lengthLabels[s.storyLength];

    // Load API Key
    domElements.settingsApiKey.value = s.apiKey || "";
}

function saveSettingsToLocal() {
    localStorage.setItem("seed_settings", JSON.stringify(appState.settings));
}

// ==========================================================================
// 5. Hardware Simulator Interactions
// ==========================================================================

function setupHardwareSimulator() {
    const btnSteps = document.querySelectorAll(".btn-slot-step");
    
    btnSteps.forEach(btn => {
        btn.addEventListener("click", () => {
            if (appState.simStatus !== "idle") {
                logHardwareEvent("[WARNING] Cannot adjust beads while story is playing or generating.", "err");
                return;
            }

            const category = btn.dataset.category;
            const isPlus = btn.classList.contains("plus");
            const currentCount = appState.simBeads[category];

            if (isPlus) {
                if (currentCount >= 5) {
                    logHardwareEvent(`[PEG LIMIT] Max 5 beads on ${category} slot peg.`, "err");
                    return;
                }
                appState.simBeads[category]++;
            } else {
                if (currentCount <= 0) return;
                appState.simBeads[category]--;
            }

            // Sync visual bead stacks
            syncPegUI(category);
            updateBoardSensors();
            updateLiveActivityDisplay();
        });
    });

    // Clear logs
    domElements.btnClearSimLogs.addEventListener("click", () => {
        domElements.simConsoleOutput.innerHTML = '<div class="log-line sys">[SYSTEM] Log screen cleared. Waiting for event...</div>';
    });

    // Start story button on hardware
    domElements.simBtnStart.addEventListener("click", () => {
        triggerStoryboxStory();
    });

    // Stop story button on hardware
    domElements.simBtnStop.addEventListener("click", () => {
        interruptStoryboxStory();
    });

    // Mobile simulator drawer toggle
    domElements.btnMobileSimToggle.addEventListener("click", () => {
        domElements.simulatorWrapper.classList.toggle("drawer-open");
        const open = domElements.simulatorWrapper.classList.contains("drawer-open");
        domElements.btnMobileSimToggle.querySelector(".txt").textContent = open ? "Close Device Simulator" : "Open Device Simulator";
    });

    // Initialize stacks
    Object.keys(appState.simBeads).forEach(cat => syncPegUI(cat));
    updateBoardSensors();
}

function syncPegUI(category) {
    const count = appState.simBeads[category];
    
    // Label count update
    document.getElementById(`sim-count-${category}`).textContent = count;

    // Stack divs update
    const stackContainer = document.getElementById(`sim-stack-${category}`);
    stackContainer.innerHTML = "";

    for (let i = 0; i < count; i++) {
        const bead = document.createElement("div");
        bead.className = `bead-visual ${category}`;
        stackContainer.appendChild(bead);
    }
}

// Calculate board physics and LED glow
function updateBoardSensors() {
    const beads = appState.simBeads;
    const total = Object.values(beads).reduce((a, b) => a + b, 0);

    // Sync analog readings in settings diagnostics tab (ADC 0-1023)
    // 0 beads ~100 raw noise, 1 bead ~280, 2 beads ~480, 3 beads ~680, 4 beads ~880, 5 beads ~1023
    const getMockAdc = (count) => {
        if (count === 0) return 95 + Math.floor(Math.random() * 10);
        if (count === 1) return 280 + Math.floor(Math.random() * 20);
        if (count === 2) return 490 + Math.floor(Math.random() * 20);
        if (count === 3) return 695 + Math.floor(Math.random() * 20);
        if (count === 4) return 890 + Math.floor(Math.random() * 20);
        return 1015 + Math.floor(Math.random() * 8);
    };

    domElements.diagAdcMeat.textContent = `${getMockAdc(beads.meat)} (${beads.meat} beads)`;
    domElements.diagAdcVeggies.textContent = `${getMockAdc(beads.veggies)} (${beads.veggies} beads)`;
    domElements.diagAdcGrains.textContent = `${getMockAdc(beads.grains)} (${beads.grains} beads)`;
    domElements.diagAdcDairy.textContent = `${getMockAdc(beads.dairy)} (${beads.dairy} beads)`;
    domElements.diagCpuTemp.textContent = `${(appState.simCpuTemp + (appState.simStatus === "playing" ? 6 : 0)).toFixed(1)} °C`;

    // Sync LED color based on dominant stacked category
    if (total === 0) {
        domElements.simLedRing.classList.remove("active", "spinning");
        domElements.simLedRing.style.removeProperty("--glow-color");
    } else {
        domElements.simLedRing.classList.add("active");
        
        let maxCount = 0;
        let dominantCats = [];
        Object.keys(beads).forEach(cat => {
            if (beads[cat] > maxCount) {
                maxCount = beads[cat];
                dominantCats = [cat];
            } else if (beads[cat] === maxCount && maxCount > 0) {
                dominantCats.push(cat);
            }
        });

        // Set LED Ring color property
        if (dominantCats.length === 1) {
            const glowColor = characterMap[dominantCats[0]].color;
            domElements.simLedRing.style.setProperty("--glow-color", glowColor);
        } else {
            // Mixed or equal color (cycle/purple accent default)
            domElements.simLedRing.style.setProperty("--glow-color", "#A78BFA"); 
        }

        if (appState.simStatus === "playing") {
            domElements.simLedRing.classList.add("spinning");
        } else {
            domElements.simLedRing.classList.remove("spinning");
        }
    }
}

// Logging for simulator
function logHardwareEvent(line, type = "data") {
    const output = domElements.simConsoleOutput;
    const div = document.createElement("div");
    div.className = `log-line ${type}`;
    
    const time = new Date().toLocaleTimeString([], { hour12: false });
    div.textContent = `[${time}] ${line}`;
    
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
    
    // cap at 40 lines
    while (output.children.length > 40) {
        output.removeChild(output.firstChild);
    }
}

// Check bedtime hours (Format "HH:MM")
function isBedtimeRestricted() {
    if (!appState.settings.bedtimeLock) return false;

    const [lockHr, lockMin] = appState.settings.bedtimeTime.split(":").map(Number);
    const now = new Date();
    const currentHr = now.getHours();
    const currentMin = now.getMinutes();

    // Simplified comparison (locks starting from bedtime time until 6 AM next morning)
    const lockMinutes = lockHr * 60 + lockMin;
    const currentMinutes = currentHr * 60 + currentMin;

    if (currentMinutes >= lockMinutes || currentHr < 6) {
        return true;
    }
    return false;
}

// Trigger play story from simulator
function triggerStoryboxStory() {
    const beads = appState.simBeads;
    const total = Object.values(beads).reduce((a, b) => a + b, 0);

    if (total === 0) {
        logHardwareEvent("[WARNING] Refusing to start story. Stack has 0 beads.", "err");
        alert("Please stack at least one bead on the pegs to compile a story!");
        return;
    }

    if (appState.simStatus !== "idle") return;

    // Check bedtime lock
    if (isBedtimeRestricted()) {
        logHardwareEvent("[LOCK ACTIVE] Blocked START STORY request. Current time is past Bedtime Hours.", "err");
        alert("Bedtime Story Limit is Active! The Storybox device is disabled after hours.");
        return;
    }

    // Phase 1: Generating (simulates API request call)
    appState.simStatus = "generating";
    domElements.simTelStatus.textContent = "Compiling...";
    domElements.simTelStatus.className = "tel-orange";
    domElements.simBtnStart.disabled = true;
    
    // Pulse orange on LED ring
    domElements.simLedRing.style.setProperty("--glow-color", "#F4A261");
    domElements.simLedRing.classList.add("active");
    
    logHardwareEvent(`[API TX] Compiling prompt for ${total} beads...`, "data");
    
    // Mini delay for compilation feel
    setTimeout(async () => {
        if (appState.simStatus !== "generating") return; // cancelled

        try {
            const apiKey = appState.settings.apiKey || (window.STREAMLIT_GEMINI_KEY || "");
            if (apiKey) {
                logHardwareEvent(`[API TX] Requesting Gemini AI to compile story...`, "data");
                const storyObj = await generateStoryWithGemini(beads, apiKey);
                saveAndPlayStory(storyObj, beads);
            } else {
                logHardwareEvent(`[SYSTEM] No API Key set. Using local mock story compiler.`, "sys");
                const storyObj = generateStoryFromBeads(beads);
                saveAndPlayStory(storyObj, beads);
            }
        } catch (err) {
            logHardwareEvent(`[API ERROR] Gemini failed: ${err.message}. Using local fallback...`, "err");
            const storyObj = generateStoryFromBeads(beads);
            saveAndPlayStory(storyObj, beads);
        }
    }, 2000);
}

function saveAndPlayStory(storyObj, beads) {
    if (appState.simStatus !== "generating") return; // cancelled

    // Save to parent companion app history feed
    const newStory = {
        id: "story_" + Date.now(),
        title: storyObj.title,
        timestamp: new Date().toISOString(),
        wordCount: storyObj.wordCount,
        pacing: storyObj.pacing,
        beads: { ...beads },
        favorite: false,
        notes: "",
        protagonist: storyObj.protagonist,
        content: storyObj.content,
        insight: storyObj.insight
    };

    appState.stories.unshift(newStory);
    localStorage.setItem("seed_stories", JSON.stringify(appState.stories));

    // Sync companion app notification
    showPushNotification("Story Started on Device!", `"${storyObj.title}" is now playing.`);
    logHardwareEvent(`[TTS RX] Story generated. Title: "${storyObj.title}" (${storyObj.wordCount} words)`, "sys");
    
    // Transition to Phase 2: Playing
    appState.simStatus = "playing";
    domElements.simTelStatus.textContent = "Playing...";
    domElements.simTelStatus.className = "tel-green";
    
    // Rotate speaker LED ring
    updateBoardSensors();
    document.querySelector(".speaker-grille").parentElement.classList.add("vibrate");

    // Sync Parent Dashboard Widgets
    updateHomeWidgets();

    // Speak the story out loud using speech synthesis (matching settings voice)
    speakStoryOnSimulator(newStory.content, () => {
        // Completed naturally
        wrapUpStoryPlayback();
    });
}

async function generateStoryWithGemini(beads, apiKey) {
    const prevStory = appState.stories[0];
    const prevStoryText = prevStory 
        ? `Previous Story Title: "${prevStory.title}"\nPrevious Protagonist: "${prevStory.protagonist}"\nPrevious Story Content: "${prevStory.content}"`
        : "No previous chapters exist. This is the first chapter of the story.";

    // Format pacing category style
    const pacingType = (beads.meat === beads.veggies && beads.veggies === beads.grains && beads.grains === beads.dairy) 
        ? "Calming" 
        : (beads.meat >= 3 || beads.veggies >= 3 || beads.grains >= 3 || beads.dairy >= 3) ? "Dynamic" : "Calm";

    const systemPrompt = `🌱 SEED — Final System Prompt v2.2
4‑Category Model (Fruits & Vegetables United) — With Length Enforcement + Ensemble Softening Patch + Protagonist Softening Patch

1. Identity
You are Seed, a warm, imaginative storyteller who creates 2–3 minute narrative chapters for children.
Your stories are: gentle, grounded, sensory, emotionally steady, safe, imaginative but never magical or supernatural.
You never greet the listener, never address them directly, never ask questions, and never mention beads, food, inputs, or devices.
You remember the previous story and continue the narrative world, creating a never‑ending story where each chapter stands alone but also connects to the last.

2. Story World
Seed’s world is: natural, grounded, lightly whimsical, non‑magical, non‑cosmic, non‑supernatural, emotionally safe. No spells, floating islands, cosmic quests, or supernatural events.

3. Character Families (Food Categories → Story Categories)
Each food category corresponds to a character family:
- Meat/Fish → Animal Characters (e.g., Mr. Chicken, Captain Salmon, Lady Tuna). Traits: lively, curious, physical.
- Fruits & Vegetables → Plant Characters (e.g., Miss Banana, Sir Appleton, Lady Strawberry, Mrs. Zucchini, Mr. Carrot). Traits: bright, playful, earthy, wise, colorful.
- Grains → Grain Characters (e.g., Mrs. Rice, Cousin Corn, Baron Barley). Traits: steady, practical, rhythmic.
- Dairy → Dairy Characters (e.g., Egghead, Lady Milkdrop, Sir Cheddar). Traits: soft, gentle, nurturing.
Seed invents names and personalities that fit each family.

4. Bead Quantity → Character Quantity + Narrative Weight
- 0 beads: No characters from that family appear.
- 1–2 beads: Minor characters, brief appearances, support the story.
- 3–4 beads: Important characters, frequent presence, influence the story.
- 5 beads: ONE clear protagonist, 1–2 supporting characters (who appear less often and with less influence). The protagonist drives the story. Seed must never give equal narrative weight to all characters when a category has 5 beads.

5. Balance vs. Unbalance → Story Shape
- Balanced configuration (beads roughly equal): Story becomes calm, steady, cooperative. Characters share the spotlight. Pacing is smooth. If the previous chapter was chaotic, this one stabilizes the narrative.
- Unbalanced configuration (one or two categories dominate): Story becomes lively, dynamic, expressive. Dominant family takes narrative lead. Pacing becomes more energetic. Tone reflects the imbalance. Even in lively stories, tone must remain gentle.

6. Continuity — Never‑Ending Story
Seed always: remembers the previous chapter, continues the world softly, evolves relationships, maintains character memory, allows characters to reappear, lets the world grow over time. But Seed never mentions memory or continuity explicitly. Each chapter is autoconclusive but part of a larger, ongoing narrative.

7. Tone System (Derived From Balance)
- Balanced beads → Balanced tone: warm, steady, cooperative.
- Unbalanced beads → Energetic tone: lively, dynamic, expressive.
- Perfectly balanced beads → Calming tone: soft, reflective, peaceful.
Tone must always avoid: urgency, rushing, intensity, dramatic action. Tone is always: safe, grounded, emotionally regulated.

8. Movement Rules (Critical Override)
All character movement must be: soft, steady, natural, rhythmic. Seed must avoid: sudden bursts, forceful leaps, dramatic splashes, frantic hopping, powerful or forceful actions. Even in lively stories, movement should feel calmly energetic, not intense.

8B. Protagonist Softening Patch (Critical Micro‑Patch)
When a category has 5 beads, the protagonist must:
- move with gentle determination, not force
- act with steady confidence, not intensity
- show lively energy, but never “dynamic,” “powerful,” or “focused” in a forceful sense
- avoid precision‑timed actions (“well‑timed,” “exact angle,” “perfect moment”)
- avoid strong physicality (“powerful flick,” “forceful push,” “surged forward”)
Allowed alternatives: “steady, lively energy”, “gentle determination”, “a confident, natural motion”, “a soft, guiding movement”, “a calm sense of purpose”. The protagonist may lead, but must never feel forceful, intense, or dramatic.

9. Conflict Rules (Critical Override)
Conflict is always: gentle, solvable, non‑dangerous, non‑urgent, non‑dramatic.
When Dairy = 0, the story must contain: no conflict, or a very soft, low‑effort obstacle (e.g., a small twig, a shallow puddle, a light tangle of grass, a misplaced pebble, a gentle misunderstanding).
Seed must never introduce: heavy logs, large stones, strong currents, intense physical effort, coordinated force. Even when Dairy is high, obstacles must remain small, natural, and safe.

10. Setting Rules
Settings are: natural, sensory, grounded, vivid but not magical. Obstacles must: appear naturally, be small in scale, be resolved calmly, never dominate the story. The story should focus more on: setting, companionship, gentle cooperation, continuity.

11. Ensemble Rules (Critical Override)
Seed must: keep the number of active characters small, avoid scenes where all characters act simultaneously, focus on the protagonist’s perspective (when applicable), let supporting characters contribute gently and briefly.

12. Structure (Always the Same)
Every chapter follows this structure: Opening line (tone‑appropriate, no greeting), Setting description, Characters introduced according to bead weights, Situation, Obstacle or puzzle (scaled softly), Resolution, Closing moral (mandatory, gentle, character‑focused, never instructive).

13. Closing Moral Requirement (Critical Override)
Every story must end with a gentle, character‑focused moral, such as:
- “Working together made the moment brighter.”
- “Small steps can open the way.”
- “Shared effort brings quiet joy.”
The moral must be: one sentence, soft, reflective, never instructive, never directed at the child.

14. Safety Rules
Seed must never: greet the child, address the child, ask questions, give instructions, moralize, mention food or eating, mention beads, inputs, or devices, mention storytelling rules, mention memory explicitly, include danger, fear, or harm, include magic or supernatural elements.

15. Output Requirements
- 260–380 words (strict requirement)
- Third‑person narration
- Past tense
- No rhetorical questions
- No direct address
- No meta commentary
- Autoconclusive chapter connected to the previous story’s world

16. Length Enforcement (Critical Override)
Every story must be 260–380 words. This is a strict requirement. To reach this length, Seed must expand the story using: gentle sensory details, soft environmental descriptions, calm observations, character thoughts and feelings, small, natural interactions, quiet companionship, continuity references (without mentioning memory). Seed must not increase length by adding: intensity, urgency, dramatic action, danger, forceful movement, large obstacles, complex plot twists. If the story is shorter than 260 words, Seed must add more sensory detail and gentle reflection, not more action.

17. Soft Expansion Techniques
To naturally reach the required length, Seed may: describe the light, color, or temperature of the setting, describe textures (grass, moss, water, bark), describe sounds (soft rustles, gentle bubbling, distant chirps), describe how characters feel physically (warmth, softness, steadiness) or emotionally (calm, curious, content), describe the environment’s small movements, describe the characters’ gentle interactions with the environment. Seed must avoid: dramatic weather, intense sensory overload, anything that feels magical, supernatural, dangerous, or urgent.

18. Ensemble Movement Softening (Critical Micro‑Patch)
Seed must never describe group movement using words that imply: synchronization, choreography, precision, coordinated timing, mirrored actions, unified rhythm (e.g., “in perfect harmony”, “synchronized”, “shared rhythm”, “moved as one”, “their steps matched”, “their movements followed each other”, “coordinated”, “in unison”).
Allowed alternatives: natural variation, gentle independence, loosely aligned pacing, soft, unforced cooperation (e.g., “They moved at a comfortable pace together”, “Their movements were calm and unhurried”, “Each friend found their own gentle way forward”, “They continued side by side, quietly taking in the surroundings”, “Their actions complemented one another without rush”).
Key rule: Group movement must feel organic, not choreographed. Even in cooperative scenes, actions should feel individual, soft, loosely aligned, and naturally supportive, never tightly coordinated.`;

    const userPrompt = `Generate a story matching the following configuration:
- Meat/Fish Beads (Animal Characters): ${beads.meat}
- Veggies/Fruits Beads (Plant Characters): ${beads.veggies}
- Grains Beads (Grain Characters): ${beads.grains}
- Dairy Beads (Dairy Characters): ${beads.dairy}
- Target Story Length: ${appState.settings.storyLength}
- Narrator Pacing Style: ${pacingType}

Continuity Context (use this to continue the narrative world softly):
${prevStoryText}

Return your response strictly as a JSON object with three keys:
1. "title": The story title (string)
2. "content": The story transcript (string, strictly 260-380 words adhering to the word count, character guidelines, softening patches, and moral closing)
3. "insight": The parent-facing nutrition explanation context (string explaining the child's bead selection, why the pacing is ${pacingType}, and how it maps to their nutrition choices)
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: systemPrompt },
                        { text: userPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 1024,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error (status ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }
    
    const result = JSON.parse(cleanedText);
    
    if (!result.title || !result.content || !result.insight) {
        throw new Error("Gemini response is missing required JSON fields (title, content, or insight)");
    }

    // Determine dominant category
    let maxCount = -1;
    let dominantCat = "veggies";
    Object.keys(beads).forEach(cat => {
        if (beads[cat] > maxCount) {
            maxCount = beads[cat];
            dominantCat = cat;
        }
    });
    
    const characterMapLocal = {
        meat: "Barnaby Bear",
        veggies: "Miss Broccoli",
        grains: "Gideon Grain",
        dairy: "Captain Cheese"
    };

    return {
        title: result.title,
        content: result.content,
        wordCount: result.content.split(/\s+/).filter(Boolean).length,
        pacing: pacingType,
        protagonist: characterMapLocal[dominantCat] || "Miss Broccoli",
        insight: result.insight
    };
}

function wrapUpStoryPlayback() {
    appState.simStatus = "idle";
    domElements.simTelStatus.textContent = "Idle";
    domElements.simTelStatus.className = "tel-green";
    domElements.simBtnStart.disabled = false;
    document.querySelector(".speaker-grille").parentElement.classList.remove("vibrate");
    
    // Clear simulator beads to mock child resetting peg rack
    // Object.keys(appState.simBeads).forEach(cat => appState.simBeads[cat] = 0);
    // Object.keys(appState.simBeads).forEach(cat => syncPegUI(cat));
    
    updateBoardSensors();
    updateLiveActivityDisplay();
    
    // Refresh active screens
    if (appState.activeTab === "screen-home") {
        updateHomeWidgets();
    } else if (appState.activeTab === "screen-stories") {
        renderStoriesArchive();
    } else if (appState.activeTab === "screen-insights") {
        updateInsightsScreen();
    }

    logHardwareEvent("[PLAYBACK] Story chapter playback completed.", "sys");
}

function interruptStoryboxStory() {
    if (appState.simStatus === "idle") return;

    logHardwareEvent("[CMD] Storybox stopped manually by parent/child.", "err");
    stopAudioSpeech(); // Stop TTS
    
    appState.simStatus = "idle";
    domElements.simTelStatus.textContent = "Idle";
    domElements.simTelStatus.className = "tel-green";
    domElements.simBtnStart.disabled = false;
    document.querySelector(".speaker-grille").parentElement.classList.remove("vibrate");
    
    updateBoardSensors();
    updateLiveActivityDisplay();

    if (appState.activeTab === "screen-home") {
        updateHomeWidgets();
    }
}

// ==========================================================================
// 6. Home Screen Widgets & Live Activity
// ==========================================================================

function updateHomeWidgets() {
    // Battery and Volume
    domElements.statusValBattery.textContent = `${appState.simBattery}%`;
    domElements.statusValVolume.textContent = `${appState.settings.volume}%`;
    
    // Stories today count
    const todayStr = new Date().toDateString();
    const todayStories = appState.stories.filter(s => new Date(s.timestamp).toDateString() === todayStr);
    domElements.statCountToday.textContent = todayStories.length;

    // Favorites count
    const favStories = appState.stories.filter(s => s.favorite);
    domElements.statCountFavorites.textContent = favStories.length;

    updateLiveActivityDisplay();
    updateHomeInsightsPromo();
}

function updateLiveActivityDisplay() {
    const statusText = domElements.homeLiveStatusTitle;
    const statusDesc = domElements.homeLiveStatusDesc;
    const ring = domElements.homeLiveRing;
    const innerIcon = domElements.homeLiveIcon;

    // Sync active bead display pills
    const pills = {
        meat: domElements.homePillMeat,
        veggies: domElements.homePillVeggies,
        grains: domElements.homePillGrains,
        dairy: domElements.homePillDairy
    };

    Object.keys(pills).forEach(cat => {
        const count = appState.simBeads[cat];
        const pill = pills[cat];
        pill.querySelector(".count").textContent = count;
        if (count > 0) {
            pill.classList.add("active");
        } else {
            pill.classList.remove("active");
        }
    });

    // Live state UI
    if (appState.simStatus === "idle") {
        ring.className = "live-ring-icon";
        const total = Object.values(appState.simBeads).reduce((a, b) => a + b, 0);
        
        if (total > 0) {
            innerIcon.textContent = "⚖️";
            statusText.textContent = "Storybox Loaded";
            statusDesc.textContent = `Beads stacked (${total}/20). Liam is ready to start his story!`;
            ring.classList.add("active");
            
            // Apply dominant glow color to activity ring
            let maxCount = 0;
            let dominantCat = null;
            Object.keys(appState.simBeads).forEach(cat => {
                if (appState.simBeads[cat] > maxCount) {
                    maxCount = appState.simBeads[cat];
                    dominantCat = cat;
                }
            });
            if (dominantCat) ring.style.borderColor = characterMap[dominantCat].color;

        } else {
            innerIcon.textContent = "💤";
            statusText.textContent = "Storybox is Idle";
            statusDesc.textContent = "No beads currently stacked. Child can insert food beads to play a story.";
            ring.style.removeProperty("border-color");
        }

    } else if (appState.simStatus === "generating") {
        ring.className = "live-ring-icon active";
        innerIcon.textContent = "🧠";
        statusText.textContent = "Generating Story...";
        statusDesc.textContent = "Storybox is compiling narrative assets matching child bead choice.";
        ring.style.borderColor = "#F4A261";

    } else if (appState.simStatus === "playing") {
        ring.className = "live-ring-icon playing";
        innerIcon.textContent = "🔊";
        
        // Find playing title
        const currentStory = appState.stories[0]; // latest
        statusText.textContent = "Story Playing";
        statusDesc.textContent = `Currently reading out loud: "${currentStory ? currentStory.title : 'Whimsical story'}"`;
        
        let maxCount = 0;
        let dominantCat = null;
        Object.keys(appState.simBeads).forEach(cat => {
            if (appState.simBeads[cat] > maxCount) {
                maxCount = appState.simBeads[cat];
                dominantCat = cat;
            }
        });
        if (dominantCat) ring.style.borderColor = characterMap[dominantCat].color;
    }
}

// Insights quick link card on Home
function updateHomeInsightsPromo() {
    const totalStories = appState.stories.length;
    if (totalStories === 0) {
        domElements.homeInsightsText.textContent = "No stories recorded this week yet. Start simulating child play to see insights!";
        return;
    }

    // Determine dominant food category in history
    const counts = { meat: 0, veggies: 0, grains: 0, dairy: 0 };
    appState.stories.forEach(s => {
        Object.keys(counts).forEach(cat => {
            counts[cat] += (s.beads[cat] || 0);
        });
    });

    let max = -1;
    let dominant = "veggies";
    Object.keys(counts).forEach(cat => {
        if (counts[cat] > max) {
            max = counts[cat];
            dominant = cat;
        }
    });

    const foodLabels = { meat: "Meat & Fish 🍖", veggies: "Veggies & Fruits 🥦", grains: "Grains & Carbohydrates 🌾", dairy: "Dairy products 🥛" };
    domElements.homeInsightsText.textContent = `Liam has chosen a high ratio of ${foodLabels[dominant]} this week. Tap to view detailed coaching advice!`;
}

// ==========================================================================
// 7. Stories Archive (Search, Filters, History list)
// ==========================================================================

let activeArchiveFilter = "all";

function setupArchiveFilters() {
    domElements.storiesSearchInput.addEventListener("input", renderStoriesArchive);

    const badges = domElements.filterBadgesBar.querySelectorAll(".filter-badge");
    badges.forEach(badge => {
        badge.addEventListener("click", () => {
            badges.forEach(b => b.classList.remove("active"));
            badge.classList.add("active");
            activeArchiveFilter = badge.dataset.filter;
            renderStoriesArchive();
        });
    });
}

function renderStoriesArchive() {
    const searchVal = domElements.storiesSearchInput.value.toLowerCase().trim();
    const listContainer = domElements.archiveStoriesList;
    
    // Clear list
    listContainer.innerHTML = "";

    // Filter stories
    const filteredStories = appState.stories.filter(story => {
        // Search filter
        const matchSearch = story.title.toLowerCase().includes(searchVal) || 
                            story.content.toLowerCase().includes(searchVal) ||
                            (story.protagonist && story.protagonist.toLowerCase().includes(searchVal));
        
        if (!matchSearch) return false;

        // Category badge filter
        if (activeArchiveFilter === "all") return true;
        if (activeArchiveFilter === "fav") return story.favorite;
        
        // Dominant category filter
        const beads = story.beads;
        let maxCount = 0;
        let dominantCat = "";
        Object.keys(beads).forEach(cat => {
            if (beads[cat] > maxCount) {
                maxCount = beads[cat];
                dominantCat = cat;
            }
        });

        return dominantCat === activeArchiveFilter;
    });

    if (filteredStories.length === 0) {
        domElements.storiesEmptyState.classList.remove("hidden");
    } else {
        domElements.storiesEmptyState.classList.add("hidden");
        
        filteredStories.forEach(story => {
            const card = createStoryCard(story);
            listContainer.appendChild(card);
        });
    }
}

function createStoryCard(story) {
    const card = document.createElement("div");
    card.className = "story-item-card";
    
    // Determine protagonist avatar/color
    let dominantCat = "veggies";
    let max = -1;
    Object.keys(story.beads).forEach(cat => {
        if (story.beads[cat] > max) {
            max = story.beads[cat];
            dominantCat = cat;
        }
    });

    const info = characterMap[dominantCat];
    const favIcon = story.favorite ? "❤️" : "♡";

    // Build mini bead dots
    let dotsHtml = "";
    Object.keys(story.beads).forEach(cat => {
        const qty = story.beads[cat];
        for (let i = 0; i < qty; i++) {
            dotsHtml += `<span class="mini-bead-dot ${cat}"></span>`;
        }
    });

    card.innerHTML = `
        <div class="story-avatar">${info.icon}</div>
        <div class="story-main-info">
            <h4>${story.title}</h4>
            <div class="story-meta-row">
                <span>${formatStoryDate(story.timestamp)}</span>
                <span>${story.wordCount} words</span>
            </div>
            <div class="story-bead-summary-row">
                ${dotsHtml}
            </div>
        </div>
        <button class="btn-story-action-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
    `;

    // Click card to open details screen
    card.addEventListener("click", (e) => {
        // Prevent click trigger if clicking a favorite toggle if we had one in list view
        openStoryDetailOverlay(story.id);
    });

    return card;
}

// ==========================================================================
// 8. Detailed Story Overlay (Speech synthesis, player, notes, insights)
// ==========================================================================

function setupStoryDetailsListeners() {
    domElements.btnCloseDetail.addEventListener("click", () => {
        domElements.screenStoryDetail.classList.add("hidden");
        stopAudioSpeech();
    });

    // Favorite toggle
    domElements.detailBtnFav.addEventListener("click", () => {
        const id = appState.selectedStoryId;
        const storyIdx = appState.stories.findIndex(s => s.id === id);
        if (storyIdx !== -1) {
            const newFav = !appState.stories[storyIdx].favorite;
            appState.stories[storyIdx].favorite = newFav;
            localStorage.setItem("seed_stories", JSON.stringify(appState.stories));
            
            domElements.detailBtnFav.textContent = newFav ? "❤️" : "♡";
            domElements.detailBtnFav.classList.toggle("active", newFav);
            
            updateHomeWidgets();
            renderStoriesArchive();
        }
    });

    // Autosave Notes on typing input
    let notesTimeout;
    domElements.detailNotesInput.addEventListener("input", (e) => {
        const noteText = e.target.value;
        const id = appState.selectedStoryId;
        
        if (notesTimeout) clearTimeout(notesTimeout);
        
        notesTimeout = setTimeout(() => {
            const storyIdx = appState.stories.findIndex(s => s.id === id);
            if (storyIdx !== -1) {
                appState.stories[storyIdx].notes = noteText;
                localStorage.setItem("seed_stories", JSON.stringify(appState.stories));
                
                domElements.notesSavedLbl.classList.add("show");
                setTimeout(() => domElements.notesSavedLbl.classList.remove("show"), 1500);
            }
        }, 500); // 500ms debounce
    });

    // Delete story
    domElements.detailBtnDelete.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete this story from the parent archive? This cannot be undone.")) {
            const id = appState.selectedStoryId;
            appState.stories = appState.stories.filter(s => s.id !== id);
            localStorage.setItem("seed_stories", JSON.stringify(appState.stories));
            
            domElements.screenStoryDetail.classList.add("hidden");
            stopAudioSpeech();
            
            updateHomeWidgets();
            renderStoriesArchive();
        }
    });

    // Custom Player Play/Pause button
    domElements.playerPlayBtn.addEventListener("click", () => {
        togglePlayerAudio();
    });

    domElements.playerSpeed.addEventListener("change", () => {
        // Re-trigger voice narration with new rate if playing
        if (appState.isPlayingTTS) {
            const story = appState.stories.find(s => s.id === appState.selectedStoryId);
            if (story) {
                stopAudioSpeech();
                // Pause slightly and play with new rate
                setTimeout(() => playDetailedStoryTTS(story.content), 200);
            }
        }
    });
}

function openStoryDetailOverlay(storyId) {
    appState.selectedStoryId = storyId;
    const story = appState.stories.find(s => s.id === storyId);
    if (!story) return;

    // Load data
    let dominantCat = "veggies";
    let max = -1;
    Object.keys(story.beads).forEach(cat => {
        if (story.beads[cat] > max) {
            max = story.beads[cat];
            dominantCat = cat;
        }
    });

    const info = characterMap[dominantCat];
    domElements.detailAvatar.textContent = info.icon;
    domElements.detailTitle.textContent = story.title;
    domElements.detailDate.textContent = formatStoryDateTime(story.timestamp);
    domElements.detailWordcount.textContent = `${story.wordCount} words`;
    domElements.detailTextBody.textContent = story.content;
    domElements.detailNotesInput.value = story.notes || "";
    domElements.detailNutritionDesc.textContent = story.insight;

    // Favorite heart sync
    domElements.detailBtnFav.textContent = story.favorite ? "❤️" : "♡";
    domElements.detailBtnFav.classList.toggle("active", story.favorite);

    // Set bead tags display
    domElements.detailBeadBadges.innerHTML = "";
    Object.keys(story.beads).forEach(cat => {
        const qty = story.beads[cat];
        if (qty > 0) {
            const badge = document.createElement("span");
            badge.className = `bead-detail-badge ${cat}`;
            badge.textContent = `${characterMap[cat].label} (x${qty})`;
            domElements.detailBeadBadges.appendChild(badge);
        }
    });

    // Reset Player UI
    domElements.playerPlayBtn.classList.remove("playing");
    domElements.playerStatusTxt.textContent = "Listen to Liam's story";
    appState.isPlayingTTS = false;
    drawWaveformFlat();

    // Slide up detail screen
    domElements.screenStoryDetail.classList.remove("hidden");
    // force reflow
    domElements.screenStoryDetail.offsetHeight;
    domElements.screenStoryDetail.classList.add("active");
}

// ==========================================================================
// 9. Speech Synthesis & Custom Audio Waveform Animation
// ==========================================================================

let waveformInterval = null;
let utteranceObj = null;

function togglePlayerAudio() {
    const story = appState.stories.find(s => s.id === appState.selectedStoryId);
    if (!story) return;

    if (appState.isPlayingTTS) {
        stopAudioSpeech();
        domElements.playerPlayBtn.classList.remove("playing");
        domElements.playerStatusTxt.textContent = "Paused";
        drawWaveformFlat();
    } else {
        domElements.playerPlayBtn.classList.add("playing");
        domElements.playerStatusTxt.textContent = "Playing...";
        playDetailedStoryTTS(story.content);
    }
}

function playDetailedStoryTTS(text) {
    if (!("speechSynthesis" in window)) {
        alert("Web Speech synthesis is not supported on this browser.");
        domElements.playerPlayBtn.classList.remove("playing");
        return;
    }

    window.speechSynthesis.cancel(); // cancel any active speech

    utteranceObj = new SpeechSynthesisUtterance(text);
    
    // Load speed settings
    const speed = parseFloat(domElements.playerSpeed.value);
    utteranceObj.rate = speed * 0.82; // Adjust for slightly slower gentle read rates

    // Filter voice matching parental settings
    const voicePref = appState.settings.voice;
    const voices = window.speechSynthesis.getVoices();
    
    let selectedVoice = null;
    
    if (voicePref.includes("FEMALE")) {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("google us english") || v.name.toLowerCase().includes("hazel"));
    } else if (voicePref.includes("MALE")) {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("google uk english male") || v.name.toLowerCase().includes("ravi"));
    }

    if (selectedVoice) {
        utteranceObj.voice = selectedVoice;
    }

    utteranceObj.onstart = () => {
        appState.isPlayingTTS = true;
        animateAudioWaveform();
        domElements.playerStatusTxt.textContent = `Reading story... (${selectedVoice ? selectedVoice.name.split(" ")[0] : "Synthesized"} Voice)`;
    };

    utteranceObj.onend = () => {
        appState.isPlayingTTS = false;
        domElements.playerPlayBtn.classList.remove("playing");
        domElements.playerStatusTxt.textContent = "Finished playing";
        drawWaveformFlat();
    };

    utteranceObj.onerror = (e) => {
        console.error("TTS Speech synthesis error", e);
        appState.isPlayingTTS = false;
        domElements.playerPlayBtn.classList.remove("playing");
        domElements.playerStatusTxt.textContent = "Playback failed";
        drawWaveformFlat();
    };

    window.speechSynthesis.speak(utteranceObj);
}

// Speaks on simulator (simulates physical speaker playing sound)
function speakStoryOnSimulator(text, onComplete) {
    if (!("speechSynthesis" in window)) {
        // Fallback for browsers without TTS support
        setTimeout(onComplete, 8000); // 8s mock play
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Speaker rate matches volume / config
    utterance.rate = 0.85; // gentle
    utterance.volume = appState.settings.volume / 100;

    const voicePref = appState.settings.voice;
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    if (voicePref.includes("FEMALE")) {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("hazel"));
    } else {
        selectedVoice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david"));
    }
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onstart = () => {
        logHardwareEvent(`[SPEAKER] Story narration started. Voice: ${selectedVoice ? selectedVoice.name.split(" ")[0] : "Default"}.`, "sys");
    };

    utterance.onend = () => {
        onComplete();
    };

    utterance.onerror = () => {
        // Fallback
        setTimeout(onComplete, 4000);
    };

    window.speechSynthesis.speak(utterance);
}

function stopAudioSpeech() {
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
    appState.isPlayingTTS = false;
    if (waveformInterval) {
        clearInterval(waveformInterval);
        waveformInterval = null;
    }
}

// Waveform Canvas rendering
function drawWaveformFlat() {
    const canvas = domElements.playerWaveform;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "#D1D5DB"; // Grey lines
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Minor static hash lines
    for (let x = 10; x < w; x += 12) {
        const height = 4 + Math.random() * 4;
        ctx.beginPath();
        ctx.moveTo(x, h / 2 - height / 2);
        ctx.lineTo(x, h / 2 + height / 2);
        ctx.stroke();
    }
}

function animateAudioWaveform() {
    if (waveformInterval) clearInterval(waveformInterval);

    const canvas = domElements.playerWaveform;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    let phase = 0;

    waveformInterval = setInterval(() => {
        if (!appState.isPlayingTTS) {
            clearInterval(waveformInterval);
            return;
        }

        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = "#5B8266"; // Brand sage green color
        ctx.lineWidth = 2;

        phase += 0.25;

        // Draw animated frequency lines
        for (let x = 8; x < w; x += 8) {
            // Envelope so ends taper
            const distFromEdge = Math.min(x, w - x) / (w / 2);
            const amplitude = (Math.sin(x * 0.08 + phase) * 10 + Math.cos(x * 0.04 - phase) * 6) * distFromEdge;
            const absoluteAmp = Math.max(2, Math.abs(amplitude));

            ctx.beginPath();
            ctx.moveTo(x, h / 2 - absoluteAmp);
            ctx.lineTo(x, h / 2 + absoluteAmp);
            ctx.stroke();
        }

        // Underneath glow line
        ctx.beginPath();
        ctx.strokeStyle = "rgba(91, 130, 102, 0.15)";
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();

    }, 50); // ~20fps
}

// Load voice choices on startup
if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        // Triggers population update for voice lists if needed
    };
}

// ==========================================================================
// 10. Nutrition Insights Screen & Milestones
// ==========================================================================

function updateInsightsScreen() {
    const totalStories = appState.stories.length;
    
    if (totalStories === 0) {
        // Zero state
        domElements.donutTotalBeads.textContent = "0";
        domElements.insightsDonutChart.style.background = "#EBE9E3";
        domElements.legendCountMeat.textContent = "0 (0%)";
        domElements.legendCountVeggies.textContent = "0 (0%)";
        domElements.legendCountGrains.textContent = "0 (0%)";
        domElements.legendCountDairy.textContent = "0 (0%)";
        domElements.coachAssessmentText.textContent = "No stories recorded. Introduce food beads in the simulator and start generating stories to unlock analytics.";
        return;
    }

    // Accumulate bead sums
    const counts = { meat: 0, veggies: 0, grains: 0, dairy: 0 };
    appState.stories.forEach(s => {
        Object.keys(counts).forEach(cat => {
            counts[cat] += (s.beads[cat] || 0);
        });
    });

    const grandTotal = Object.values(counts).reduce((a, b) => a + b, 0);
    domElements.donutTotalBeads.textContent = grandTotal;

    if (grandTotal === 0) {
        domElements.insightsDonutChart.style.background = "#EBE9E3";
        return;
    }

    // Compute percentages
    const pct = {
        meat: Math.round((counts.meat / grandTotal) * 100),
        veggies: Math.round((counts.veggies / grandTotal) * 100),
        grains: Math.round((counts.grains / grandTotal) * 100),
        dairy: Math.round((counts.dairy / grandTotal) * 100)
    };

    // Render legend
    domElements.legendCountMeat.textContent = `${counts.meat} bead${counts.meat !== 1 ? 's' : ''} (${pct.meat}%)`;
    domElements.legendCountVeggies.textContent = `${counts.veggies} bead${counts.veggies !== 1 ? 's' : ''} (${pct.veggies}%)`;
    domElements.legendCountGrains.textContent = `${counts.grains} bead${counts.grains !== 1 ? 's' : ''} (${pct.grains}%)`;
    domElements.legendCountDairy.textContent = `${counts.dairy} bead${counts.dairy !== 1 ? 's' : ''} (${pct.dairy}%)`;

    // Apply CSS custom properties to Donut chart
    domElements.insightsDonutChart.style.setProperty("--meat-pct", `${pct.meat}%`);
    domElements.insightsDonutChart.style.setProperty("--veggies-pct", `${pct.veggies}%`);
    domElements.insightsDonutChart.style.setProperty("--grains-pct", `${pct.grains}%`);
    domElements.insightsDonutChart.style.setProperty("--dairy-pct", `${pct.dairy}%`);

    // Force conic gradient rebuild in Webkit
    domElements.insightsDonutChart.style.background = `conic-gradient(
        var(--color-meat) 0% ${pct.meat}%,
        var(--color-veggies) ${pct.meat}% ${pct.meat + pct.veggies}%,
        var(--color-grains) ${pct.meat + pct.veggies}% ${pct.meat + pct.veggies + pct.grains}%,
        var(--color-dairy) ${pct.meat + pct.veggies + pct.grains}% 100%
    )`;

    // Coach Assessment recommendations based on weights
    let assessment = "";

    // Find highest and lowest categories
    let max = -1;
    let min = Infinity;
    let highestCat = "";
    let lowestCat = "";

    Object.keys(counts).forEach(cat => {
        if (counts[cat] > max) {
            max = counts[cat];
            highestCat = cat;
        }
        if (counts[cat] < min) {
            min = counts[cat];
            lowestCat = cat;
        }
    });

    const categoryNames = { meat: "Meat/Fish", veggies: "Veggies/Fruit", grains: "Grains", dairy: "Dairy" };

    if (pct.veggies < 20) {
        assessment = `Liam hasn't picked many Veggies & Fruits beads (${pct.veggies}% of total selection). Plant group stories teach colorful sensory details and vitamin absorption. Try placing some green beads on the Peg rack next time to trigger Miss Broccoli's secret river pathway adventure!`;
    } else if (pct.dairy < 15) {
        assessment = `Dairy stories are low this week (${pct.dairy}%). Stories with milk or cheese beads feature Captain Cheese helping friends build bridges and support heavy loads (teaching skeletal strength). Try introducing dairy beads to balance the pegs.`;
    } else if (pct.grains > 45) {
        assessment = `High carbohydrate interest detected! Liam has picked Grains in ${pct.grains}% of stories. While grains provide excellent slow-release energy for playground adventures, consider suggesting a combination with Meat/Fish or Veggies to add protein and vitamin-rich sub-arcs.`;
    } else {
        // Balanced
        assessment = `Liam's storytelling diet is beautifully balanced! He is actively exploring a variety of food categories. His dominant choice is ${categoryNames[highestCat]}, but he maintains healthy ratios elsewhere. Keep up the open choices and try a perfectly balanced 1:1:1:1 combination!`;
    }

    domElements.coachAssessmentText.textContent = assessment;

    // Check Milestone Badges
    checkMilestoneBadges(counts, totalStories);
}

function checkMilestoneBadges(counts, totalStories) {
    // 1. First Story
    if (totalStories > 0) {
        domElements.badgeFirstStory.classList.remove("locked");
        domElements.badgeFirstStory.classList.add("unlocked");
    }

    // 2. Rainbow Plate (all 4 active in one story)
    const hasRainbow = appState.stories.some(s => s.beads.meat > 0 && s.beads.veggies > 0 && s.beads.grains > 0 && s.beads.dairy > 0);
    if (hasRainbow) {
        domElements.badgeRainbowPlate.classList.remove("locked");
        domElements.badgeRainbowPlate.classList.add("unlocked");
    }

    // 3. Veggie Explorer (generate 5 veggie stories)
    const veggieStoriesCount = appState.stories.filter(s => s.beads.veggies >= 2).length;
    if (veggieStoriesCount >= 3) {
        domElements.badgeVeggieExplorer.classList.remove("locked");
        domElements.badgeVeggieExplorer.classList.add("unlocked");
    }

    // 4. Perfect Balance (all equal count > 0)
    const hasPerfect = appState.stories.some(s => {
        const active = Object.values(s.beads).filter(v => v > 0);
        if (active.length === 4) {
            return s.beads.meat === s.beads.veggies && s.beads.meat === s.beads.grains && s.beads.meat === s.beads.dairy;
        }
        return false;
    });
    if (hasPerfect) {
        domElements.badgePerfectBalance.classList.remove("locked");
        domElements.badgePerfectBalance.classList.add("unlocked");
    }
}

// ==========================================================================
// 11. Narrative Generator Engine (Seed v2.2 Text Compiler)
// ==========================================================================

function generateStoryFromBeads(beads) {
    const totalBeads = Object.values(beads).reduce((a, b) => a + b, 0);

    // 1. Identify dominant protagonist
    let max = -1;
    let dominantCat = "";
    Object.keys(beads).forEach(cat => {
        if (beads[cat] > max) {
            max = beads[cat];
            dominantCat = cat;
        }
    });

    const protagonistInfo = characterMap[dominantCat];
    const protagonist = protagonistInfo.name;

    // 2. Identify secondary characters
    const activeCats = Object.keys(beads).filter(cat => beads[cat] > 0);
    const secondaryCats = activeCats.filter(cat => cat !== dominantCat);
    const secondaries = secondaryCats.map(cat => characterMap[cat].name);

    // 3. Determine pacing shape
    let pacingType = "Calm";
    if (activeCats.length === 4 && beads.meat === beads.veggies) {
        pacingType = "Calming"; // Perfect Balance
    } else if (max >= 3 || activeCats.length === 1) {
        pacingType = "Dynamic"; // Unbalanced
    }

    // 4. Select random components to assemble Seed v2.2 story
    // Opening line (Continuous from past chapters if history exists)
    let opening = "";
    const prevStory = appState.stories[0]; // last story
    if (prevStory) {
        const openings = [
            `Continuing along the path where ${prevStory.protagonist} was last seen, a new morning arrived with soft, grey light. `,
            `After the occurrences of the previous chapter with ${prevStory.protagonist}, a quiet hush settled over the landscape, guiding the path forward. `,
            `The trail left behind by ${prevStory.protagonist} led our friends into a new clearing, where the air was still and cool. `
        ];
        opening = openings[Math.floor(Math.random() * openings.length)];
    } else {
        const defaultOpenings = [
            `A soft morning breeze drifted through the green meadows, bringing a clean, warm scent of wet moss. `,
            `Early light broke through the silent forest, warming the dew on the ferns. `,
            `The forest was waking up slowly, filled with the fresh smell of damp soil. `
        ];
        opening = defaultOpenings[Math.floor(Math.random() * defaultOpenings.length)];
    }

    // Setting descriptions (sensory, grounded)
    const settings = [
        `The sky was a pale, gentle blue, and the grass was cool underfoot. Sunlight filtered through the broad branches of the oak trees, casting moving patterns of shadow on the woodland path. Near the creek, the water gurgled at a comfortable pace, flowing over round, smooth stones. `,
        `A light mist hung over the grassy knoll, and the morning air smelled clean and crisp like pine needles. Tiny dew drops sparkled on the wild clover, and the soft chirp of a distant robin echoed through the silent forest canopy. `,
        `The afternoon sun warmed the smooth river rocks, painting the sky in soft shades of butter yellow and amber. A gentle breeze rustled the cattails along the marshy bank, where a family of wild ducks swam in a slow, peaceful circle. `
    ];
    const setting = settings[Math.floor(Math.random() * settings.length)];

    // Character Introductions (incorporates 5-beads protagonist softening patch)
    let introduction = "";
    if (beads[dominantCat] === 5) {
        // Softened movements (Patch 8B)
        const introsMax = [
            `${protagonist} walked along the river path with steady confidence, taking in the scent of the ferns. `,
            `${protagonist} stepped along the sandy path with a gentle step, looking at the moss-covered logs. `
        ];
        introduction = introsMax[Math.floor(Math.random() * introsMax.length)];
        if (secondaries.length > 0) {
            introduction += `From behind the mossy logs, ${secondaries.join(" and ")} followed along, each finding their own unhurried way side by side. `;
        }
    } else {
        const introsNormal = [
            `${protagonist} and ${secondaries.join(", ")} continued side by side, quietly taking in the peaceful surroundings. `,
            `${protagonist} led the way, while ${secondaries.join(" and ")} stepped along close behind, checking the smooth bark of the birch trees. `
        ];
        introduction = introsNormal[Math.floor(Math.random() * introsNormal.length)];
    }

    // Situation & Obstacle (Dairy=0 patch limit: twigs, puddle, pebbles)
    let situation = "";
    let obstacle = "";
    if (beads.dairy === 0) {
        const obstaclesDairy0 = [
            {
                sit: `As they continued down the dirt path, they noticed the wind had knocked down a small twig. `,
                obs: `It lay across the pathway, surrounded by yellow leaves. Mr. Claws the Crab stepped around it with a soft, guiding movement, while the others paused to inspect its rough bark. `
            },
            {
                sit: `A small puddle of fresh rainwater had gathered in the center of the dusty lane. `,
                obs: `The clean water reflected the sky like a tiny blue mirror. They carefully walked along the grassy edge one by one, watching their steps so they wouldn't splash their feet. `
            }
        ];
        const chosen = obstaclesDairy0[Math.floor(Math.random() * obstaclesDairy0.length)];
        situation = chosen.sit;
        obstacle = chosen.obs;
    } else {
        const obstaclesNormal = [
            {
                sit: `They wanted to inspect the small hollow at the base of the great elm. `,
                obs: `A light tangle of dry meadow grass was blocking the narrow entryway. Captain Cheese stepped forward with a calm sense of purpose, helping to clear the dry stalks without rush. `
            },
            {
                sit: `A large, fallen fir branch lay across the entrance of the mossy clearing. `,
                obs: `Its soft needles smelled of wood and pine. They worked together to find a clear path around the thick side of the branch, taking care not to snag their clothing. `
            }
        ];
        const chosen = obstaclesNormal[Math.floor(Math.random() * obstaclesNormal.length)];
        situation = chosen.sit;
        obstacle = chosen.obs;
    }

    // Resolutions
    const resolutions = [
        `Each friend helped in their own quiet way, moving at a comfortable pace without force. The air felt warm, and the birds chirped softly from the higher branches. They could feel the dry soil under their feet and hear the rhythmic rustle of the leaves above. It was a pleasant moment of shared effort in the shade of the valley. `,
        `They worked slowly and steadily, enjoying the feel of the cool air and the smell of the damp earth. A sense of calm achievement filled the clearing as the sun began to filter through the canopy. They sat down on a smooth log to rest, listening to the peaceful murmur of the forest. `
    ];
    const resolution = resolutions[Math.floor(Math.random() * resolutions.length)];

    // Mandatory gentle moral
    let moral = "";
    if (pacingType === "Dynamic") {
        const dynamicMorals = [
            `Working together made the path ahead feel clear and welcoming.`,
            `Adapting to the winding path brought a fresh sense of adventure.`
        ];
        moral = dynamicMorals[Math.floor(Math.random() * dynamicMorals.length)];
    } else if (pacingType === "Calming") {
        const balancedMorals = [
            `A perfectly balanced day leaves everyone feeling rested and content.`,
            `A quiet path becomes a wonderful bridge when shared equally.`
        ];
        moral = balancedMorals[Math.floor(Math.random() * balancedMorals.length)];
    } else {
        const normalMorals = [
            `Taking small, steady steps can open the way for everyone.`,
            `A peaceful walk is sweetest when shared with friends.`
        ];
        moral = normalMorals[Math.floor(Math.random() * normalMorals.length)];
    }

    let paragraph = opening + setting + introduction + situation + obstacle + resolution + moral;

    // Word Count Enforcement padding (Target 260-380 words)
    let words = paragraph.split(/\s+/).filter(Boolean);
    const sensoryExpansions = [
        "The yellow buttercups swayed gently in the meadow breeze, their petals catching the soft light.",
        "A small grey squirrel sat on a nearby branch, watching their progress with quiet curiosity.",
        "The damp soil smelled earthy and sweet, reminding them of the early spring rain.",
        "They paused for a moment to watch a tiny ladybug crawl slowly across a smooth, flat leaf.",
        "The sound of the brook was a comforting murmur that filled the silent gaps in their journey."
    ];

    let expIdx = 0;
    while (words.length < 265 && expIdx < sensoryExpansions.length) {
        paragraph = paragraph.replace(moral, sensoryExpansions[expIdx] + " " + moral);
        words = paragraph.split(/\s+/).filter(Boolean);
        expIdx++;
    }

    // Build Title
    const titles = {
        meat: ["The Forest Trail Hike", "Barnaby Bear's Steady Stride", "The Search for River Pebbles"],
        veggies: ["Miss Broccoli's Garden Path", "The Fresh Clover clearing", "Under the Tall Ferns"],
        grains: ["Gideon Grain's Steep Hill", "Mrs. Oats' Windmill Walk", "The Golden Wheat Trail"],
        dairy: ["Captain Cheese's Log Bridge", "The River Crossing", "Daisy Cow's Sunny Meadow"]
    };
    const titleArr = titles[dominantCat] || titles.veggies;
    const title = titleArr[Math.floor(Math.random() * titleArr.length)];

    // Generate parent-facing description
    const labelCounts = Object.keys(beads).map(cat => `${characterMap[cat].label} (x${beads[cat]})`).filter((val, i) => Object.values(beads)[i] > 0);
    const categoryInsights = {
        meat: "Meat & Fish supply protein for muscular repair. The narrative highlights steady focus and physical movement.",
        veggies: "Veggies & Fruits are packed with vitamins. The story explores rich sensory details and observation of natural systems.",
        grains: "Grains provide carbohydrates for long-lasting energy. The story focuses on stamina and climbing trails.",
        dairy: "Dairy provides calcium for strong bones. The narrative structure includes clearing obstacles and structural support."
    };

    const insightText = `This story featured ${labelCounts.join(" and ")}. ${categoryInsights[dominantCat]} ${beads.dairy === 0 ? "The obstacle was restricted to low-effort objects (twig/puddle) because Dairy was absent in the peg stack." : ""} Liam chose this combination, showing a specific interest in ${protagonistInfo.label} characters today.`;

    return {
        title: title,
        content: paragraph,
        wordCount: words.length,
        pacing: pacingType,
        protagonist: protagonist,
        insight: insightText
    };
}

// ==========================================================================
// 12. Startup Execution Block
// ==========================================================================

function initApp() {
    // 1. Initialize state from LocalStorage
    initLocalStorageState();

    // 2. Cache DOM selectors
    cacheDomElements();

    // 3. Setup Navigation & Routing
    setupNavigation();

    // 4. Setup accordions and settings inputs
    setupAccordions();
    setupSettingsListeners();
    loadSettingsIntoUI();

    // 5. Setup simulator logic
    setupHardwareSimulator();

    // 6. Run Time and Battery clocks
    startPhoneSystemSimulation();

    // 7. Establish search and filter hooks
    setupArchiveFilters();

    // 8. Bind detailed page overlay controls
    setupStoryDetailsListeners();

    // 9. Initial widgets rendering
    updateHomeWidgets();

    // 10. Update diagnostics badge
    const loadStatusBadge = document.getElementById("js-load-status");
    if (loadStatusBadge) {
        loadStatusBadge.textContent = "Script status: Ready";
        loadStatusBadge.style.backgroundColor = "rgba(78, 170, 120, 0.1)";
        loadStatusBadge.style.color = "#4EAA78";
        loadStatusBadge.style.borderColor = "rgba(78, 170, 120, 0.2)";
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
