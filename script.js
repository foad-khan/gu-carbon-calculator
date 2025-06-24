

window.addEventListener("DOMContentLoaded", function () {
  // Helper to get input value or 0
  const val = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`Input element with ID '${id}' not found`);
      return 0;
    }
    const value = parseFloat(element.value) || 0;
    return value < 0 ? 0 : value; // Prevent negative values
  };

  // Fill sliders with gradient based on value
  const sliders = document.querySelectorAll('.slider-group input[type="range"]');
  if (sliders.length === 0) {
    console.warn("No sliders found with class 'slider-group input[type=\"range\"]'");
  }
  sliders.forEach(slider => {
    const updateSliderBackground = (el) => {
      const min = +el.min || 0;
      const max = +el.max || 100;
      const value = +el.value;
      const percent = ((value - min) / (max - min)) * 100;
      el.style.background = `linear-gradient(to right, ${percent}%, #ccc ${percent}%)`;
    };
    updateSliderBackground(slider); // Set initial state
    slider.addEventListener('input', (e) => {
      updateSliderBackground(e.target);
      const outputId = e.target.id === "electricityUsage" ? "elecValue" :
                       e.target.id === "wasteGenerated" ? "wasteVal" :
                       e.target.id === "waterUsage" ? "waterVal" : null;
      if (outputId) {
        const output = document.getElementById(outputId);
        if (output) output.innerText = e.target.value;
        else console.error(`Slider output element '${outputId}' not found`);
      }
    });
  });

  // Check if Chart.js is loaded
  if (typeof Chart === "undefined") {
    console.error("Chart.js not loaded! Chart will not render.");
  } else {
    console.log("Chart.js is loaded");
  }

  const calcForm = document.getElementById("calcForm");
  const calculateBtn = document.getElementById("calculateBtn");
  const totalDisplay = document.getElementById("totalFootprint");
  const resultsSection = document.querySelector(".results");
  const chartCanvas = document.getElementById("footprintChart");
  const suggestionText = document.getElementById("suggestionText");

  // Check for required elements
  if (!calcForm) console.error("Form with ID 'calcForm' not found");
  if (!calculateBtn) console.error("Button with ID 'calculateBtn' not found");
  if (!totalDisplay) console.error("Element with ID 'totalFootprint' not found");
  if (!resultsSection) console.error("Element with class 'results' not found");
  if (!chartCanvas) console.error("Element with ID 'footprintChart' not found");
  if (!suggestionText) console.error("Element with ID 'suggestionText' not found");

  if (!calcForm || !calculateBtn || !totalDisplay || !resultsSection || !chartCanvas || !suggestionText) {
    console.error("One or more critical elements missing. Calculator may not function properly.");
    return;
  }

  calculateBtn.addEventListener("click", function () {
    console.log("Calculate button clicked!"); // Debug: Confirm this runs

    // Emission calculations (in kg CO2e per year)
    const emissions = {
      Transportation:
        val("petrolCar") * 0.192 +
        val("dieselCar") * 0.171 +
        val("petrolTwoWheeler") * 0.04 +
        val("electricTwoWheeler") * 0.028 +
        val("busDistance") * 0.0152 +
        val("trainDistance") * 0.03,
      Electricity: val("electricityUsage") * 0.7,
      Food:
        val("meatConsumption") * 20 +
        val("dairyConsumption") * 11 +
        val("fishConsumption") * 7.5 +
        val("fruitsConsumption") * 0.9 +
        val("vegetablesConsumption") * 1.2 +
        val("grainsConsumption") * 2 +
        val("pulsesConsumption") * 1,
      Waste: val("wasteGenerated") * 0.1 * 52, // Convert weekly to yearly
      Water: val("waterUsage") * 0.005 * 365, // Convert daily to yearly
      Heating: val("heatingFuel") * 1.8,
    };
    console.log("Emissions values:", emissions); // Debug: Check values

    const totalKg = Object.values(emissions).reduce((sum, val) => sum + val, 0);
    console.log("Total kg CO2e:", totalKg); // Debug: Verify total
    const totalTons = totalKg / 1000;
    console.log("Total tons CO2e:", totalTons); // Debug: Verify conversion

    // Display result in the green container
    totalDisplay.innerText = `Your Total Carbon Footprint is: ${totalTons.toFixed(2)} tons CO₂e`;
    console.log("Total displayed:", totalDisplay.innerText); // Debug: Confirm update
    resultsSection.style.display = "block";
    console.log("Results section visible:", resultsSection.style.display); // Debug: Confirm visibility

    // AI-based suggestions to reduce carbon footprint
    const suggestions = [];
    if (emissions.Transportation > 16.67) {
      suggestions.push("Reduce transporatation: Try carpooling, using public transport, or biking to cut transportation emissions.");
    }
    if (emissions.Electricity > 33.33) {
      suggestions.push("Save electricity: Switch to LED bulbs, unplug devices, or consider solar panels to lower your energy footprint.");
    }
    if (emissions.Food > 50.00) {
      suggestions.push("Adjust diet: Reduce red meat and dairy consumption; opt for plant-based meals to decrease food-related emissions.");
    }
    if (emissions.Waste > 16.67) {
      suggestions.push("Minimize waste: Recycle, compost, and reduce single-use plastics to lower your waste footprint.");
    }
    if (emissions.Water > 16.67) {
      suggestions.push("Conserve water: Take shorter showers, fix leaks, and use water-efficient appliances to reduce water-related emissions.");
    }
    if (emissions.Heating > 26.67) {
      suggestions.push("Optimize heating: Insulate your home, lower the thermostat, or use a programmable thermostat to cut heating emissions.");
    }
    if (suggestions.length === 0) {
      suggestions.push("Your footprint is low! Maintain habits like using renewables, eating sustainably, and minimizing waste.");
    }

    // Update suggestionText in the cta section with AI icon and suggestions
    suggestionText.innerHTML = '<strong><i class="fas fa-robot ai-icon"></i> AI-Based Suggestions to Reduce Your Footprint:</strong><ul>' +
      suggestions.map(s => `<li>${s}</li>`).join("") + "</ul>";
    console.log("AI Suggestions displayed:", suggestions);

    // Render Chart
    const ctx = chartCanvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context for chart canvas");
      totalDisplay.innerText = "Error: Unable to render chart";
      return;
    }
    if (window.myChart) window.myChart.destroy();

    try {
      window.myChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: Object.keys(emissions),
          datasets: [{
            data: Object.values(emissions),
            backgroundColor: [
              "#FF6384", "#36A2EB", "#FFCE56",
              "#66BB6A", "#BA68C8", "#FFA726"
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#ffffff", // White text for legend
                font: {
                  size: 16 // Larger legend text
                }
              }
            },
            title: {
              display: true,
              text: "Carbon Footprint Breakdown by Category",
              color: "#ffffff", // White text for title
              font: {
                size: 18 // Larger title text
              }
            }
          }
        }
      });
      console.log("Chart rendered successfully");
    } catch (error) {
      console.error("Error rendering chart:", error);
      totalDisplay.innerText = `Your Total Carbon Footprint is: ${totalTons.toFixed(2)} tons CO₂e (Chart failed)`;
    }
  });
});