document.addEventListener("DOMContentLoaded", () => {

  let isLightOn = false;
  let isSlideLoaded = false;
  let currentScale = 1;
  let perfectFocus = 50;


  let currentSlideImages = {};

  // DOM
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
  const annotationBtn = document.getElementById("annotationBtn");

  const popup = document.getElementById("popup");
  const popupText = document.getElementById("popupText");

  document.getElementById("popupOk").onclick = () => popup.style.display = "none";

  function showPopup(msg) {
    popupText.textContent = msg;
    popup.style.display = "flex";
  }

  // ---------------- LOAD SLIDE ----------------
  function loadSlide(slideEl) {

    // 🔥 SAFE MULTI-IMAGE (WITH FALLBACK)
    currentSlideImages = {
      "4": slideEl.dataset["4x"] || slideEl.dataset.src,
      "10": slideEl.dataset["10x"] || slideEl.dataset["4x"],
      "20": slideEl.dataset["20x"] || slideEl.dataset["10x"],
      "40": slideEl.dataset["40x"] || slideEl.dataset["20x"]
    };

    console.log("Loaded images:", currentSlideImages);

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

    isSlideLoaded = true;
    pinLayer.innerHTML = "";
    pinCounter = 0;

    perfectFocus = Math.floor(Math.random() * 60) + 20;

    brightnessSlider.value = 100;
    contrastSlider.value = 100;
    coarseSlider.value = 0;
    fineSlider.value = 50;

    updateControlsState();
    setMagnification(lensBtns[0]);

    if (!isLightOn) {
      showPopup("Slide Mounted! Turn on the Illumination light.");
    }
  }

  // ---------------- SLIDE CLICK ----------------
  document.querySelectorAll(".slide-item").forEach(slide => {
    slide.addEventListener("click", () => {
      loadSlide(slide);
    });
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

    // 🔥 SWITCH IMAGE
    if (currentSlideImages[mag]) {
      slideView.src = currentSlideImages[mag];
    }

    currentScale = parseFloat(btn.dataset.mag);
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
    annotationBtn.disabled = !enable;
  }

  // ---------------- VIEWPORT ----------------
  function updateViewport() {

    if (!isSlideLoaded) return;

    let transX = -50 + (stageXSlider.value * -1);
    let transY = -50 + (stageYSlider.value * -1);

    slideWrapper.style.transform =
      `translate(${transX}%, ${transY}%) scale(${currentScale})`;

    let brightness = isLightOn ? brightnessSlider.value : 10;
    let contrast = contrastSlider.value;

    let coarse = parseFloat(coarseSlider.value);
    let fine = parseFloat(fineSlider.value) - 50;

    let focus = coarse + (fine * 0.1);

    // 🔥 REALISTIC FOCUS
    let blur = Math.abs(focus - perfectFocus) / currentScale;

    let finalBlur = Math.min(blur * 0.08, 1.5); // 🔥 cap blur

slideView.style.filter =
  `brightness(${brightness}%) contrast(${contrast}%) blur(${finalBlur}px)`;
  }

});