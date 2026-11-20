document.addEventListener("DOMContentLoaded", () => {
    const playerModal = document.getElementById("playerModal");
    const playerNameInput = document.getElementById("playerNameInput");
    const startGameBtn = document.getElementById("startGameBtn");
    const displayPlayerName = document.getElementById("displayPlayerName");
    
    let currentPlayerName = "";

    function startGame() {
        const name = playerNameInput.value.trim();
        if (name === "") {
            playerNameInput.style.borderColor = "#ff2a2a";
            playerNameInput.placeholder = "Please enter your name first!";
            return;
        }
        currentPlayerName = name;
        displayPlayerName.textContent = currentPlayerName;
        playerModal.style.display = "none";
    }

    startGameBtn.addEventListener("click", startGame);
    playerNameInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") startGame();
    });

    const tabs = document.querySelectorAll(".tab");
    const tools = document.querySelectorAll(".tool-item");
    const dropZones = document.querySelectorAll(".drop-zone");
    const vanInterior = document.querySelector(".van-interior");
    const fullWallZone = document.querySelector(".full-wall-zone");
    const wallOverlayZones = document.querySelectorAll(".wall-overlay-zone");
    const rightCameraZone = document.querySelector(".right-camera-zone");
    const toolsSidebar = document.querySelector(".tools-sidebar");
    const progressSection = document.getElementById("progressSection");
    const scoreBoard = document.getElementById("scoreBoard");
    const scoreVal = document.getElementById("scoreVal");
    const progressFill = document.getElementById("progressFill");
    const progressText = document.getElementById("progressText");
    const resetBtn = document.querySelector(".reset-btn");
    const finishBtn = document.getElementById("finishBtn");

    let currentScore = 0;

    function getWallItemCategory(itemEl) {
        if (!itemEl) return null;
        const itemAttr = (itemEl.dataset.item || "").toLowerCase();
        const textAttr = (itemEl.textContent || "").toLowerCase().trim();
        const imgEl = itemEl.querySelector("img");
        const imgSrc = (imgEl ? imgEl.getAttribute("src") || "" : "").toLowerCase();
        const imgAlt = (imgEl ? imgEl.getAttribute("alt") || "" : "").toLowerCase();

        if (
            itemAttr.includes("green") ||
            textAttr.includes("green screen") ||
            imgSrc.includes("green") ||
            imgAlt.includes("green")
        ) {
            return "green";
        }

        if (
            itemAttr.includes("tv") ||
            itemAttr.includes("screen") ||
            textAttr === "tv" ||
            textAttr.includes("screen") ||
            imgSrc.includes("tv") ||
            imgSrc.includes("screen") ||
            imgAlt.includes("tv") ||
            imgAlt.includes("screen")
        ) {
            return "tv_screen";
        }

        return null;
    }

    function hasPlacedBeanBag() {
        const placedItems = document.querySelectorAll(".drop-zone .tool-item");
        return Array.from(placedItems).some(item =>
            item.dataset.item === "benbag" || item.dataset.item === "benbagII"
        );
    }

    // تحديث حالة الحدود، ظهور المناطق العلوية، حجم التكييف والـ Green Screen / TV، وتوزيع المناطق
    function syncZonesState() {
        dropZones.forEach(zone => {
            const placedItem = zone.querySelector(".tool-item");
            if (placedItem) {
                zone.classList.add("has-item");
                if (placedItem.dataset.item === "ac") {
                    zone.classList.add("has-ac");
                } else {
                    zone.classList.remove("has-ac");
                }
            } else {
                zone.classList.remove("has-item");
                zone.classList.remove("has-ac");
            }
        });

        const wallItem = fullWallZone ? fullWallZone.querySelector(".tool-item") : null;
        const hasWallItem = Boolean(wallItem);
        const wallCategory = getWallItemCategory(wallItem);
        const isGreen = wallCategory === "green";
        const isTvOrScreen = wallCategory === "tv_screen";
        const isAnyScreenMode = isGreen || isTvOrScreen;

        if (fullWallZone) {
            fullWallZone.classList.toggle("has-green-screen", isGreen);
            fullWallZone.classList.toggle("has-tv-screen", isTvOrScreen);
        }

        if (vanInterior) {
            vanInterior.classList.toggle("screen-mode", isAnyScreenMode);
        }

        wallOverlayZones.forEach(overlayZone => {
            if (hasWallItem) {
                overlayZone.classList.add("visible");
            } else {
                overlayZone.classList.remove("visible");
            }
        });

        if (rightCameraZone) {
            rightCameraZone.classList.toggle("with-beanbag", hasPlacedBeanBag());
        }
    }

    // التنقل بين التبويبات
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const selectedCategory = tab.dataset.category;
            tools.forEach(tool => {
                tool.style.display = (tool.dataset.category === selectedCategory) ? "flex" : "none";
            });
        });
    });

    // تفعيل السحب من القائمة
    tools.forEach(tool => {
        tool.addEventListener("dragstart", (e) => {
            const itemElement = e.currentTarget;
            e.dataTransfer.setData("itemType", itemElement.dataset.item);
            e.dataTransfer.setData("source", "sidebar");
            setTimeout(() => itemElement.classList.add("dragging"), 0);
        });

        tool.addEventListener("dragend", (e) => {
            e.currentTarget.classList.remove("dragging");
        });
    });

    function createPlacedClone(originalTool, itemType) {
        const clone = originalTool.cloneNode(true);
        clone.style.display = "flex";
        clone.style.width = "100%";
        clone.style.height = "100%";
        clone.setAttribute("draggable", "true");
        clone.title = "Drag back to sidebar to remove";

        clone.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("itemType", itemType);
            e.dataTransfer.setData("source", "van");
            e.dataTransfer.setData("fromSpot", clone.parentElement.dataset.spot);
        });

        return clone;
    }

    // الإسقاط داخل الشاحنة
    dropZones.forEach(zone => {
        zone.addEventListener("dragover", (e) => e.preventDefault());

        zone.addEventListener("drop", (e) => {
            e.preventDefault();
            const itemType = e.dataTransfer.getData("itemType");
            const source = e.dataTransfer.getData("source");

            if (itemType === "podcast_table" && hasPlacedBeanBag()) {
                alert("مينفعش تحط ترابيزة مع الـ Bean Bag عشان مش هيبقوا لايقين مع بعض!");
                return;
            }

            if (zone.children.length === 0) {
                const originalTool = document.querySelector(`.tools-grid [data-item="${itemType}"]`);
                
                if (source === "sidebar" && originalTool && !originalTool.classList.contains("placed")) {
                    const clone = createPlacedClone(originalTool, itemType);
                    zone.appendChild(clone);

                    originalTool.classList.add("placed");
                    originalTool.style.opacity = "0.3";
                    originalTool.setAttribute("draggable", "false");

                    const itemPoints = parseInt(originalTool.dataset.points);
                    currentScore = Math.min(currentScore + itemPoints, 100);
                    updateUI();
                    syncZonesState();
                } 
                else if (source === "van") {
                    const fromSpot = e.dataTransfer.getData("fromSpot");
                    const oldZone = document.querySelector(`.drop-zone[data-spot="${fromSpot}"]`);
                    if (oldZone && oldZone.firstChild) {
                        zone.appendChild(oldZone.firstChild);
                        syncZonesState();
                    }
                }
            }
        });
    });

    // إزالة القطعة بسحبها للقائمة الجانبية
    toolsSidebar.addEventListener("dragover", (e) => {
        e.preventDefault();
        toolsSidebar.classList.add("drag-over-remove");
    });

    toolsSidebar.addEventListener("dragleave", () => {
        toolsSidebar.classList.remove("drag-over-remove");
    });

    toolsSidebar.addEventListener("drop", (e) => {
        e.preventDefault();
        toolsSidebar.classList.remove("drag-over-remove");

        const source = e.dataTransfer.getData("source");
        if (source === "van") {
            const itemType = e.dataTransfer.getData("itemType");
            const fromSpot = e.dataTransfer.getData("fromSpot");

            const oldZone = document.querySelector(`.drop-zone[data-spot="${fromSpot}"]`);
            const originalTool = document.querySelector(`.tools-grid [data-item="${itemType}"]`);

            if (oldZone && originalTool) {
                oldZone.innerHTML = "";
                originalTool.classList.remove("placed");
                originalTool.style.opacity = "1";
                originalTool.setAttribute("draggable", "true");

                const itemPoints = parseInt(originalTool.dataset.points);
                currentScore = Math.max(currentScore - itemPoints, 0);
                updateUI();
                syncZonesState();
            }
        }
    });

    function updateUI() {
        scoreVal.textContent = currentScore;
        progressFill.style.width = `${currentScore}%`;
        progressText.textContent = `${currentScore}%`;
    }

    resetBtn.addEventListener("click", () => {
        currentScore = 0;
        if (progressSection) {
            progressSection.style.display = "none";
        }
        if (scoreBoard) {
            scoreBoard.style.display = "none";
        }
        updateUI();
        dropZones.forEach(zone => zone.innerHTML = "");
        tools.forEach(tool => {
            tool.classList.remove("placed");
            tool.style.opacity = "1";
            tool.setAttribute("draggable", "true");
        });
        syncZonesState();
    });

    finishBtn.addEventListener("click", () => {
        if (progressSection) {
            progressSection.style.display = "flex";
        }
        if (scoreBoard) {
            scoreBoard.style.display = "block";
        }
        updateUI();
        alert(`Great job ${currentPlayerName}! Your Studio Score is: ${currentScore}/100`);
    });
});