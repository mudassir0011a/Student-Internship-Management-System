document.addEventListener("DOMContentLoaded", function() {
  // Internship cards
  const jobCards = document.querySelectorAll('.job-card');
  // Filter elements
  const searchInput = document.querySelector('.search-input');
  const locationSelect = document.querySelector('#locationFilter');
  const typeSelect = document.querySelector('#typeFilter');
  const searchButton = document.getElementById("searchButton");

  // Common filter function
  function filterInternships() {
    const query = searchInput ? searchInput.value.toLowerCase() : "";
    // Normalize selected filters for exact matching
    const locationFilter = locationSelect ? locationSelect.value.toLowerCase().trim() : "";
    const typeFilter = typeSelect ? typeSelect.value.toLowerCase().trim() : "";

    jobCards.forEach(card => {
      // Retrieve texts from the card
      const titleEl = card.querySelector(".job-title");
      // updated selectors for location and type classes
      const cardLocationEl = card.querySelector(".location");
      const cardTypeEl = card.querySelector(".internship_type");

      const jobTitle = titleEl ? titleEl.textContent.toLowerCase() : "";
      const cardLocation = cardLocationEl ? cardLocationEl.textContent.toLowerCase().trim() : "";
      const cardType = cardTypeEl ? cardTypeEl.textContent.toLowerCase().trim() : "";

      // Check matching: if filters are empty or set to "all", ignore that filter.
      const matchesQuery = !query || jobTitle.indexOf(query) > -1;
      // Use substring matching for location
      const matchesLocation = (locationFilter && locationFilter !== "all") ? cardLocation.includes(locationFilter) : true;
      const matchesType = (typeFilter && typeFilter !== "all") ? cardType.includes(typeFilter) : true;

      card.style.display = (matchesQuery && matchesLocation && matchesType) ? "block" : "none";
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterInternships);
  }
  if (locationSelect) {
    locationSelect.addEventListener("change", filterInternships);
  }
  if (typeSelect) {
    typeSelect.addEventListener("change", filterInternships);
  }
  if (searchButton) {
    searchButton.addEventListener("click", function(e) {
      e.preventDefault();
      filterInternships();
    });
  }

  // Additional internship page specific functionality can be added here
});
