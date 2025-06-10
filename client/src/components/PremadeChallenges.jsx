import React, { useState } from 'react';
import './PremadeChallenges.css'; 

export default function PremadeChallenges({
  countries = [],           // [{ code: "US", name: "United States" }, …]
  onStart                   // fn({ gender, country, platform, timer }) 
}) {
  const [gender, setGender] = useState(null);       // null = “Any”
  const [country, setCountry] = useState(null);     // null = “Any”
  const [platform, setPlatform] = useState(null);   // null = “Any” (“tv” or “movie”)
  const [timer, setTimer] = useState(null);         // null = “No limit”

  // Toggle logic for gender: clicking the same toggles off
  const toggleGender = (choice) => {
    setGender((prev) => (prev === choice ? null : choice));
  };

  // Toggle logic for platform: clicking same toggles off
  const togglePlatform = (choice) => {
    setPlatform((prev) => (prev === choice ? null : choice));
  };

  // Toggle logic for timer buttons: clicking same toggles off
  const toggleTimer = (seconds) => {
    setTimer((prev) => (prev === seconds ? null : seconds));
  };

  // ───────────────────────────────────────────────────────────────────────
  // NEW: compute whether at least one filter is non‐null
  const hasAnyFilter =
    gender !== null ||
    platform !== null ||
    timer !== null ||
    country !== null;
  // ───────────────────────────────────────────────────────────────────────

  const handleStart = () => {
    // If no filter is selected, do nothing
    if (!hasAnyFilter) return;
    onStart({ gender, country, platform, timer });
  };

  return (
    <>
      {/* Gender Buttons */}
      <div className="pc-section">
        <label className="pc-label">Gender:</label>
        <div className="pc-buttons-group">
          <button
            onClick={() => toggleGender("male")}
            className={`pc-button 
              ${gender === "male" 
                ? "gender-selected-male" 
                : "gender-unselected"}`}
          >
            MALE
          </button>

          <button
            onClick={() => toggleGender("female")}
            className={`pc-button 
              ${gender === "female" 
                ? "gender-selected-female" 
                : "gender-unselected"}`}
          >
            FEMALE
          </button>
        </div>
      </div>

      {/* Platform Buttons */}
      <div className="pc-section">
        <label className="pc-label">Select a Platform:</label>
        <div className="pc-buttons-group">
          <button
            onClick={() => togglePlatform("tv")}
            className={`pc-button 
              ${platform === "tv" 
                ? "platform-selected" 
                : "platform-unselected"}`}
          >
            TV Shows
          </button>

          <button
            onClick={() => togglePlatform("movie")}
            className={`pc-button 
              ${platform === "movie" 
                ? "platform-selected" 
                : "platform-unselected"}`}
          >
            Movies
          </button>
        </div>
      </div>

      {/* Timer Toggle Buttons */}
      <div className="pc-section">
        <label className="pc-label">Set Time Limit:</label>
        <div className="pc-buttons-group pc-timer-group">
          <button
            onClick={() => toggleTimer(150)}
            className={`pc-button 
              ${timer === 150 
                ? "timer-selected" 
                : "timer-unselected"}`}
          >
            2:30
          </button>

          <button
            onClick={() => toggleTimer(300)}
            className={`pc-button 
              ${timer === 300 
                ? "timer-selected" 
                : "timer-unselected"}`}
          >
            5:00
          </button>

          <button
            onClick={() => toggleTimer(450)}
            className={`pc-button 
              ${timer === 450 
                ? "timer-selected" 
                : "timer-unselected"}`}
          >
            7:30
          </button>

          <button
            onClick={() => toggleTimer(600)}
            className={`pc-button 
              ${timer === 600 
                ? "timer-selected" 
                : "timer-unselected"}`}
          >
            10:00
          </button>
        </div>
      </div>

      {/* Country Select */}
      <div className="pc-section pc-country-section">
        <label className="pc-label">Country:</label>
        <select
          className="pc-select"
          value={country || ""}
          onChange={(e) => setCountry(e.target.value || null)}
        >
          <option value="">Any</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>


      {/* Start Button: disabled when no filter is selected */}
      <button
        onClick={handleStart}
        className="pc-start-button"
        disabled={!hasAnyFilter}
      >
        Start Challenge
      </button>

    </>
  );
}
