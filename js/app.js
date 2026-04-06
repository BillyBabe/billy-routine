document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.page');
    let timerInterval = null;
    let timerSeconds = 25 * 60; // 25 mins
    const today = new Date().toLocaleDateString(); 

    const quotes = [
        "Always dress like you're going to see your worst enemy.",
        "You're doing amazing, sweetie. Keep glowing! 💅✨",
        "Invest in your skin. It is going to represent you for a long time.",
        "A girl should be two things: classy and fabulous.",
        "Self-care is not a luxury, it's a necessity.",
        "Glow with the flow.",
        "Beautiful things happen when you distance yourself from negativity.",
        "Confidence is 10% hard work and 90% delusion.",
        "Keep your head, heels, and standards high.",
        "Success is the best revenge."
    ];
    const dailyQuote = quotes[new Date().getDate() % quotes.length];
    
    // Drag & Drop State
    let draggedItem = null;
    let draggedSource = null; // { listKey: string, index: number, date: string|null }

    // Helper to get safe array
    const getSafeArr = (arr) => Array.isArray(arr) ? arr : [];

    // NAVIGATION
    navItems.forEach(item => {
        item.onclick = function() {
            const pageId = this.dataset.page;
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            sections.forEach(s => s.classList.remove('active'));
            const target = document.getElementById(`page-${pageId}`);
            if (target) target.classList.add('active');
            const span = this.querySelector('span');
            if(span) document.getElementById('header-title').innerText = span.innerText;
            render();
        };
    });

    // DRAG & DROP HANDLERS
    const onDragStart = (e, source) => {
        draggedSource = source;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };

    const setupDropZone = (el, targetListKey, targetDate = null) => {
        el.ondragover = (e) => {
            e.preventDefault();
            el.classList.add('drag-over');
        };
        el.ondragleave = () => el.classList.remove('drag-over');
        el.ondrop = (e) => {
            e.preventDefault();
            el.classList.remove('drag-over');
            if (!draggedSource) return;

            const sourceArr = draggedSource.date ? Store.data.agenda[draggedSource.date] : Store.data[draggedSource.listKey];
            const targetArr = targetDate ? Store.data.agenda[targetDate] : Store.data[targetListKey];

            if (!sourceArr || !targetArr) return;

            // Move item
            const item = sourceArr.splice(draggedSource.index, 1)[0];
            
            // If moving an Agenda task to another date, update its date if necessary (not really needed since it's in the array)
            // If moving a Routine between categories, it works too.
            
            targetArr.push(item);
            Store.save();
            render();
            draggedSource = null;
        };
    };

    // RENDER FUNCTION
    const render = () => {
        console.log("Billy's Glow Up: Render start...");
        if (!window.Store || !window.Store.data) {
            console.error("Store not initialized yet!");
            return;
        }

        // Water (Guarded)
        const waterEl = document.getElementById('water-count');
        if (waterEl) waterEl.innerText = `${Store.data.water || 0}/8 glazen`;
        
        const waterProgress = document.getElementById('water-progress');
        if (waterProgress) waterProgress.style.width = `${Math.min(100, ((Store.data.water || 0) / 8) * 100)}%`;

        // Daily Quote logic
        const quoteEl = document.getElementById('daily-quote');
        if (quoteEl) quoteEl.innerText = `"${dailyQuote}"`;

        // Today's Unified Checklist: "My Day"
        const myDayTitle = document.getElementById('my-day-title');
        if (myDayTitle) {
            const options = { day: 'numeric', month: 'long' };
            myDayTitle.innerText = `My Day (${new Date().toLocaleDateString('nl-NL', options)})`;
        }

        const checklistToday = document.getElementById('checklist-today');
        if (checklistToday) {
            checklistToday.innerHTML = '';
            
            const habitsDone = getSafeArr(Store.data.habits);
            const renderItem = (container, h, type = 'habit', sourceInfo = null) => {
                if(!h || !h.name) return;
                const div = document.createElement('div');
                div.className = `check-item ${habitsDone.includes(h.name) || h.done ? 'done' : ''}`;
                div.draggable = true;
                div.innerHTML = `
                    <div class="custom-checkbox"></div>
                    <span style="flex:1;">${h.name}</span>
                    <div class="item-controls" style="opacity: 1;">
                        <button class="control-btn delete" title="Delete"><i class="ph-bold ph-trash"></i></button>
                    </div>
                `;
                
                div.ondragstart = (e) => onDragStart(e, sourceInfo || {listKey: type === 'todo' ? 'todos' : '', index: -1});

                // Toggle Logic
                div.querySelector('.custom-checkbox').onclick = (e) => {
                    e.stopPropagation();
                    if (type === 'habit') {
                        const i = Store.data.habits.indexOf(h.name);
                        if(i > -1) Store.data.habits.splice(i,1); else Store.data.habits.push(h.name);
                    } else {
                        h.done = !h.done;
                    }
                    Store.save(); render();
                };
                
                div.querySelector('span').onclick = (e) => {
                    e.stopPropagation();
                    if (type === 'habit') {
                        const i = Store.data.habits.indexOf(h.name);
                        if(i > -1) Store.data.habits.splice(i,1); else Store.data.habits.push(h.name);
                    } else {
                        h.done = !h.done;
                    }
                    Store.save(); render();
                };

                // Delete Logic
                div.querySelector('.delete').onclick = (e) => {
                    e.stopPropagation();
                    if(confirm(`Weet je zeker dat je "${h.name}" wilt verwijderen?`)) {
                        if (sourceInfo) {
                            const arr = sourceInfo.date ? Store.data.agenda[sourceInfo.date] : Store.data[sourceInfo.listKey];
                            if (arr) arr.splice(sourceInfo.index, 1);
                        }
                        Store.save(); render();
                    }
                };

                container.appendChild(div);
            };
            
            const morn = getSafeArr(Store.data.morningRoutines).filter(h => h.active);
            const day = getSafeArr(Store.data.dayRoutines).filter(h => h.active);
            const night = getSafeArr(Store.data.nightRoutines).filter(h => h.active);
            const todos = getSafeArr(Store.data.todos);

            const renderSection = (title, list, listKey, date = null) => {
                if (list.length === 0 && !date) return; // Only show sections with items (unless it's tasks which can be empty as a drop zone)
                
                const section = document.createElement('div');
                section.className = 'day-section';
                section.innerHTML = `<div style="font-size:0.9rem; color: #ff8bb7; text-transform:uppercase; font-weight:bold; letter-spacing:1px; padding-top:10px; margin-bottom:5px;">${title}</div>`;
                setupDropZone(section, listKey, date);
                
                list.forEach((h) => {
                    const originalIdx = date ? Store.data.agenda[date].indexOf(h) : Store.data[listKey].indexOf(h);
                    renderItem(section, h, date ? 'agenda' : 'habit', {listKey, index: originalIdx, date});
                });
                checklistToday.appendChild(section);
            };

            renderSection('Morning', morn, 'morningRoutines');
            renderSection('Day', day, 'dayRoutines');
            renderSection('Night', night, 'nightRoutines');
            
            const customTasks = Store.data.agenda ? (Store.data.agenda[today] || []) : [];
            // Merge Agenda and Todos into one Tasks section drop zone
            const tasksSection = document.createElement('div');
            tasksSection.className = 'day-section';
            tasksSection.innerHTML = `<div style="font-size:0.9rem; color: #ff8bb7; text-transform:uppercase; font-weight:bold; letter-spacing:1px; padding-top:10px; margin-bottom:5px;">Tasks for Today</div>`;
            setupDropZone(tasksSection, 'agenda', today);
            
            customTasks.forEach((t, idx) => renderItem(tasksSection, t, 'agenda', {date: today, index: idx}));
            todos.forEach((t, idx) => renderItem(tasksSection, t, 'todo', {listKey: 'todos', index: idx}));
            
            checklistToday.appendChild(tasksSection);
        }

        // Master Lists Rendering
        const renderListMask = (id, arrayKey) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = '';
            setupDropZone(el, arrayKey);

            const arr = getSafeArr(Store.data[arrayKey]);
            const categories = ["morningRoutines", "dayRoutines", "nightRoutines", "weeklyRoutines", "monthlyRoutines"];
            
            arr.forEach((h, idx) => {
                const div = document.createElement('div');
                div.className = `check-item ${!h.active ? 'done' : ''}`;
                div.draggable = true;
                div.innerHTML = `
                    <div class="custom-checkbox"></div>
                    <span style="flex:1;">${h.name}</span>
                    <div class="item-controls">
                        <button class="control-btn delete" title="Delete"><i class="ph-bold ph-trash"></i></button>
                    </div>
                `;
                
                div.ondragstart = (e) => onDragStart(e, {listKey: arrayKey, index: idx});

                const toggle = () => { h.active = !h.active; Store.save(); render(); };
                div.querySelector('.custom-checkbox').onclick = (e) => { e.stopPropagation(); toggle(); };
                div.querySelector('span').onclick = (e) => { e.stopPropagation(); toggle(); };

                div.querySelector('.delete').onclick = (e) => {
                    e.stopPropagation();
                    if(confirm(`Weet je zeker dat je "${h.name}" wilt verwijderen?`)) {
                        arr.splice(idx, 1);
                        Store.save(); render();
                    }
                };

                el.appendChild(div);
            });
        };

        renderListMask('morning-habits-master', 'morningRoutines');
        renderListMask('day-habits-master', 'dayRoutines');
        renderListMask('night-habits-master', 'nightRoutines');
        renderListMask('weekly-habits-master', 'weeklyRoutines');
        renderListMask('monthly-habits-master', 'monthlyRoutines');

        // (Todos are now rendered in My Day)

        // Agenda Week Grid
        const agendaGrid = document.getElementById('agenda-week-grid');
        if (agendaGrid) {
            agendaGrid.innerHTML = '';
            const days = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
            const curr = new Date();
            const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1); 
            
            const mActive = getSafeArr(Store.data.morningRoutines).filter(h => h.active).map(h => h.name);
            const dActive = getSafeArr(Store.data.dayRoutines).filter(h => h.active).map(h => h.name);
            const nActive = getSafeArr(Store.data.nightRoutines).filter(h => h.active).map(h => h.name);

            for(let i = 0; i < 7; i++) {
                const d = new Date(curr.setDate(first + i));
                const dateStr = d.toLocaleDateString('nl-NL');
                const customTasks = Store.data.agenda ? (Store.data.agenda[dateStr] || []) : [];
                
                const dayCard = document.createElement('div');
                dayCard.className = 'glass-card';
                dayCard.style.padding = '20px';
                
                let html = `<h3 class="serif" style="margin-bottom:10px; font-size:1.4rem;">${days[i]} <span class="serif" style="font-size:1.2rem; color:var(--vs-pink-deep); float:right;">${dateStr}</span></h3>`;
                html += `<div class="checklist-mini" style="margin-bottom: 10px;">`;
                if(mActive.length>0) html += `<div style="font-size:0.8rem; font-weight:bold; margin-top:5px;">🌅 Morning</div>`;
                mActive.forEach(r => html += `<div style="padding: 2px 0; color: var(--text-muted); font-size: 0.9rem;">• ${r}</div>`);
                if(dActive.length>0) html += `<div style="font-size:0.8rem; font-weight:bold; margin-top:5px;">☀️ Day</div>`;
                dActive.forEach(r => html += `<div style="padding: 2px 0; color: var(--text-muted); font-size: 0.9rem;">• ${r}</div>`);
                if(nActive.length>0) html += `<div style="font-size:0.8rem; font-weight:bold; margin-top:5px;">🌙 Night</div>`;
                nActive.forEach(r => html += `<div style="padding: 2px 0; color: var(--text-muted); font-size: 0.9rem;">• ${r}</div>`);
                html += `</div><div class="checklist-mini" id="agenda-tasks-${i}"></div>`;
                html += `<div class="add-row" style="margin-top:15px;">
                            <input type="text" id="input-agenda-${i}" placeholder="Taak/Workout toevoegen..." style="padding: 8px; font-size: 0.9rem;">
                            <button class="btn-primary-small" id="btn-add-agenda-${i}" style="padding: 8px 15px;">+</button>
                        </div>`;
                dayCard.innerHTML = html;
                agendaGrid.appendChild(dayCard);
                
                const taskContainer = document.getElementById(`agenda-tasks-${i}`);
                if (taskContainer) {
                    setupDropZone(taskContainer, 'agenda', dateStr);
                    customTasks.forEach((t, tIdx) => {
                        const div = document.createElement('div');
                        div.className = `check-item ${t.done ? 'done' : ''}`;
                        div.style.padding = "8px 12px";
                        div.draggable = true;
                        div.innerHTML = `
                            <div class="custom-checkbox" style="width:20px; height:20px;"></div>
                            <span style="flex:1;">${t.name}</span>
                            <div class="item-controls" style="opacity: 1;">
                                <button class="control-btn delete" title="Delete"><i class="ph-bold ph-trash"></i></button>
                            </div>
                        `;
                        
                        div.ondragstart = (e) => onDragStart(e, {date: dateStr, index: tIdx});

                        // Checkbox logic
                        div.querySelector('.custom-checkbox').onclick = (e) => { e.stopPropagation(); t.done = !t.done; Store.save(); render(); };
                        div.querySelector('span').onclick = (e) => { e.stopPropagation(); t.done = !t.done; Store.save(); render(); };
                        
                        div.querySelector('.delete').onclick = (e) => { 
                            e.stopPropagation(); 
                            customTasks.splice(tIdx, 1);
                            Store.save(); render();
                        };
                        
                        taskContainer.appendChild(div);
                    });
                }
                
                document.getElementById(`btn-add-agenda-${i}`)?.addEventListener('click', () => {
                   const inp = document.getElementById(`input-agenda-${i}`);
                   if(inp && inp.value.trim()){
                       if(!Store.data.agenda[dateStr]) Store.data.agenda[dateStr] = [];
                       Store.data.agenda[dateStr].push({name: inp.value.trim(), done: false});
                       Store.save(); render();
                   }
                });
            }
        }
        
        // Weight Log
        const weightList = document.getElementById('weight-history');
        if (weightList) {
            weightList.innerHTML = '';
            getSafeArr(Store.data.weight).slice(-5).reverse().forEach(w => {
                const div = document.createElement('div');
                div.style.padding = "10px";
                div.style.borderBottom = "1px solid rgba(0,0,0,0.1)";
                div.innerHTML = `<strong>${w.val} kg</strong> - <span style="font-size:0.8rem">${w.date}</span>`;
                weightList.appendChild(div);
            });
        }

        // Groceries
        const gList = document.getElementById('grocery-list');
        if (gList) {
            gList.innerHTML = '';
            getSafeArr(Store.data.grocery).forEach((g, idx) => {
                const div = document.createElement('div');
                div.className = `check-item`;
                div.innerHTML = `<div class="custom-checkbox"></div><span>${g.name}</span>`;
                div.onclick = () => {
                    Store.data.grocery.splice(idx, 1);
                    Store.save(); render();
                };
                gList.appendChild(div);
            });
        }

        // Study Tracker
        const heartsContainer = document.getElementById('study-hearts-container');
        if (heartsContainer) {
            heartsContainer.innerHTML = '';
            for(let i = 0; i < (Store.data.studyTarget || 4); i++) {
                const icon = document.createElement('span');
                icon.innerHTML = i < (Store.data.studyFilled || 0) ? '💖' : '🤍';
                icon.style.userSelect = 'none';
                icon.onclick = () => {
                    if (i === (Store.data.studyFilled || 0) - 1) Store.data.studyFilled--; 
                    else Store.data.studyFilled = i + 1;
                    Store.save(); render();
                };
                heartsContainer.appendChild(icon);
            }
        }

        const studyDisplay = document.getElementById('study-total-today');
        if (studyDisplay) {
            const sToday = getSafeArr(Store.data.study).find(s => s.date === today);
            studyDisplay.innerText = `${sToday ? sToday.minutes : 0} min`;
        }
    };

    // EVENT LISTENERS
    document.getElementById('btn-add-morning')?.addEventListener('click', () => {
        const inp = document.getElementById('input-new-morning');
        if(inp && inp.value.trim()){ Store.data.morningRoutines.push({name: inp.value.trim(), active: true}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('btn-add-day')?.addEventListener('click', () => {
        const inp = document.getElementById('input-new-day');
        if(inp && inp.value.trim()){ Store.data.dayRoutines.push({name: inp.value.trim(), active: true}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('btn-add-night')?.addEventListener('click', () => {
        const inp = document.getElementById('input-new-night');
        if(inp && inp.value.trim()){ Store.data.nightRoutines.push({name: inp.value.trim(), active: true}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('btn-add-weekly')?.addEventListener('click', () => {
        const inp = document.getElementById('input-new-weekly');
        if(inp && inp.value.trim()){ Store.data.weeklyRoutines.push({name: inp.value.trim(), active: true}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('btn-add-monthly')?.addEventListener('click', () => {
        const inp = document.getElementById('input-new-monthly');
        if(inp && inp.value.trim()){ Store.data.monthlyRoutines.push({name: inp.value.trim(), active: true}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('input-study-target')?.addEventListener('change', (e) => {
        Store.data.studyTarget = parseInt(e.target.value) || 4;
        Store.save(); render();
    });
    document.getElementById('btn-add-todo')?.addEventListener('click', () => {
        const inp = document.getElementById('input-new-todo');
        if(inp && inp.value.trim()){ Store.data.todos.push({name: inp.value.trim(), done: false}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('btn-add-weight')?.addEventListener('click', () => {
        const inp = document.getElementById('input-weight');
        if(inp && inp.value) { Store.data.weight.push({val: parseFloat(inp.value), date: new Date().toLocaleDateString()}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('btn-add-grocery')?.addEventListener('click', () => {
        const inp = document.getElementById('input-grocery');
        if(inp && inp.value.trim()) { Store.data.grocery.push({name: inp.value.trim()}); inp.value=''; Store.save(); render(); }
    });
    document.getElementById('btn-daily-reset')?.addEventListener('click', () => {
        if(confirm("Zeker weten dat je de voortgang van vandaag wilt resetten?")) {
            Store.data.water = 0; Store.data.habits = []; Store.data.studyFilled = 0; Store.save(); render();
        }
    });

    // Timer Logic
    document.getElementById('btn-timer-start')?.addEventListener('click', function() {
        if(timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
            this.innerText = 'Start';
        } else {
            this.innerText = 'Pause';
            timerInterval = setInterval(() => {
                timerSeconds--;
                const d = document.getElementById('timer-display');
                if (d) d.innerText = `${String(Math.floor(timerSeconds / 60)).padStart(2,'0')}:${String(timerSeconds % 60).padStart(2,'0')}`;
                if(timerSeconds <= 0) {
                    clearInterval(timerInterval);
                    timerInterval = null;
                    this.innerText = 'Start';
                    timerSeconds = 25 * 60;
                    const sDay = Store.data.study.find(s => s.date === today) || {date: today, minutes: 0};
                    if(!Store.data.study.includes(sDay)) Store.data.study.push(sDay);
                    sDay.minutes += 25;
                    Store.save(); render();
                    alert("Focus session complete! ✨");
                }
            }, 1000);
        }
    });
    document.getElementById('btn-timer-reset')?.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerInterval = null;
        timerSeconds = 25 * 60;
        const d = document.getElementById('timer-display');
        if (d) d.innerText = "25:00";
        const startBtn = document.getElementById('btn-timer-start');
        if(startBtn) startBtn.innerText = 'Start';
    });

    // Initial check & Render
    if (Store.data.lastReset !== today) {
        Store.data.water = 0; Store.data.habits = []; Store.data.studyFilled = 0;
        Store.data.lastReset = today;
        Store.save();
    }

    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    try {
        render();
    } catch (e) {
        console.error("Critical error during initial render:", e);
    }
});

