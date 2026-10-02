/* ========================================
   RESUME GENERATOR — script.js
   Sections: State, Storage, Utilities,
   Toast, Form Builders, Render, Overflow,
   PDF Export, JSON Backup, Mobile Tabs,
   Event Handlers, Init
   ======================================== */

"use strict";

// ========================================
// 1. STATE
// ========================================

/** Default empty state */
function createEmptyState() {
  return {
    personal: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      portfolio: ""
    },
    summary: "",
    education: [],
    experience: [],
    projects: [],
    skills: [],
    achievements: []
  };
}

/** Create a new education entry */
function createEducation() {
  return {
    id: uid(),
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    present: false,
    cgpa: "",
    location: ""
  };
}

/** Create a new experience entry */
function createExperience() {
  return {
    id: uid(),
    company: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    present: false,
    bullets: ""
  };
}

/** Create a new project entry */
function createProject() {
  return {
    id: uid(),
    name: "",
    techStack: "",
    link: "",
    bullets: ""
  };
}

/** Create a new skill group */
function createSkillGroup() {
  return {
    id: uid(),
    category: "",
    skills: ""
  };
}

/** Create a new achievement */
function createAchievement() {
  return {
    id: uid(),
    text: ""
  };
}

/** The state object — the single source of truth */
var state = createEmptyState();

/** Active mobile tab (in-memory only, not persisted) */
var activeMobileTab = "edit";

// ========================================
// 2. STORAGE (localStorage persistence)
// ========================================

var STORAGE_KEY = "resume_generator_state";

/** Save state to localStorage (called via debounce) */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage full or unavailable — silently ignore
  }
}

/** Load state from localStorage */
function loadState() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var parsed = JSON.parse(saved);
      // Merge into default state so new keys are always present
      state = Object.assign(createEmptyState(), parsed);
      // Ensure every list item has an id (backward compat)
      ["education", "experience", "projects", "skills", "achievements"].forEach(function (key) {
        if (Array.isArray(state[key])) {
          state[key].forEach(function (item) {
            if (!item.id) item.id = uid();
          });
        }
      });
    }
  } catch (e) {
    state = createEmptyState();
  }
}

// ========================================
// 3. UTILITIES
// ========================================

/** Simple unique-id generator */
var _uidCounter = 0;
function uid() {
  return "id_" + Date.now().toString(36) + "_" + (++_uidCounter);
}

/** Debounce helper */
function debounce(fn, delay) {
  var timer;
  return function () {
    var context = this;
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, delay);
  };
}

/** Escape HTML to prevent XSS */
function esc(str) {
  if (!str) return "";
  var div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/** Convert escaped text with line breaks preserved */
function escWithBreaks(str) {
  if (!str) return "";
  return esc(str);
}

/** Format date string for display (YYYY-MM -> Mon YYYY) */
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(dateStr) {
  if (!dateStr) return "";
  var parts = dateStr.split("-");
  if (parts.length === 2) {
    var monthIdx = parseInt(parts[1], 10) - 1;
    return (MONTHS[monthIdx] || "") + " " + parts[0];
  }
  return esc(dateStr);
}

/** Build a date range string */
function dateRange(start, end, isPresent) {
  var s = formatDate(start);
  var e = isPresent ? "Present" : formatDate(end);
  if (!s && !e) return "";
  if (s && e) return s + " – " + e;
  return s || e;
}

// ========================================
// 3b. TOAST NOTIFICATIONS
// ========================================

/** Show a toast message that auto-dismisses */
function showToast(message, type) {
  var container = document.getElementById("toast-container");
  if (!container) return;

  var toast = document.createElement("div");
  toast.className = "toast" + (type ? " toast-" + type : "");
  toast.textContent = message;
  container.appendChild(toast);

  // Auto-dismiss after 3 seconds
  setTimeout(function () {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    });
  }, 3000);
}

// ========================================
// 4. FORM BUILDERS
// Build the dynamic list HTML for each section
// ========================================

/** Build all dynamic lists from current state */
function buildDynamicLists() {
  buildEducationList();
  buildExperienceList();
  buildProjectsList();
  buildSkillsList();
  buildAchievementsList();
}

/** Reorder actions HTML */
function reorderActions(section, index, total) {
  var upDisabled = index === 0 ? " disabled" : "";
  var downDisabled = index === total - 1 ? " disabled" : "";
  return '<div class="list-item-actions">' +
    '<button type="button" class="btn-icon btn-up" data-section="' + section + '" data-index="' + index + '"' + upDisabled + ' title="Move up" aria-label="Move up">&#9650;</button>' +
    '<button type="button" class="btn-icon btn-down" data-section="' + section + '" data-index="' + index + '"' + downDisabled + ' title="Move down" aria-label="Move down">&#9660;</button>' +
    '<button type="button" class="btn-icon btn-remove" data-section="' + section + '" data-index="' + index + '" title="Remove" aria-label="Remove">&times;</button>' +
    '</div>';
}

// --- Education ---
function buildEducationList() {
  var container = document.getElementById("education-list");
  if (!container) return;
  var html = "";
  state.education.forEach(function (edu, i) {
    var n = i + 1;
    var checkedAttr = edu.present ? " checked" : "";
    var endDisabled = edu.present ? " disabled" : "";
    html += '<div class="list-item" data-id="' + edu.id + '">' +
      '<div class="list-item-header"><span class="list-item-title">Education #' + n + '</span>' + reorderActions("education", i, state.education.length) + '</div>' +
      '<div class="form-group"><label for="edu-inst-' + i + '">Institution</label><input type="text" id="edu-inst-' + i + '" data-list="education" data-index="' + i + '" data-key="institution" value="' + esc(edu.institution) + '" placeholder="University Name"></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label for="edu-deg-' + i + '">Degree</label><input type="text" id="edu-deg-' + i + '" data-list="education" data-index="' + i + '" data-key="degree" value="' + esc(edu.degree) + '" placeholder="B.Tech"></div>' +
        '<div class="form-group"><label for="edu-field-' + i + '">Field of Study</label><input type="text" id="edu-field-' + i + '" data-list="education" data-index="' + i + '" data-key="field" value="' + esc(edu.field) + '" placeholder="Computer Science"></div>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label for="edu-start-' + i + '">Start Date</label><input type="month" id="edu-start-' + i + '" data-list="education" data-index="' + i + '" data-key="startDate" value="' + esc(edu.startDate) + '"></div>' +
        '<div class="form-group"><label for="edu-end-' + i + '">End Date</label><input type="month" id="edu-end-' + i + '" data-list="education" data-index="' + i + '" data-key="endDate" value="' + esc(edu.endDate) + '"' + endDisabled + '>' +
          '<div class="checkbox-row"><input type="checkbox" id="edu-present-' + i + '" data-list="education" data-index="' + i + '" data-key="present"' + checkedAttr + '><label for="edu-present-' + i + '">Present</label></div>' +
        '</div>' +
      '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label for="edu-cgpa-' + i + '">CGPA / Percentage</label><input type="text" id="edu-cgpa-' + i + '" data-list="education" data-index="' + i + '" data-key="cgpa" value="' + esc(edu.cgpa) + '" placeholder="8.5 / 10"></div>' +
        '<div class="form-group"><label for="edu-loc-' + i + '">Location</label><input type="text" id="edu-loc-' + i + '" data-list="education" data-index="' + i + '" data-key="location" value="' + esc(edu.location) + '" placeholder="City, State"></div>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// --- Experience ---
function buildExperienceList() {
  var container = document.getElementById("experience-list");
  if (!container) return;
  var html = "";
  state.experience.forEach(function (exp, i) {
    var n = i + 1;
    var checkedAttr = exp.present ? " checked" : "";
    var endDisabled = exp.present ? " disabled" : "";
    html += '<div class="list-item" data-id="' + exp.id + '">' +
      '<div class="list-item-header"><span class="list-item-title">Experience #' + n + '</span>' + reorderActions("experience", i, state.experience.length) + '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label for="exp-comp-' + i + '">Company</label><input type="text" id="exp-comp-' + i + '" data-list="experience" data-index="' + i + '" data-key="company" value="' + esc(exp.company) + '" placeholder="Company Name"></div>' +
        '<div class="form-group"><label for="exp-role-' + i + '">Role</label><input type="text" id="exp-role-' + i + '" data-list="experience" data-index="' + i + '" data-key="role" value="' + esc(exp.role) + '" placeholder="Software Engineer Intern"></div>' +
      '</div>' +
      '<div class="form-group"><label for="exp-loc-' + i + '">Location</label><input type="text" id="exp-loc-' + i + '" data-list="experience" data-index="' + i + '" data-key="location" value="' + esc(exp.location) + '" placeholder="City, State"></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label for="exp-start-' + i + '">Start Date</label><input type="month" id="exp-start-' + i + '" data-list="experience" data-index="' + i + '" data-key="startDate" value="' + esc(exp.startDate) + '"></div>' +
        '<div class="form-group"><label for="exp-end-' + i + '">End Date</label><input type="month" id="exp-end-' + i + '" data-list="experience" data-index="' + i + '" data-key="endDate" value="' + esc(exp.endDate) + '"' + endDisabled + '>' +
          '<div class="checkbox-row"><input type="checkbox" id="exp-present-' + i + '" data-list="experience" data-index="' + i + '" data-key="present"' + checkedAttr + '><label for="exp-present-' + i + '">Present</label></div>' +
        '</div>' +
      '</div>' +
      '<div class="form-group"><label for="exp-bullets-' + i + '">Description (one bullet per line)</label><textarea id="exp-bullets-' + i + '" data-list="experience" data-index="' + i + '" data-key="bullets" rows="4" placeholder="Built a REST API that improved response time by 40%\nCollaborated with a team of 5 engineers...">' + esc(exp.bullets) + '</textarea></div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// --- Projects ---
function buildProjectsList() {
  var container = document.getElementById("projects-list");
  if (!container) return;
  var html = "";
  state.projects.forEach(function (proj, i) {
    var n = i + 1;
    html += '<div class="list-item" data-id="' + proj.id + '">' +
      '<div class="list-item-header"><span class="list-item-title">Project #' + n + '</span>' + reorderActions("projects", i, state.projects.length) + '</div>' +
      '<div class="form-group"><label for="proj-name-' + i + '">Project Name</label><input type="text" id="proj-name-' + i + '" data-list="projects" data-index="' + i + '" data-key="name" value="' + esc(proj.name) + '" placeholder="My Awesome Project"></div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label for="proj-tech-' + i + '">Tech Stack</label><input type="text" id="proj-tech-' + i + '" data-list="projects" data-index="' + i + '" data-key="techStack" value="' + esc(proj.techStack) + '" placeholder="React, Node.js, MongoDB"></div>' +
        '<div class="form-group"><label for="proj-link-' + i + '">Link</label><input type="url" id="proj-link-' + i + '" data-list="projects" data-index="' + i + '" data-key="link" value="' + esc(proj.link) + '" placeholder="https://github.com/..."></div>' +
      '</div>' +
      '<div class="form-group"><label for="proj-bullets-' + i + '">Description (one bullet per line)</label><textarea id="proj-bullets-' + i + '" data-list="projects" data-index="' + i + '" data-key="bullets" rows="3" placeholder="Designed and implemented the frontend...\nIntegrated payment gateway...">' + esc(proj.bullets) + '</textarea></div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// --- Skills ---
function buildSkillsList() {
  var container = document.getElementById("skills-list");
  if (!container) return;
  var html = "";
  state.skills.forEach(function (group, i) {
    var n = i + 1;
    html += '<div class="list-item" data-id="' + group.id + '">' +
      '<div class="list-item-header"><span class="list-item-title">Skill Group #' + n + '</span>' + reorderActions("skills", i, state.skills.length) + '</div>' +
      '<div class="form-row">' +
        '<div class="form-group"><label for="skill-cat-' + i + '">Category</label><input type="text" id="skill-cat-' + i + '" data-list="skills" data-index="' + i + '" data-key="category" value="' + esc(group.category) + '" placeholder="Languages"></div>' +
        '<div class="form-group"><label for="skill-list-' + i + '">Skills (comma-separated)</label><input type="text" id="skill-list-' + i + '" data-list="skills" data-index="' + i + '" data-key="skills" value="' + esc(group.skills) + '" placeholder="Python, JavaScript, C++"></div>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// --- Achievements ---
function buildAchievementsList() {
  var container = document.getElementById("achievements-list");
  if (!container) return;
  var html = "";
  state.achievements.forEach(function (ach, i) {
    var n = i + 1;
    html += '<div class="list-item" data-id="' + ach.id + '">' +
      '<div class="list-item-header"><span class="list-item-title">Achievement #' + n + '</span>' + reorderActions("achievements", i, state.achievements.length) + '</div>' +
      '<div class="form-group"><label for="ach-text-' + i + '">Description</label><input type="text" id="ach-text-' + i + '" data-list="achievements" data-index="' + i + '" data-key="text" value="' + esc(ach.text) + '" placeholder="Won first place in XYZ Hackathon 2024"></div>' +
    '</div>';
  });
  container.innerHTML = html;
}

// ========================================
// 5. RENDER — generates the resume preview HTML
// ========================================

function render() {
  var preview = document.getElementById("resume-preview");
  if (!preview) return;

  var html = "";
  var hasAnyContent = false;

  // --- Name ---
  if (state.personal.name.trim()) {
    hasAnyContent = true;
    html += '<h1 class="resume-name">' + esc(state.personal.name.trim()) + '</h1>';
  }

  // --- Title ---
  if (state.personal.title.trim()) {
    hasAnyContent = true;
    html += '<p class="resume-title">' + esc(state.personal.title.trim()) + '</p>';
  }

  // --- Contact line ---
  var contactParts = [];
  if (state.personal.email.trim()) contactParts.push(esc(state.personal.email.trim()));
  if (state.personal.phone.trim()) contactParts.push(esc(state.personal.phone.trim()));
  if (state.personal.location.trim()) contactParts.push(esc(state.personal.location.trim()));
  if (state.personal.linkedin.trim()) contactParts.push(esc(state.personal.linkedin.trim()));
  if (state.personal.github.trim()) contactParts.push(esc(state.personal.github.trim()));
  if (state.personal.portfolio.trim()) contactParts.push(esc(state.personal.portfolio.trim()));

  if (contactParts.length > 0) {
    hasAnyContent = true;
    html += '<p class="resume-contact">' + contactParts.join(' | ') + '</p>';
  }

  // --- Summary ---
  if (state.summary.trim()) {
    hasAnyContent = true;
    html += '<h2 class="resume-section-heading">Summary</h2>';
    html += '<p class="resume-summary-text">' + esc(state.summary.trim()) + '</p>';
  }

  // --- Education ---
  var eduEntries = state.education.filter(function (e) {
    return e.institution.trim() || e.degree.trim() || e.field.trim();
  });
  if (eduEntries.length > 0) {
    hasAnyContent = true;
    html += '<h2 class="resume-section-heading">Education</h2>';
    eduEntries.forEach(function (edu) {
      var dates = dateRange(edu.startDate, edu.endDate, edu.present);
      var degreeLine = [esc(edu.degree.trim()), esc(edu.field.trim())].filter(Boolean).join(" in ");
      var subParts = [];
      if (degreeLine) subParts.push(degreeLine);
      if (edu.cgpa.trim()) subParts.push("CGPA: " + esc(edu.cgpa.trim()));
      if (edu.location.trim()) subParts.push(esc(edu.location.trim()));

      html += '<div class="resume-entry">';
      html += '<div class="resume-entry-header"><span class="resume-entry-primary">' + esc(edu.institution.trim()) + '</span>';
      if (dates) html += '<span class="resume-entry-date">' + dates + '</span>';
      html += '</div>';
      if (subParts.length) html += '<p class="resume-entry-sub">' + subParts.join(' | ') + '</p>';
      html += '</div>';
    });
  }

  // --- Experience ---
  var expEntries = state.experience.filter(function (e) {
    return e.company.trim() || e.role.trim();
  });
  if (expEntries.length > 0) {
    hasAnyContent = true;
    html += '<h2 class="resume-section-heading">Experience</h2>';
    expEntries.forEach(function (exp) {
      var dates = dateRange(exp.startDate, exp.endDate, exp.present);
      html += '<div class="resume-entry">';
      html += '<div class="resume-entry-header"><span class="resume-entry-primary">' + esc(exp.role.trim()) + '</span>';
      if (dates) html += '<span class="resume-entry-date">' + dates + '</span>';
      html += '</div>';
      var subParts = [];
      if (exp.company.trim()) subParts.push(esc(exp.company.trim()));
      if (exp.location.trim()) subParts.push(esc(exp.location.trim()));
      if (subParts.length) html += '<p class="resume-entry-sub">' + subParts.join(' | ') + '</p>';

      // Bullets
      var bullets = exp.bullets.split("\n").map(function (b) { return b.trim(); }).filter(Boolean);
      if (bullets.length > 0) {
        html += '<ul class="resume-bullets">';
        bullets.forEach(function (b) {
          html += '<li>' + esc(b) + '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });
  }

  // --- Projects ---
  var projEntries = state.projects.filter(function (p) {
    return p.name.trim();
  });
  if (projEntries.length > 0) {
    hasAnyContent = true;
    html += '<h2 class="resume-section-heading">Projects</h2>';
    projEntries.forEach(function (proj) {
      html += '<div class="resume-entry">';
      html += '<div class="resume-entry-header"><span class="resume-entry-primary">' + esc(proj.name.trim()) + '</span></div>';
      var metaParts = [];
      if (proj.techStack.trim()) metaParts.push('<span class="resume-tech">' + esc(proj.techStack.trim()) + '</span>');
      if (proj.link.trim()) metaParts.push('<span class="resume-link">' + esc(proj.link.trim()) + '</span>');
      if (metaParts.length) html += '<p class="resume-entry-sub">' + metaParts.join(' | ') + '</p>';

      var bullets = proj.bullets.split("\n").map(function (b) { return b.trim(); }).filter(Boolean);
      if (bullets.length > 0) {
        html += '<ul class="resume-bullets">';
        bullets.forEach(function (b) {
          html += '<li>' + esc(b) + '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });
  }

  // --- Skills ---
  var skillEntries = state.skills.filter(function (s) {
    return s.category.trim() || s.skills.trim();
  });
  if (skillEntries.length > 0) {
    hasAnyContent = true;
    html += '<h2 class="resume-section-heading">Skills</h2>';
    skillEntries.forEach(function (group) {
      html += '<p class="resume-skill-line">';
      if (group.category.trim()) html += '<span class="resume-skill-label">' + esc(group.category.trim()) + ':</span> ';
      html += esc(group.skills.trim());
      html += '</p>';
    });
  }

  // --- Achievements ---
  var achEntries = state.achievements.filter(function (a) {
    return a.text.trim();
  });
  if (achEntries.length > 0) {
    hasAnyContent = true;
    html += '<h2 class="resume-section-heading">Achievements</h2>';
    html += '<ul class="resume-bullets">';
    achEntries.forEach(function (ach) {
      html += '<li>' + esc(ach.text.trim()) + '</li>';
    });
    html += '</ul>';
  }

  // Show placeholder if nothing
  if (!hasAnyContent) {
    html = '<p class="preview-placeholder">Start typing to see your resume here...</p>';
  }

  preview.innerHTML = html;

  // Check overflow after rendering
  checkOverflow();
}

// ========================================
// 5b. OVERFLOW DETECTION
// ========================================

/** A4 page content height in pixels (~297mm - 30mm padding = 267mm usable) */
function getA4ContentHeightPx() {
  // 297mm total - 15mm top padding - 15mm bottom padding = 267mm usable content
  // Convert mm to px: 1mm ≈ 3.7795px at 96dpi
  return 267 * 3.7795;
}

/** Check if resume content exceeds one A4 page */
function checkOverflow() {
  var preview = document.getElementById("resume-preview");
  var badge = document.getElementById("overflow-badge");
  if (!preview || !badge) return;

  var contentHeight = preview.scrollHeight;
  var maxHeight = getA4ContentHeightPx();

  if (contentHeight > maxHeight) {
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}

// ========================================
// 6. PDF EXPORT
// ========================================

/** Set document title for PDF filename and trigger print */
function downloadPDF() {
  var originalTitle = document.title;
  var name = state.personal.name.trim();
  document.title = name ? name + " - Resume" : "Resume";

  window.print();

  // Restore title after print dialog closes
  // Use a small delay because some browsers fire events synchronously
  setTimeout(function () {
    document.title = originalTitle;
  }, 1000);
}

// ========================================
// 7. JSON BACKUP — Save & Load
// ========================================

/** Download current state as JSON */
function saveJSON() {
  var dataStr = JSON.stringify(state, null, 2);
  var blob = new Blob([dataStr], { type: "application/json" });
  var url = URL.createObjectURL(blob);

  var a = document.createElement("a");
  a.href = url;
  a.download = "resume-data.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast("Resume data saved as JSON", "success");
}

/** Show inline JSON error */
function showJSONError(msg) {
  var errorEl = document.getElementById("json-error");
  var msgEl = document.getElementById("json-error-msg");
  if (!errorEl || !msgEl) return;
  msgEl.textContent = msg;
  errorEl.hidden = false;
  showToast("Failed to load JSON file", "error");
}

/** Hide JSON error banner */
function hideJSONError() {
  var errorEl = document.getElementById("json-error");
  if (errorEl) errorEl.hidden = true;
}

/** Validate imported JSON structure */
function validateResumeJSON(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return "Invalid format: expected a JSON object.";
  }

  // Must have personal as an object
  if (data.personal !== undefined && (typeof data.personal !== "object" || data.personal === null || Array.isArray(data.personal))) {
    return "Invalid format: 'personal' must be an object.";
  }

  // summary should be a string if present
  if (data.summary !== undefined && typeof data.summary !== "string") {
    return "Invalid format: 'summary' must be a string.";
  }

  // List sections must be arrays if present
  var listSections = ["education", "experience", "projects", "skills", "achievements"];
  for (var i = 0; i < listSections.length; i++) {
    var key = listSections[i];
    if (data[key] !== undefined && !Array.isArray(data[key])) {
      return "Invalid format: '" + key + "' must be an array.";
    }
  }

  return null; // valid
}

/** Load JSON from file input */
function loadJSON(file) {
  hideJSONError();

  if (!file) return;

  // Check file type
  if (!file.name.endsWith(".json") && file.type !== "application/json") {
    showJSONError("Please select a .json file.");
    return;
  }

  var reader = new FileReader();

  reader.onerror = function () {
    showJSONError("Could not read the file. Please try again.");
  };

  reader.onload = function (e) {
    var text = e.target.result;
    var parsed;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      showJSONError("Invalid JSON: " + err.message);
      return;
    }

    var error = validateResumeJSON(parsed);
    if (error) {
      showJSONError(error);
      return;
    }

    // Safely merge into state
    var merged = createEmptyState();

    // Merge personal fields
    if (parsed.personal && typeof parsed.personal === "object") {
      Object.keys(merged.personal).forEach(function (key) {
        if (typeof parsed.personal[key] === "string") {
          merged.personal[key] = parsed.personal[key];
        }
      });
    }

    // Merge summary
    if (typeof parsed.summary === "string") {
      merged.summary = parsed.summary;
    }

    // Merge list sections with id assignment
    ["education", "experience", "projects", "skills", "achievements"].forEach(function (section) {
      if (Array.isArray(parsed[section])) {
        merged[section] = parsed[section].map(function (item) {
          if (typeof item === "object" && item !== null && !Array.isArray(item)) {
            if (!item.id) item.id = uid();
            return item;
          }
          return null;
        }).filter(Boolean);
      }
    });

    state = merged;
    populateStaticFields();
    buildDynamicLists();
    render();
    saveState();

    showToast("Resume data loaded from JSON", "success");
  };

  reader.readAsText(file);
}

// ========================================
// 8. MOBILE TAB SWITCHING
// ========================================

/** Apply the active mobile tab visibility */
function applyMobileTab() {
  var editorPane = document.getElementById("editor-pane");
  var previewPane = document.getElementById("preview-pane");
  var tabs = document.querySelectorAll(".mobile-tab");

  if (!editorPane || !previewPane) return;

  // Only apply on mobile widths
  var isMobile = window.innerWidth <= 900;

  if (!isMobile) {
    // Desktop: both visible, remove mobile-hidden
    editorPane.classList.remove("mobile-hidden");
    previewPane.classList.remove("mobile-hidden");
    return;
  }

  if (activeMobileTab === "edit") {
    editorPane.classList.remove("mobile-hidden");
    previewPane.classList.add("mobile-hidden");
  } else {
    editorPane.classList.add("mobile-hidden");
    previewPane.classList.remove("mobile-hidden");
  }

  // Update tab button states
  tabs.forEach(function (tab) {
    var isActive = tab.dataset.tab === activeMobileTab;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

/** Handle mobile tab click */
function handleMobileTabClick(e) {
  var tab = e.target.closest(".mobile-tab");
  if (!tab) return;

  activeMobileTab = tab.dataset.tab;
  applyMobileTab();
}

// ========================================
// 9. EVENT HANDLERS
// ========================================

/** Debounced save */
var debouncedSave = debounce(saveState, 300);

/** Sync form input to state, rebuild preview */
function handleInput(e) {
  var target = e.target;

  // --- Static personal fields ---
  if (target.dataset.field) {
    var parts = target.dataset.field.split(".");
    if (parts.length === 2 && parts[0] === "personal") {
      state.personal[parts[1]] = target.value;
    } else if (parts.length === 1 && parts[0] === "summary") {
      state.summary = target.value;
      // Update char counter
      var counter = document.getElementById("summary-counter");
      if (counter) counter.textContent = target.value.length + " / 500";
    }
    render();
    debouncedSave();
    return;
  }

  // --- Dynamic list fields ---
  if (target.dataset.list) {
    var section = target.dataset.list;
    var index = parseInt(target.dataset.index, 10);
    var key = target.dataset.key;
    if (state[section] && state[section][index] !== undefined && key) {
      if (target.type === "checkbox") {
        state[section][index][key] = target.checked;
        // If "present" is toggled, disable/enable the end date field
        if (key === "present") {
          var listItem = target.closest(".list-item");
          if (listItem) {
            var endDateInput = listItem.querySelector('input[data-key="endDate"]');
            if (endDateInput) {
              endDateInput.disabled = target.checked;
              if (target.checked) {
                state[section][index].endDate = "";
                endDateInput.value = "";
              }
            }
          }
        }
      } else {
        state[section][index][key] = target.value;
      }
      render();
      debouncedSave();
    }
    return;
  }
}

/** Handle clicks: accordion toggle, add/remove/reorder */
function handleClick(e) {
  var target = e.target;

  // --- Accordion toggle ---
  var header = target.closest(".accordion-header");
  if (header) {
    var body = header.nextElementSibling;
    var isOpen = body.classList.contains("open");
    body.classList.toggle("open");
    header.classList.toggle("active");
    header.setAttribute("aria-expanded", !isOpen);
    // Update icon
    var icon = header.querySelector(".accordion-icon");
    if (icon) icon.innerHTML = isOpen ? "&#9660;" : "&#9650;";
    return;
  }

  // --- Add buttons ---
  var addBtn = target.closest("[data-add]");
  if (addBtn) {
    var section = addBtn.dataset.add;
    var creators = {
      education: createEducation,
      experience: createExperience,
      projects: createProject,
      skills: createSkillGroup,
      achievements: createAchievement
    };
    if (creators[section]) {
      state[section].push(creators[section]());
      buildDynamicLists();
      render();
      debouncedSave();
    }
    return;
  }

  // --- Remove buttons ---
  var removeBtn = target.closest(".btn-remove");
  if (removeBtn) {
    var section = removeBtn.dataset.section;
    var index = parseInt(removeBtn.dataset.index, 10);
    if (state[section]) {
      state[section].splice(index, 1);
      buildDynamicLists();
      render();
      debouncedSave();
    }
    return;
  }

  // --- Move Up ---
  var upBtn = target.closest(".btn-up");
  if (upBtn) {
    var section = upBtn.dataset.section;
    var index = parseInt(upBtn.dataset.index, 10);
    if (state[section] && index > 0) {
      var temp = state[section][index];
      state[section][index] = state[section][index - 1];
      state[section][index - 1] = temp;
      buildDynamicLists();
      render();
      debouncedSave();
    }
    return;
  }

  // --- Move Down ---
  var downBtn = target.closest(".btn-down");
  if (downBtn) {
    var section = downBtn.dataset.section;
    var index = parseInt(downBtn.dataset.index, 10);
    if (state[section] && index < state[section].length - 1) {
      var temp = state[section][index];
      state[section][index] = state[section][index + 1];
      state[section][index + 1] = temp;
      buildDynamicLists();
      render();
      debouncedSave();
    }
    return;
  }
}

/** Populate static personal/summary fields from state */
function populateStaticFields() {
  // Personal fields
  var personalFields = ["name", "title", "email", "phone", "location", "linkedin", "github", "portfolio"];
  personalFields.forEach(function (key) {
    var input = document.querySelector('[data-field="personal.' + key + '"]');
    if (input) input.value = state.personal[key] || "";
  });

  // Summary
  var summaryInput = document.querySelector('[data-field="summary"]');
  if (summaryInput) {
    summaryInput.value = state.summary || "";
    var counter = document.getElementById("summary-counter");
    if (counter) counter.textContent = (state.summary || "").length + " / 500";
  }
}

// --- Load Sample Data ---
function loadSampleData() {
  state.personal = {
    name: "Arjun Sharma",
    title: "Computer Science Student & Full-Stack Developer",
    email: "arjun.sharma@email.com",
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    linkedin: "https://linkedin.com/in/arjunsharma",
    github: "https://github.com/arjunsharma",
    portfolio: "https://arjunsharma.dev"
  };

  state.summary = "Motivated second-year B.Tech Computer Science student with a strong foundation in data structures, algorithms, and full-stack web development. Passionate about building scalable applications and contributing to open-source projects. Seeking internship opportunities to apply technical skills in a real-world environment.";

  state.education = [
    {
      id: uid(),
      institution: "Indian Institute of Technology, Bombay",
      degree: "B.Tech",
      field: "Computer Science and Engineering",
      startDate: "2024-08",
      endDate: "",
      present: true,
      cgpa: "8.7 / 10",
      location: "Mumbai, Maharashtra"
    },
    {
      id: uid(),
      institution: "Delhi Public School, R.K. Puram",
      degree: "Class XII (CBSE)",
      field: "Science (PCM)",
      startDate: "2022-04",
      endDate: "2024-03",
      present: false,
      cgpa: "95.4%",
      location: "New Delhi"
    }
  ];

  state.experience = [
    {
      id: uid(),
      company: "TechStart Solutions",
      role: "Software Developer Intern",
      location: "Remote",
      startDate: "2025-05",
      endDate: "2025-07",
      present: false,
      bullets: "Developed RESTful APIs using Node.js and Express, serving 10,000+ daily requests\nImplemented JWT-based authentication reducing unauthorized access incidents by 90%\nOptimized database queries in PostgreSQL, improving page load times by 35%\nCollaborated with a 5-member agile team using Git, Jira, and daily standups"
    },
    {
      id: uid(),
      company: "Google Developer Student Club, IIT Bombay",
      role: "Web Development Lead",
      location: "Mumbai",
      startDate: "2025-01",
      endDate: "",
      present: true,
      bullets: "Lead a team of 8 developers to build and maintain the club website\nOrganized 4 workshops on React.js and modern web development for 200+ students\nMentored 15 junior members on HTML, CSS, JavaScript fundamentals"
    }
  ];

  state.projects = [
    {
      id: uid(),
      name: "StudyBuddy — Collaborative Learning Platform",
      techStack: "React, Node.js, MongoDB, Socket.io",
      link: "https://github.com/arjunsharma/studybuddy",
      bullets: "Built a real-time collaborative study platform with video chat and shared whiteboards\nImplemented WebSocket-based real-time document editing for 50+ concurrent users\nDesigned a responsive Material UI interface with dark mode support\nDeployed on AWS EC2 with CI/CD pipeline using GitHub Actions"
    },
    {
      id: uid(),
      name: "WeatherNow — Weather Forecast CLI Tool",
      techStack: "Python, OpenWeatherMap API, Click",
      link: "https://github.com/arjunsharma/weathernow",
      bullets: "Created a command-line weather tool with 5-day forecasts and location auto-detection\nImplemented caching with SQLite to reduce API calls by 60%\nPublished as a pip package with 500+ downloads on PyPI"
    }
  ];

  state.skills = [
    { id: uid(), category: "Languages", skills: "Python, JavaScript, C++, Java, SQL, HTML, CSS" },
    { id: uid(), category: "Frameworks & Libraries", skills: "React, Node.js, Express, Django, Bootstrap, Tailwind CSS" },
    { id: uid(), category: "Databases & Tools", skills: "MongoDB, PostgreSQL, MySQL, Git, Docker, AWS, Linux" },
    { id: uid(), category: "Concepts", skills: "Data Structures, Algorithms, OOP, REST APIs, Agile, CI/CD" }
  ];

  state.achievements = [
    { id: uid(), text: "Secured All India Rank 1,245 in JEE Advanced 2024 (out of 150,000+ candidates)" },
    { id: uid(), text: "Winner, Smart India Hackathon 2025 — Built an AI-powered crop disease detection system" },
    { id: uid(), text: "Solved 400+ problems on LeetCode and CodeForces (Rating: 1650+)" },
    { id: uid(), text: "AWS Certified Cloud Practitioner (2025)" },
    { id: uid(), text: "Published research paper on efficient graph algorithms at ICACCS 2025 student track" }
  ];

  populateStaticFields();
  buildDynamicLists();
  render();
  saveState();
}

/** Reset everything */
function resetAll() {
  if (!confirm("Are you sure you want to reset all data? This cannot be undone.")) return;
  state = createEmptyState();
  localStorage.removeItem(STORAGE_KEY);
  populateStaticFields();
  buildDynamicLists();
  render();
  showToast("All data has been reset", "success");
}

// ========================================
// 10. INIT — Bootstrap the app
// ========================================

(function init() {
  // Load saved state
  loadState();

  // Populate form from state
  populateStaticFields();
  buildDynamicLists();

  // Initial render
  render();

  // Event delegation on the form for input/change
  var form = document.getElementById("resume-form");
  form.addEventListener("input", handleInput);
  form.addEventListener("change", handleInput);

  // Event delegation for clicks (accordion, add, remove, reorder)
  form.addEventListener("click", handleClick);

  // Top bar buttons
  document.getElementById("btn-load-sample").addEventListener("click", loadSampleData);
  document.getElementById("btn-reset").addEventListener("click", resetAll);

  // PDF download
  document.getElementById("btn-download-pdf").addEventListener("click", downloadPDF);

  // JSON save
  document.getElementById("btn-save-json").addEventListener("click", saveJSON);

  // JSON load
  document.getElementById("btn-load-json").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (file) loadJSON(file);
    // Reset file input so the same file can be re-selected
    e.target.value = "";
  });

  // JSON error dismiss
  document.getElementById("json-error-close").addEventListener("click", hideJSONError);

  // Mobile tab switching
  var tabNav = document.getElementById("mobile-tabs");
  tabNav.addEventListener("click", handleMobileTabClick);

  // Apply mobile tab state on init and resize
  applyMobileTab();
  window.addEventListener("resize", debounce(applyMobileTab, 100));

  // Keyboard: let the file-label act like a button with Enter/Space
  var fileLabel = document.querySelector(".btn-file-label");
  if (fileLabel) {
    fileLabel.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        document.getElementById("btn-load-json").click();
      }
    });
  }
})();
