var Store = {
    data: JSON.parse(localStorage.getItem('billy_baddie_routine')) || {
        water: 0,
        habits: [],
        weight: [],
        grocery: [],
        study: [],
        agenda: {}, 
        todos: [],
        studyTarget: 4,
        studyFilled: 0,
        morningRoutines: [
            { name: "Skincare Ochtend", active: true },
            { name: "Wellbutrin 150 mg", active: true }
        ],
        dayRoutines: [
            { name: "Studeren", active: true },
            { name: "Water (2L)", active: true }
        ],
        nightRoutines: [
            { name: "Skincare Avond", active: true },
            { name: "Ijzervitamine", active: true }
        ],
        weeklyRoutines: [
            { name: "Everything Shower", active: true },
            { name: "Bed verschonen", active: true },
            { name: "Meal Prep", active: true }
        ],
        monthlyRoutines: [
            { name: "Nagels doen", active: true },
            { name: "Microneedling", active: true }
        ],
        lastReset: new Date().toLocaleDateString()
    },
    init() {
        if (!this.data.morningRoutines || this.data.morningRoutines.length === 0) {
            this.data.morningRoutines = [
                { name: "Skincare Ochtend", active: true },
                { name: "Wellbutrin 150 mg", active: true },
                { name: "Ijzervitamine", active: true }
            ];
        }
        if (!this.data.dayRoutines || this.data.dayRoutines.length === 0) {
            this.data.dayRoutines = [
                { name: "Studeren (25m)", active: true },
                { name: "Water drinken 💧", active: true }
            ];
        }
        if (!this.data.nightRoutines || this.data.nightRoutines.length === 0) {
            this.data.nightRoutines = [
                { name: "Skincare Avond", active: true },
                { name: "Reflectie", active: true }
            ];
        }
        // Fallbacks for all expected arrays:
        ["weeklyRoutines", "monthlyRoutines", "todos", "grocery", "weight", "study", "habits"].forEach(k => {
            if (!this.data[k]) this.data[k] = [];
        });
        if (!this.data.agenda || typeof this.data.agenda !== "object") this.data.agenda = {};
        
        this.save();
    },
    save() {
        localStorage.setItem('billy_baddie_routine', JSON.stringify(this.data));
    }
};

Store.init();
window.Store = Store;

