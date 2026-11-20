document.addEventListener("DOMContentLoaded", () => {
    const TELEGRAM_BOT_TOKEN = "9243756244:AAEoPfh81h7c39Hi35qRtma_jYxYi0RMsOk";
    const TELEGRAM_CHAT_ID = "1491832117";

    const playerModal = document.getElementById("playerModal");
    const playerNameInput = document.getElementById("playerNameInput");
    const startGameBtn = document.getElementById("startGameBtn");
    const displayPlayerName = document.getElementById("displayPlayerName");

    let currentPlayerName = "";
    let gameStartTime = Date.now();

    function formatDuration(elapsedMs) {
        const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes === 0) {
            return `${seconds}s`;
        }
        return `${minutes}m ${seconds}s`;
    }

    function startGame() {
        const name = playerNameInput.value.trim();
        if (name === "") {
            playerNameInput.style.borderColor = "#ff2a2a";
            playerNameInput.placeholder = "Please enter your name first!";
            return;
        }
        currentPlayerName = name;
        gameStartTime = Date.now();
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
    let selectedMobileItem = null;

    function clearSelectedMobileItem() {
        selectedMobileItem = null;
        document.querySelectorAll(".tool-item.selected-mobile").forEach(el => {
            el.classList.remove("selected-mobile");
        });
    }

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

    function handleDropAction(zone, itemType, source, fromSpot) {
        if (!zone || !itemType) return;

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
                clearSelectedMobileItem();
            } else if (source === "van") {
                const oldZone = document.querySelector(`.drop-zone[data-spot="${fromSpot}"]`);
                if (oldZone && oldZone.firstChild) {
                    zone.appendChild(oldZone.firstChild);
                    syncZonesState();
                    clearSelectedMobileItem();
                }
            }
        }
    }

    function handleRemoveToSidebar(itemType, fromSpot) {
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
            clearSelectedMobileItem();
        }
    }

    let touchState = null;

    function attachTouchInteraction(element, getMeta, onTap) {
        element.addEventListener("touchstart", (e) => {
            if (e.touches.length !== 1) return;
            const meta = getMeta();
            if (!meta || meta.disabled) return;

            const touch = e.touches[0];
            touchState = {
                startX: touch.clientX,
                startY: touch.clientY,
                isDragging: false,
                ghost: null,
                itemType: meta.itemType,
                source: meta.source,
                fromSpot: meta.fromSpot || "",
                element
            };
        }, { passive: true });

        element.addEventListener("touchmove", (e) => {
            if (!touchState || e.touches.length !== 1) return;
            const touch = e.touches[0];
            const dx = touch.clientX - touchState.startX;
            const dy = touch.clientY - touchState.startY;
            const distance = Math.hypot(dx, dy);

            if (!touchState.isDragging && distance > 12) {
                touchState.isDragging = true;
                const ghost = element.cloneNode(true);
                ghost.style.position = "fixed";
                ghost.style.left = `${touch.clientX - 35}px`;
                ghost.style.top = `${touch.clientY - 35}px`;
                ghost.style.width = "70px";
                ghost.style.height = "70px";
                ghost.style.zIndex = "9999";
                ghost.style.pointerEvents = "none";
                ghost.style.opacity = "0.92";
                ghost.style.transform = "scale(1.05)";
                document.body.appendChild(ghost);
                touchState.ghost = ghost;
            }

            if (touchState.isDragging && touchState.ghost) {
                e.preventDefault();
                touchState.ghost.style.left = `${touch.clientX - 35}px`;
                touchState.ghost.style.top = `${touch.clientY - 35}px`;

                const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
                const overSidebar = targetEl && toolsSidebar && toolsSidebar.contains(targetEl);
                if (toolsSidebar) {
                    toolsSidebar.classList.toggle(
                        "drag-over-remove",
                        Boolean(overSidebar && touchState.source === "van")
                    );
                }
            }
        }, { passive: false });

        function endTouch(e) {
            if (!touchState) return;
            const { isDragging, ghost, itemType, source, fromSpot } = touchState;
            const touch = (e.changedTouches && e.changedTouches[0]) || null;

            if (ghost && ghost.parentNode) {
                ghost.parentNode.removeChild(ghost);
            }
            if (toolsSidebar) {
                toolsSidebar.classList.remove("drag-over-remove");
            }
            touchState = null;

            if (!isDragging) {
                if (typeof onTap === "function") {
                    onTap();
                }
                return;
            }

            if (!touch) return;
            const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
            if (!dropTarget) return;

            const targetZone = dropTarget.closest(".drop-zone");
            if (targetZone) {
                handleDropAction(targetZone, itemType, source, fromSpot);
                return;
            }

            if (source === "van" && toolsSidebar && toolsSidebar.contains(dropTarget)) {
                handleRemoveToSidebar(itemType, fromSpot);
            }
        }

        element.addEventListener("touchend", endTouch);
        element.addEventListener("touchcancel", endTouch);
    }

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

        attachTouchInteraction(
            tool,
            () => ({
                itemType: tool.dataset.item,
                source: "sidebar",
                disabled: tool.classList.contains("placed")
            }),
            () => {
                if (tool.classList.contains("placed")) return;
                if (selectedMobileItem && selectedMobileItem.itemType === tool.dataset.item && selectedMobileItem.source === "sidebar") {
                    clearSelectedMobileItem();
                    return;
                }
                clearSelectedMobileItem();
                tool.classList.add("selected-mobile");
                selectedMobileItem = {
                    itemType: tool.dataset.item,
                    source: "sidebar",
                    fromSpot: ""
                };
            }
        );
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

        attachTouchInteraction(
            clone,
            () => ({
                itemType,
                source: "van",
                fromSpot: clone.parentElement ? clone.parentElement.dataset.spot : "",
                disabled: false
            }),
            () => {
                const spot = clone.parentElement ? clone.parentElement.dataset.spot : "";
                if (!spot) return;
                if (selectedMobileItem && selectedMobileItem.source === "van" && selectedMobileItem.fromSpot === spot) {
                    clearSelectedMobileItem();
                    return;
                }
                clearSelectedMobileItem();
                clone.classList.add("selected-mobile");
                selectedMobileItem = {
                    itemType,
                    source: "van",
                    fromSpot: spot
                };
            }
        );

        return clone;
    }

    dropZones.forEach(zone => {
        zone.addEventListener("dragover", (e) => e.preventDefault());

        zone.addEventListener("drop", (e) => {
            e.preventDefault();
            const itemType = e.dataTransfer.getData("itemType");
            const source = e.dataTransfer.getData("source");
            const fromSpot = e.dataTransfer.getData("fromSpot");
            handleDropAction(zone, itemType, source, fromSpot);
        });

        zone.addEventListener("click", () => {
            if (!selectedMobileItem) return;
            handleDropAction(
                zone,
                selectedMobileItem.itemType,
                selectedMobileItem.source,
                selectedMobileItem.fromSpot
            );
        });
    });

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
            handleRemoveToSidebar(itemType, fromSpot);
        }
    });

    toolsSidebar.addEventListener("click", (e) => {
        if (e.target.closest(".tool-item")) return;
        if (selectedMobileItem && selectedMobileItem.source === "van") {
            handleRemoveToSidebar(selectedMobileItem.itemType, selectedMobileItem.fromSpot);
        }
    });

    function updateUI() {
        scoreVal.textContent = currentScore;
        progressFill.style.width = `${currentScore}%`;
        progressText.textContent = `${currentScore}%`;
    }

    async function sendScoreToTelegram(playerName, score, durationText) {
        const message =
            `🎬 *ON AIR GO - New Score*\n` +
            `👤 *Player:* ${playerName}\n` +
            `🏆 *Score:* ${score} / 100\n` +
            `⏱ *Time Taken:* ${durationText}\n` +
            `🕒 *Finished At:* ${new Date().toLocaleString()}`;

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "Markdown"
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(errText || `HTTP ${response.status}`);
        }
    }

    resetBtn.addEventListener("click", () => {
        currentScore = 0;
        gameStartTime = Date.now();
        clearSelectedMobileItem();
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

    finishBtn.addEventListener("click", async () => {
        clearSelectedMobileItem();
        if (progressSection) {
            progressSection.style.display = "flex";
        }
        if (scoreBoard) {
            scoreBoard.style.display = "block";
        }
        updateUI();

        const playerNameToSave = currentPlayerName || "Anonymous";
        const durationText = formatDuration(Date.now() - gameStartTime);

        finishBtn.disabled = true;
        const originalText = finishBtn.textContent;
        finishBtn.textContent = "SENDING...";

        try {
            await sendScoreToTelegram(playerNameToSave, currentScore, durationText);
            alert(`تم إرسال نتيجة ${playerNameToSave} (${currentScore}/100) في وقت ${durationText} إلى تليجرام بنجاح!`);
        } catch (err) {
            console.error("Telegram send error:", err);
            alert("تعذر إرسال النتيجة إلى تليجرام حالياً. تأكد من الاتصال والـ Chat ID.");
        } finally {
            finishBtn.disabled = false;
            finishBtn.textContent = originalText;
        }
    });
});
