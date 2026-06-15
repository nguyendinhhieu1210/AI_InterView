// services/liveCoding/exampleTemplates.js - DIFFICULTY-AWARE EXAMPLES

// ========== LOGIC EXAMPLES (OOP, inheritance, etc.) ==========
const LOGIC_EXAMPLES = {
  Inheritance: {
    beginner: {
      javascript: {
        problemStatement: `Create a class Animal with a method makeSound(). Create a subclass Dog that inherits from Animal and overrides makeSound() to return "Woof!".

Example:
const dog = new Dog();
console.log(dog.makeSound()); // "Woof!"`,
        functionSignature: `class Animal { makeSound() { return "Some sound"; } }\nclass Dog extends Animal { makeSound() { return "Woof!"; } }`,
        exampleInput: `const dog = new Dog();\nconsole.log(dog.makeSound());`,
        exampleOutput: `Woof!`,
        testCriteria: `• Dog extends Animal\n• makeSound() returns correct string`,
        description: `Basic inheritance.`,
      },
    },
    intermediate: {
      javascript: {
        problemStatement: `Create a base class Shape with a method area(). Create two subclasses: Circle (constructor takes radius) and Rectangle (constructor takes width, height). Override area() accordingly. Also add a method perimeter() in each subclass.

Example:
new Circle(5).area() // 78.54
new Rectangle(4,6).area() // 24
new Circle(5).perimeter() // 31.42`,
        functionSignature: `class Shape { area() { return 0; } }\nclass Circle extends Shape { constructor(r) { super(); this.r = r; } area() { return Math.PI * this.r * this.r; } perimeter() { return 2 * Math.PI * this.r; } }\nclass Rectangle extends Shape { constructor(w,h) { super(); this.w = w; this.h = h; } area() { return this.w * this.h; } perimeter() { return 2 * (this.w + this.h); } }`,
        exampleInput: `const shapes = [new Circle(5), new Rectangle(4,6)];\nshapes.forEach(s => console.log(s.area()));`,
        exampleOutput: `78.53981633974483\n24`,
        testCriteria: `• Both extend Shape\n• area() and perimeter() correct\n• Use Math.PI for circle`,
        description: `Inheritance with additional method.`,
      },
    },
    advanced: {
      javascript: {
        problemStatement: `Implement a polymorphic system for a library management system. Create an abstract class LibraryItem with properties: id, title, isCheckedOut. Methods: checkOut(), returnItem(), getDetails(). Then create subclasses: Book (with author, pages), DVD (with director, duration), Magazine (with issueNumber). Each subclass must implement getDetails() to return a formatted string. Additionally, implement a function findAvailableItems(items) that filters out checked-out items.

Example:
const book = new Book(1, "JS Guide", "John", 300);
book.checkOut();
console.log(book.getDetails()); // "Book: JS Guide by John (300 pages) - Checked Out"`,
        functionSignature: `class LibraryItem { constructor(id, title) { /* ... */ } checkOut() { } returnItem() { } getDetails() { } }\nclass Book extends LibraryItem { constructor(id, title, author, pages) { super(id, title); /* ... */ } getDetails() { } }\n// ... similarly for DVD, Magazine\nfunction findAvailableItems(items) { /* ... */ }`,
        exampleInput: `const items = [new Book(1,"JS Guide","John",300), new DVD(2,"Inception","Nolan",148)];\nitems[0].checkOut();\nconsole.log(findAvailableItems(items).length);`,
        exampleOutput: `1`,
        testCriteria: `• Abstract class pattern\n• Proper inheritance\n• Polymorphic getDetails()\n• Filtering works`,
        description: `Advanced inheritance and polymorphism.`,
      },
    },
  },
  // Thêm các topic OOP khác nếu cần...
};

// ========== DATA EXAMPLES (Sorting, Searching, Arrays, Stacks, Queues, etc.) ==========
const DATA_EXAMPLES = {
  Sorting: {
    beginner: {
      javascript: {
        problemStatement: `Sort an array of integers in ascending order. You may use the built-in .sort() method.

Example: [3,1,4,1,5] → [1,1,3,4,5]`,
        functionSignature: `function sortArray(arr) { return arr.sort((a,b) => a - b); }`,
        exampleInput: `console.log(sortArray([3,1,4,1,5]));`,
        exampleOutput: `[1,1,3,4,5]`,
        testCriteria: `• Uses built-in sort\n• Returns sorted array`,
        description: `Basic sorting using built-in.`,
      },
    },
    intermediate: {
      javascript: {
        problemStatement: `Implement the bubble sort algorithm to sort an array of integers in ascending order. Do NOT use built-in .sort(). Return a new sorted array (do not mutate original).

Example: [64,34,25,12,22,11,90] → [11,12,22,25,34,64,90]`,
        functionSignature: `function bubbleSort(arr) { const result = [...arr]; /* implement bubble sort */ return result; }`,
        exampleInput: `console.log(bubbleSort([64,34,25,12,22,11,90]));`,
        exampleOutput: `[11,12,22,25,34,64,90]`,
        testCriteria: `• No built-in sort\n• Returns new array\n• Stable sort is not required`,
        description: `Manual bubble sort.`,
      },
    },
    advanced: {
      javascript: {
        problemStatement: `Implement a generic sorting function that accepts an array and a comparator function. Use the quicksort algorithm (in-place) with O(n log n) average time complexity. The function should modify the original array and return the same array. Also handle edge cases: empty array, single element.

Example:
sort([3,1,4,1,5], (a,b) => a - b) → [1,1,3,4,5]
sort([{age:30},{age:25}], (a,b) => a.age - b.age) → [{age:25},{age:30}]`,
        functionSignature: `function quickSort(arr, compareFn) { if (!compareFn) compareFn = (a,b) => a - b; /* in-place quicksort */ return arr; }`,
        exampleInput: `const arr = [3,1,4,1,5];\nquickSort(arr, (a,b) => a - b);\nconsole.log(arr);`,
        exampleOutput: `[1,1,3,4,5]`,
        testCriteria: `• In-place sort\n• Accepts comparator\n• O(n log n) average\n• Handles custom objects`,
        description: `Advanced generic quicksort.`,
      },
    },
  },
  Arrays: {
    beginner: {
      javascript: {
        problemStatement: `Return sum of integers in array. Empty array returns 0.

Example: [1,2,3,4,5] → 15`,
        functionSignature: `function sumArray(arr) { return 0; }`,
        exampleInput: `console.log(sumArray([1,2,3,4,5]));`,
        exampleOutput: `15`,
        testCriteria: `• Empty returns 0\n• Works with negatives`,
        description: `Calculate array sum.`,
      },
    },
    intermediate: {
      javascript: {
        problemStatement: `Find the second largest element in an array of integers. If array length < 2, return null. Do not use built-in sort.

Example: [3,2,1,5,4] → 4`,
        functionSignature: `function secondLargest(arr) { /* implementation */ return null; }`,
        exampleInput: `console.log(secondLargest([3,2,1,5,4]));`,
        exampleOutput: `4`,
        testCriteria: `• Returns second largest\n• Handles duplicates\n• Returns null for small arrays`,
        description: `Array manipulation without sort.`,
      },
    },
    advanced: {
      javascript: {
        problemStatement: `Implement a function rotateArray(arr, k) that rotates the array to the right by k steps in-place with O(n) time and O(1) extra space. k can be larger than array length.

Example: rotateArray([1,2,3,4,5], 2) → [4,5,1,2,3]`,
        functionSignature: `function rotateArray(arr, k) { /* in-place rotation */ }`,
        exampleInput: `const arr = [1,2,3,4,5];\nrotateArray(arr, 2);\nconsole.log(arr);`,
        exampleOutput: `[4,5,1,2,3]`,
        testCriteria: `• In-place modification\n• O(1) extra space\n• Handles k > length`,
        description: `Advanced array rotation.`,
      },
    },
  },
  // Thêm Stacks, Queues, Linked Lists, Searching, v.v. tương tự...
};

// ========== PATTERN FALLBACK (dùng khi không có mẫu cụ thể) ==========
const PATTERNS = {
  sum: {
    keywords: ["Sum", "Total"],
    getExample: (lang, difficulty) => {
      if (difficulty === "beginner") return beginnerSum(lang);
      if (difficulty === "intermediate") return intermediateSum(lang);
      return advancedSum(lang);
    },
  },
  // ... các pattern khác
};

function beginnerSum(lang) {
  return {
    problemStatement: `Write a function that returns the sum of all numbers in an array.`,
    functionSignature: `function sum(arr) { return 0; }`,
    exampleInput: `sum([1,2,3,4,5])`,
    exampleOutput: `15`,
    testCriteria: `• Works for empty array\n• Returns number`,
    description: `Basic sum.`,
  };
}
function intermediateSum(lang) {
  return {
    problemStatement: `Write a function that returns the sum of all numbers in an array, but skip any negative numbers.`,
    functionSignature: `function sumPositive(arr) { return 0; }`,
    exampleInput: `sumPositive([1,-2,3,4,-5])`,
    exampleOutput: `8`,
    testCriteria: `• Filters out negatives\n• Works with empty`,
    description: `Sum with filter.`,
  };
}
function advancedSum(lang) {
  return {
    problemStatement: `Implement a function that returns the sum of all numbers, but the array may contain nested arrays. Flatten first then sum.`,
    functionSignature: `function deepSum(arr) { return 0; }`,
    exampleInput: `deepSum([1,[2,3],4,[5,[6]]])`,
    exampleOutput: `21`,
    testCriteria: `• Handles nested arrays\n• Recursive flattening\n• Works with empty`,
    description: `Deep sum with recursion.`,
  };
}

// ========== HÀM CHÍNH ==========
function getExampleForTopic(topic, language, difficulty = "intermediate") {
  const diff = difficulty.toLowerCase();
  const validDiff = ["beginner", "intermediate", "advanced"].includes(diff)
    ? diff
    : "intermediate";

  // Tìm trong LOGIC_EXAMPLES
  if (
    LOGIC_EXAMPLES[topic] &&
    LOGIC_EXAMPLES[topic][validDiff] &&
    LOGIC_EXAMPLES[topic][validDiff][language]
  ) {
    return LOGIC_EXAMPLES[topic][validDiff][language];
  }
  // Tìm trong DATA_EXAMPLES
  if (
    DATA_EXAMPLES[topic] &&
    DATA_EXAMPLES[topic][validDiff] &&
    DATA_EXAMPLES[topic][validDiff][language]
  ) {
    return DATA_EXAMPLES[topic][validDiff][language];
  }
  // Pattern fallback
  for (const [_, pattern] of Object.entries(PATTERNS)) {
    if (
      pattern.keywords.some((k) =>
        topic.toLowerCase().includes(k.toLowerCase()),
      )
    ) {
      return pattern.getExample(language, validDiff);
    }
  }
  return null;
}

function getDefaultExampleObject(language, topic, difficulty = "intermediate") {
  const isLogic = [
    "class",
    "inheritance",
    "polymorphism",
    "encapsulation",
    "closure",
    "promise",
    "callback",
    "decorator",
  ].some((k) => topic.toLowerCase().includes(k));
  if (isLogic) {
    return {
      problemStatement: `Demonstrate ${topic} concept in ${language} at ${difficulty} level.`,
      functionSignature: `// Implement ${topic}`,
      exampleInput: `// Example usage`,
      exampleOutput: `// Expected output`,
      testCriteria: `• Shows ${topic} correctly\n• Difficulty: ${difficulty}`,
      description: `Practice ${topic}.`,
    };
  }
  return {
    problemStatement: `Write a function to ${topic.toLowerCase()} in ${language}. Level: ${difficulty}.`,
    functionSignature: `function ${topic.toLowerCase()}(data) { return null; }`,
    exampleInput: `// Example call`,
    exampleOutput: `// Expected result`,
    testCriteria: `• Works with typical inputs\n• Handles edge cases\n• Difficulty: ${difficulty}`,
    description: `Practice ${topic}.`,
  };
}

module.exports = {
  getExampleForTopic,
  getDefaultExampleObject,
};
