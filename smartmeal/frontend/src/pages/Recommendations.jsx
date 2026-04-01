
// ============================================================
// MEMBER 6 — UI + Feedback
// This page is owned by Member 6.
//
// Your responsibilities:
// 1. Build the input form (ingredients, diet, cuisine, course)
// 2. Call POST http://localhost:8000/api/recipes/recommend
//    with body: { ingredients, diet, cuisine }
// 3. Display results (name, cuisine, diet, course, similarity_score)
// 4. Add 👍 / 👎 feedback buttons on each result
// 5. Store feedback in the database
// ============================================================

import React from 'react';

function Recommendations() {
  return (
    <div className="card">
      <h2>Recipe Recommendations</h2>
      <p>Member 6 — please build this page.</p>
    </div>
  );
}

export default Recommendations;
