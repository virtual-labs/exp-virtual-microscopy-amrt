document.addEventListener("DOMContentLoaded", () => {

  let isLightOn = false;
  let isSlideLoaded = false;
  let currentScale = 1.5; // 🔥 FIXED: Kept low so pixels stay razor sharp!
  let opticalZoomFactor = 1; // Tracks difficulty for the focus blur
  let perfectFocus = 50;
  let currentSlideImages = {};

  // DOM
  const startOverlay = document.getElementById("start-overlay");
  const startSimBtn = document.getElementById("start-sim-btn");
  const masterResetBtn = document.getElementById("master-reset");
  
  const microscopeStage = document.getElementById("microscope-stage");
  const stageBase = document.querySelector(".stage-base");
  const slideWrapper = document.getElementById("slide-wrapper");
  const slideView = document.getElementById("slide-view");
  const lightOverlay = document.getElementById("light-overlay");
  const powerBtn = document.getElementById("powerBtn");
  const lensBtns = document.querySelectorAll(".lens-btn");
  const currentSlideName = document.getElementById("current-slide-name");
  const magDisplay = document.getElementById("mag-display");

  const brightnessSlider = document.getElementById("brightness");
  const contrastSlider = document.getElementById("contrast");
  const coarseSlider = document.getElementById("coarse-focus");
  const fineSlider = document.getElementById("fine-focus");
  const stageXSlider = document.getElementById("stage-x");
  const stageYSlider = document.getElementById("stage-y");

  const resetStageBtn = document.getElementById("reset-stage");

  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");

  document.getElementById("popupOk").onclick = () => popup.style.display = "none";

  function showPopup(msg) {
    popupText.textContent = msg;
    popup.style.display = "flex";
  }

  // ---------------- START SIMULATION ----------------
  startSimBtn.addEventListener("click", () => {
    startOverlay.style.display = "none";
  });

  // ---------------- LOAD SLIDE ----------------
  function loadSlide(slideEl) {
    // Grab the multi-res images from your HTML data attributes
    currentSlideImages = {
      "4": slideEl.dataset["4x"] || slideEl.dataset.src,
      "10": slideEl.dataset["10x"] || slideEl.dataset["4x"],
      "20": slideEl.dataset["20x"] || slideEl.dataset["10x"],
      "40": slideEl.dataset["40x"] || slideEl.dataset["20x"]
    };

    slideView.style.display = "none";

    slideView.onload = () => {
      slideView.style.display = "block";
      updateViewport();
    };

    slideView.onerror = () => {
      console.error("❌ Image failed to load:", slideView.src);
    };

    slideView.src = currentSlideImages["4"];

    currentSlideName.textContent = slideEl.dataset.name;
    stageBase.textContent = "Slide Mounted";
    stageBase.style.background = "#27ae60";
    stageBase.style.color = "white";
    stageBase.style.borderStyle = "solid";

    isSlideLoaded = true;
    perfectFocus = Math.floor(Math.random() * 60) + 20;

    brightnessSlider.value = 100;
    contrastSlider.value = 100;
    coarseSlider.value = 0;
    fineSlider.value = 50;
    stageXSlider.value = 0;
    stageYSlider.value = 0;

    updateControlsState();
    setMagnification(lensBtns[0]);

    if (!isLightOn) {
      showPopup("Slide Mounted! Please turn on the Illumination light to view the specimen.");
    }
  }

  // ---------------- SLIDE CLICK/DRAG ----------------
  document.querySelectorAll(".slide-item").forEach(slide => {
    slide.addEventListener("click", () => {
      loadSlide(slide);
    });
    slide.addEventListener("dragstart", e => {
      e.dataTransfer.setData("slideName", slide.dataset.name);
    });
  });

  microscopeStage.addEventListener("dragover", e => { e.preventDefault(); stageBase.classList.add("drag-over"); });
  microscopeStage.addEventListener("dragleave", () => { stageBase.classList.remove("drag-over"); });
  microscopeStage.addEventListener("drop", e => {
    e.preventDefault();
    stageBase.classList.remove("drag-over");
    
    const droppedSlideName = e.dataTransfer.getData("slideName");
    const draggedSlide = Array.from(document.querySelectorAll(".slide-item")).find(el => el.dataset.name === droppedSlideName);
    
    if (draggedSlide) {
      loadSlide(draggedSlide);
    }
  });

  // ---------------- MASTER RESET ----------------
  masterResetBtn.addEventListener("click", () => {
    isSlideLoaded = false;
    slideView.src = "";
    slideView.style.display = "none";
    currentSlideName.textContent = "None";
    magDisplay.textContent = "0x";
    
    stageBase.textContent = "Click or Drag Slide Here";
    stageBase.style.background = "#444";
    stageBase.style.color = "#aaa";
    stageBase.style.borderStyle = "dashed";

    isLightOn = false;
    powerBtn.textContent = "💡 Turn Light ON";
    powerBtn.className = "power-off";
    lightOverlay.style.background = "rgba(0,0,0,1)"; 

    brightnessSlider.value = 100;
    contrastSlider.value = 100;
    coarseSlider.value = 0;
    fineSlider.value = 50;
    stageXSlider.value = 0;
    stageYSlider.value = 0;

    lensBtns.forEach(b => b.classList.remove("active"));
    
    updateControlsState();
    updateViewport();
  });

  // ---------------- POWER ----------------
  powerBtn.addEventListener("click", () => {
    isLightOn = !isLightOn;

    if (isLightOn) {
      powerBtn.textContent = "💡 Turn Light OFF";
      powerBtn.className = "power-on";
      lightOverlay.style.background = "rgba(0,0,0,0)";
    } else {
      powerBtn.textContent = "💡 Turn Light ON";
      powerBtn.className = "power-off";
      lightOverlay.style.background = "rgba(0,0,0,1)";
    }

    updateControlsState();
    updateViewport();
  });

  // ---------------- MAGNIFICATION ----------------
  lensBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (!isLightOn || !isSlideLoaded) return;
      setMagnification(btn);
    });
  });

  function setMagnification(btn) {
    lensBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    let mag = btn.textContent.replace("x", "");

    // 🔥 THIS IS WHERE THE MAGIC HAPPENS!
    // It swaps your image file to the high-res one
    if (currentSlideImages[mag]) {
      slideView.src = currentSlideImages[mag];
    }

    // We no longer digitally stretch the image! 
    opticalZoomFactor = parseFloat(btn.dataset.mag); // Used to make focus harder at 40x
    magDisplay.textContent = (mag * 10) + "x";

    updateViewport();
  }

  // ---------------- CONTROLS ----------------
  const controls = [brightnessSlider, contrastSlider, coarseSlider, fineSlider, stageXSlider, stageYSlider];
  controls.forEach(c => c.addEventListener("input", updateViewport));

  resetStageBtn.addEventListener("click", () => {
    stageXSlider.value = 0;
    stageYSlider.value = 0;
    updateViewport();
  });

  function updateControlsState() {
    const enable = isLightOn && isSlideLoaded;
    lensBtns.forEach(btn => btn.disabled = !enable);
    controls.forEach(c => c.disabled = !enable);
    resetStageBtn.disabled = !enable;
  }

  // ---------------- VIEWPORT ----------------
  function updateViewport() {
    if (!isSlideLoaded) return;

    // 🔥 FIXED PANNING MATH
    // Because currentScale is 1.5, we multiply by -0.5 so the panning 
    // never pushes the image off the screen to reveal the black background.
    let transX = -50 + (stageXSlider.value * -0.5);
    let transY = -50 + (stageYSlider.value * -0.5);

    slideWrapper.style.transform = `translate(${transX}%, ${transY}%) scale(${currentScale})`;

    let brightness = isLightOn ? brightnessSlider.value : 10;
    let contrast = contrastSlider.value;

    let coarse = parseFloat(coarseSlider.value);
    let fine = parseFloat(fineSlider.value) - 50;
    let focus = coarse + (fine * 0.1);

    // Focus is now harder to find at 40x than at 4x
    let blur = Math.abs(focus - perfectFocus) * opticalZoomFactor;
    let finalBlur = Math.min(blur * 0.05, 4); 

    slideView.style.filter = `brightness(${brightness}%) contrast(${contrast}%) blur(${finalBlur}px)`;
  }

});