# Budget App — Next Steps Plan

This document outlines the planned approach for the two deferred improvements from our recent quality-of-life update.

## 1. Fortnightly Income Anchor Date Tracking
**Problem:** Currently, the `fortnightly` income frequency is a rough approximation. It simply multiplies the income amount by 1 or 2 based on whether the current date is before or after the 14th of the month. This does not align with reality, where fortnightly pay is strictly every 14 days and drifts across the month (and occasionally results in 3 paychecks in a single month).

**Proposed Solution:**
- Migrate the `fortnightly` income type to use an `anchorDate` (exactly like how `fourweekly` currently works).
- Update the HTML income form so that when "Fortnightly" is selected, it asks for a "First payment date" instead of a generic "Day of month".
- Add a new helper `fortnightlyDatesInMonth(anchorDate, year, month)` to calculate the exact dates using noon-based date math (to avoid DST bugs), similar to `fourWeeklyDatesInMonth()`.
- Update `incomeReceivedByDate()` in `renderHome()` to use these precise dates instead of the `(date >= 14 ? 2 : 1)` multiplier.
- **Migration requirement:** We must provide a data migration in `migrateData()` or `INCOME_CORRECTIONS` to assign an initial `anchorDate` to any existing `fortnightly` income streams so they do not break.

## 2. Dynamic Household Composition & Budgets
**Problem:** The insights tab (specifically the "Realistic Savings Plan" and "Recommended Monthly Budget") is hardcoded to a specific household composition: "2 adults · 4 children · 3 dogs · 3 lizards". The recommended budget figures (`RECOMMENDED` array) are also fixed. If the family situation changes, the advice will become inaccurate.

**Proposed Solution:**
- Update `db.profile` to include specific counts: `{ adults: 2, children: 4, dogs: 3, lizards: 3 }` instead of just a free-text `household` string.
- Create a new Settings UI section under "Profile" to let the user adjust these counts.
- Make the `RECOMMENDED` array in `renderSavingsPlan()` dynamic:
  - Base groceries on `(adults * X) + (children * Y)`
  - Base pet costs on `(dogs * A) + (lizards * B)`
  - Update the descriptive text dynamically based on the counts.
- This will make the app fully portable for other families while retaining the tailored feel for the primary users.
