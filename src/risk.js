/*Generated using Claude Code
  Prompt: I am trying to make a program which calculates Risk probabilities using dynamic programming. Can you do that?
*/

// Risk Battle Probability Calculator using Dynamic Programming
//
// Rules:
//   - Attacker rolls min(attacking_armies - 1, 3) dice (must keep 1 army)
//   - Defender rolls min(defending_armies, 2) dice
//   - Compare highest vs highest, second vs second (if both rolled >= 2)
//   - Defender wins ties
//   - Each comparison: loser removes 1 army

// --- Dice Roll Outcome Probabilities ---


// Generate all combinations of `n` dice each with `sides` faces
function allCombos(n, sides) {
  if (n === 0) return [[]];
  const sub = allCombos(n - 1, sides);
  const result = [];
  for (let face = 1; face <= sides; face++) {
    for (const s of sub) result.push([face, ...s]);
  }
  return result;
}

// Returns [{atkLoss, defLoss, prob}] for one dice roll engagement.
// atkDice: 1-3  |  defDice: 1-2
function rollOutcomes(atkDice, defDice) {
  const counts = {};
  const atkCombos = allCombos(atkDice, 6);
  const defCombos = allCombos(defDice, 6);
  const total = atkCombos.length * defCombos.length;
  const comparisons = Math.min(atkDice, defDice);

  for (const atkRoll of atkCombos) {
    const atkSorted = [...atkRoll].sort((a, b) => b - a);
    for (const defRoll of defCombos) {
      const defSorted = [...defRoll].sort((a, b) => b - a);

      let atkLoss = 0;
      for (let i = 0; i < comparisons; i++) {
        if (atkSorted[i] <= defSorted[i]) atkLoss++; // defender wins ties
      }
      const defLoss = comparisons - atkLoss;
      const key = `${atkLoss},${defLoss}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }

  return Object.entries(counts).map(([key, count]) => {
    const [atkLoss, defLoss] = key.split(",").map(Number);
    return { atkLoss, defLoss, prob: count / total };
  });
}

// --- Precompute Roll Tables ---
// rollTable[atkDice][defDice] = [{atkLoss, defLoss, prob}, ...]
const rollTable = {};
for (let a = 1; a <= 3; a++) {
  rollTable[a] = {};
  for (let d = 1; d <= 2; d++) {
    rollTable[a][d] = rollOutcomes(a, d);
  }
}

// --- Dynamic Programming ---
// battleWinProb(a, d) = probability attacker wins the full battle
//   a = attacker total armies (must keep >= 1, so can only attack with a-1)
//   d = defender total armies
// Attacker wins when d == 0, loses when a == 1

const memo = {};

function battleWinProb(a, d) {
  if (d <= 0) return 1.0;
  if (a <= 1) return 0.0;

  const key = `${a},${d}`;
  if (key in memo) return memo[key];

  const atkDice = Math.min(a - 1, 3);
  const defDice = Math.min(d, 2);

  let prob = 0;
  for (const { atkLoss, defLoss, prob: p } of rollTable[atkDice][defDice]) {
    prob += p * battleWinProb(a - atkLoss, d - defLoss);
  }

  memo[key] = prob;
  return prob;
}

const memo2 = {};

function battleWinProbMod(a, d) {
  if (d <= 0) return 1.0;
  if (a < d) return 0.0; // If attacker has fewer armies than defender, they can't win
  if (a <= 1) return 0.0;

  const key = `${a},${d}`;
  if (key in memo2) return memo2[key];

  const atkDice = Math.min(a - 1, 3);
  const defDice = Math.min(d, 2);

  let prob = 0;
  for (const { atkLoss, defLoss, prob: p } of rollTable[atkDice][defDice]) {
    prob += p * battleWinProbMod(a - atkLoss, d - defLoss);
  }

  memo2[key] = prob;
  return prob;
}

// --- Print probability table ---

function printTable(maxA, maxD) {
  const W = 9;
  const header = "Atk\\Def".padEnd(W) +
    Array.from({ length: maxD }, (_, i) => String(i + 1).padStart(W)).join("");
  console.log(header);
  console.log("-".repeat(W * (maxD + 1)));

  for (let a = 2; a <= maxA; a++) {
    let row = String(a).padEnd(W);
    for (let d = 1; d <= maxD; d++) {
      row += ((battleWinProb(a, d) * 100).toFixed(1) + "%").padStart(W);
    }
    console.log(row);
  }
}

/*
console.log("=== Risk Battle Win Probabilities (Attacker) ===");
console.log("Rows = attacker armies, Columns = defender armies\n");
printTable(20, 10);

console.log("\n--- Specific examples ---");
const examples = [[2,1],[3,2],[5,3],[10,5],[20,15],[4,4]];
for (const [a, d] of examples) {
  console.log(`  ${a} atk vs ${d} def: ${(battleWinProb(a, d) * 100).toFixed(2)}%`);
}
  */

if (typeof module !== 'undefined') {
  module.exports = { battleWinProb, battleWinProbMod, rollTable };
} else {
  // Browser: wire up the attackers/defenders form
  // Script loads at bottom of page, so DOM is already ready
  document.querySelector('button').addEventListener('click', () => {
    const a = parseInt(document.getElementById('attackers').value);
    const d = parseInt(document.getElementById('defenders').value);
    const out = document.getElementById('attackDefendOut');
    if (isNaN(a) || isNaN(d) || a < 1 || d < 1) {
      out.textContent = 'Please enter valid positive numbers for both fields.';
    } else {
      const p = battleWinProb(a, d);
      out.textContent = `Chance of attackers winning: ${(p * 100).toFixed(2)}%`;
    }
  });
}

