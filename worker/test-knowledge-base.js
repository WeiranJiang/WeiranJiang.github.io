/**
 * Test the Alice knowledge base with the provided test questions.
 * Run with: node test-knowledge-base.js
 */

import { selectNotes, notes } from "./src/aliceKnowledge.js";

// Test questions from the requirements
const testQuestions = [
  "What is Alice's favorite color?",
  "Tell me a fun fact about Alice.",
  "What is Alice surprisingly competitive about?",
  "How does Alice respond to feedback?",
  "Tell me about a mistake Alice made.",
  "How does computer science inform Alice's investing interests?",
  "What preprofessional programs has Alice completed?",
  "Does Alice write about markets?",
  "Why should I hire Alice?",
  "Why should I hire Alice for a technology investment-banking analyst role?",
];

console.log("=".repeat(80));
console.log("ALICE KNOWLEDGE BASE TEST");
console.log("=".repeat(80));
console.log();

// Print knowledge base status
console.log("Knowledge Base Status:");
console.log("-".repeat(80));
const emptyCategories = notes.filter((n) => n.facts.length === 0);
const filledCategories = notes.filter((n) => n.facts.length > 0);

console.log(`Total categories: ${notes.length}`);
console.log(`Filled categories: ${filledCategories.length}`);
console.log(`Empty categories: ${emptyCategories.length}`);

if (emptyCategories.length > 0) {
  console.log("\nEmpty categories (these won't be retrieved):");
  emptyCategories.forEach((cat) => {
    console.log(`  - ${cat.title} (${cat.id})`);
  });
}

console.log();
console.log("=".repeat(80));
console.log("TEST QUESTIONS");
console.log("=".repeat(80));
console.log();

testQuestions.forEach((question, index) => {
  console.log(`${index + 1}. "${question}"`);
  const retrieved = selectNotes(question);
  console.log(`   Retrieved ${retrieved.length} note(s):`);
  retrieved.forEach((note) => {
    const preview = note.text.substring(0, 100).replace(/\n/g, " ");
    console.log(`   - ${note.title}: "${preview}..."`);
  });
  console.log();
});

console.log("=".repeat(80));
console.log("VERIFICATION CHECKLIST");
console.log("=".repeat(80));
console.log();

// Verify key information is present
const allFacts = filledCategories.flatMap((cat) => cat.facts).join(" ");

const checks = [
  {
    name: "Favorite color (green)",
    present: allFacts.includes("green"),
  },
  {
    name: "Bridge building fun fact (11-gram, 15,000 grams)",
    present: allFacts.includes("11-gram") && allFacts.includes("15,000"),
  },
  {
    name: "Competitive nature",
    present: allFacts.includes("surprisingly competitive"),
  },
  {
    name: "PowerPoint feedback example",
    present: allFacts.includes("PowerPoint") && allFacts.includes("consulting level"),
  },
  {
    name: "Golar LNG mistake",
    present: allFacts.includes("Golar LNG"),
  },
  {
    name: "Computer science helps investing",
    present: allFacts.includes("Computer science helps"),
  },
  {
    name: "Preprofessional programs (SEO, Morgan Stanley, Goldman Sachs, Point72)",
    present:
      allFacts.includes("SEO Career") &&
      allFacts.includes("Morgan Stanley") &&
      allFacts.includes("Goldman Sachs") &&
      allFacts.includes("Point72"),
  },
  {
    name: "Writing and market interests",
    present: allFacts.includes("blog posts") || allFacts.includes("market updates"),
  },
  {
    name: "Career priorities (learning, deal flow, people)",
    present: allFacts.includes("learning experience") && allFacts.includes("deal flow") && allFacts.includes("people"),
  },
  {
    name: "Long-term goals (banking, PE, open-minded)",
    present: allFacts.includes("investment banking") && allFacts.includes("private equity"),
  },
];

let passCount = 0;
checks.forEach((check) => {
  const status = check.present ? "✓ PASS" : "✗ FAIL";
  console.log(`${status}: ${check.name}`);
  if (check.present) passCount++;
});

console.log();
console.log(`Score: ${passCount}/${checks.length}`);
console.log();
console.log("=".repeat(80));
