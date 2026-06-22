// services/liveCoding/llmProvider.js - FINAL FIXED VERSION (v2)

const { GroqService } = require("../ai/groqService");
const { extractJson } = require("../../utils/jsonExtractor");
const {
  getTopicGuidance,
  getLanguageGuidance,
  getDomainNote,
  isConcurrencyOrAsyncTopic,
  getTopicStyle,
} = require("./questionGuidance");
const {
  logRequest,
  logResponse,
  logError,
  logRateLimit,
  logTokenUsage,
  generateRequestId,
} = require("../../utils/aiLogger");
const {
  getExampleForTopic,
  getDefaultExampleObject,
  validateExampleInput,
  validateExampleOutput,
} = require("./exampleTemplates");

require("dotenv").config();

const groq = new GroqService(
  process.env.GROQ_API_KEY,
  "llama-3.3-70b-versatile",
  0.2,
);

// ========== TOPIC CLASSIFICATION ==========
const TOPIC_CATEGORIES = {
  OOP: [
    "class",
    "object",
    "oop",
    "inheritance",
    "polymorphism",
    "encapsulation",
    "abstraction",
    "constructor",
    "method",
    "property",
    "getter",
    "setter",
  ],
  ARRAY: [
    "array",
    "subarray",
    "list",
    "sort",
    "filter",
    "map",
    "reduce",
    "find",
    "search",
    "binary search",
    "merge",
    "split",
    "contiguous",
  ],
  STRING: [
    "string",
    "char",
    "substring",
    "palindrome",
    "anagram",
    "reverse",
    "concatenate",
    "regex",
  ],
  MATH: [
    "math",
    "factorial",
    "fibonacci",
    "prime",
    "gcd",
    "lcm",
    "sum",
    "average",
    "statistics",
  ],
  MATRIX: ["matrix", "grid", "2d", "multi-dimensional", "spiral"],
  GRAPH: [
    "graph",
    "tree",
    "node",
    "edge",
    "traversal",
    "bfs",
    "dfs",
    "dijkstra",
    "path",
  ],
  LINKED_LIST: ["linked list", "singly", "doubly", "circular", "node"],
  DATA_STRUCTURE: [
    "stack",
    "queue",
    "heap",
    "hash",
    "map",
    "set",
    "dictionary",
  ],
  CONCURRENCY: [
    "thread",
    "async",
    "await",
    "promise",
    "mutex",
    "lock",
    "goroutine",
    "channel",
  ],
  INPUT_OUTPUT: ["file", "io", "stream", "read", "write", "parse", "serialize"],
  GENERAL: [],
};

function categorizeTopic(topic) {
  const topicLower = topic.toLowerCase();
  for (const [category, keywords] of Object.entries(TOPIC_CATEGORIES)) {
    if (keywords.some((keyword) => topicLower.includes(keyword))) {
      return category;
    }
  }
  return "GENERAL";
}

function isOOPTopic(topic) {
  return categorizeTopic(topic) === "OOP";
}

function isArrayTopic(topic) {
  return categorizeTopic(topic) === "ARRAY";
}

function isStringTopic(topic) {
  return categorizeTopic(topic) === "STRING";
}

// ========== RANDOM DATA GENERATORS ==========
function generateRandomNumber(min = -99, max = 99) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomArray(size, min = -99, max = 99) {
  const arr = [];
  for (let i = 0; i < size; i++) {
    arr.push(generateRandomNumber(min, max));
  }
  return arr;
}

function generateRandomString(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateRandomObject(keyCount = 3) {
  const obj = {};
  const keys = [
    "name",
    "age",
    "city",
    "score",
    "value",
    "id",
    "title",
    "count",
  ];
  for (let i = 0; i < keyCount; i++) {
    const key = keys[i % keys.length] + (i >= keys.length ? i : "");
    const values = [
      generateRandomString(6),
      generateRandomNumber(1, 100),
      generateRandomNumber(-50, 50),
      Math.random() > 0.5 ? "active" : "inactive",
      generateRandomNumber(1, 1000),
    ];
    obj[key] = values[i % values.length];
  }
  return obj;
}

function generateRandomMatrix(rows, cols, min = -99, max = 99) {
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix.push(generateRandomArray(cols, min, max));
  }
  return matrix;
}

// ========== TREE HELPERS ==========
function computeMaxRootToLeafPathSum(arr) {
  if (!arr || arr.length === 0) return 0;
  const nodes = arr.map((val) =>
    val === -1 ? null : { val, left: null, right: null },
  );
  if (!nodes[0]) return 0;
  let root = nodes[0];
  let i = 1;
  for (let node of nodes) {
    if (node) {
      if (i < nodes.length) node.left = nodes[i++];
      if (i < nodes.length) node.right = nodes[i++];
    }
  }
  let maxSum = -Infinity;
  function dfs(node, current) {
    if (!node) return;
    current += node.val;
    if (!node.left && !node.right) {
      maxSum = Math.max(maxSum, current);
    }
    dfs(node.left, current);
    dfs(node.right, current);
  }
  dfs(root, 0);
  return maxSum === -Infinity ? 0 : maxSum;
}

// ========== OOP DATA GENERATORS ==========
function generateClassInstance(className, language) {
  const instances = {
    person: {
      javascript: 'new Person("John Doe", 30, "Software Engineer")',
      python: 'Person("John Doe", 30, "Software Engineer")',
      java: 'new Person("John Doe", 30, "Software Engineer")',
      csharp: 'new Person("John Doe", 30, "Software Engineer")',
      cpp: 'Person("John Doe", 30, "Software Engineer")',
      go: 'Person{Name: "John Doe", Age: 30, Role: "Software Engineer"}',
    },
    student: {
      javascript: 'new Student("Alice Johnson", 20, "Computer Science", 3.8)',
      python: 'Student("Alice Johnson", 20, "Computer Science", 3.8)',
      java: 'new Student("Alice Johnson", 20, "Computer Science", 3.8)',
      csharp: 'new Student("Alice Johnson", 20, "Computer Science", 3.8)',
      cpp: 'Student("Alice Johnson", 20, "Computer Science", 3.8)',
      go: 'Student{Name: "Alice Johnson", Age: 20, Major: "Computer Science", GPA: 3.8}',
    },
    employee: {
      javascript: 'new Employee("Bob Smith", 45, "Manager", 75000)',
      python: 'Employee("Bob Smith", 45, "Manager", 75000)',
      java: 'new Employee("Bob Smith", 45, "Manager", 75000)',
      csharp: 'new Employee("Bob Smith", 45, "Manager", 75000)',
      cpp: 'Employee("Bob Smith", 45, "Manager", 75000)',
      go: 'Employee{Name: "Bob Smith", Age: 45, Role: "Manager", Salary: 75000}',
    },
    product: {
      javascript: 'new Product("Laptop", 999.99, "Electronics", 50)',
      python: 'Product("Laptop", 999.99, "Electronics", 50)',
      java: 'new Product("Laptop", 999.99, "Electronics", 50)',
      csharp: 'new Product("Laptop", 999.99, "Electronics", 50)',
      cpp: 'Product("Laptop", 999.99, "Electronics", 50)',
      go: 'Product{Name: "Laptop", Price: 999.99, Category: "Electronics", Stock: 50}',
    },
    bank_account: {
      javascript: 'new BankAccount("SAVINGS", 5000, "John Doe")',
      python: 'BankAccount("SAVINGS", 5000, "John Doe")',
      java: 'new BankAccount("SAVINGS", 5000, "John Doe")',
      csharp: 'new BankAccount("SAVINGS", 5000, "John Doe")',
      cpp: 'BankAccount("SAVINGS", 5000, "John Doe")',
      go: 'BankAccount{Type: "SAVINGS", Balance: 5000, Owner: "John Doe"}',
    },
  };
  const classNameLower = className.toLowerCase();
  let matchedClass = "person";
  for (const [key] of Object.entries(instances)) {
    if (classNameLower.includes(key)) {
      matchedClass = key;
      break;
    }
  }
  return (
    instances[matchedClass]?.[language] ||
    instances.person[language] ||
    "new Person()"
  );
}

function generateOOPExample(topic, language, difficulty) {
  const topicLower = topic.toLowerCase();
  let className = "Person";
  let properties = [];
  let methods = [];
  if (topicLower.includes("student") || topicLower.includes("school")) {
    className = "Student";
    properties = ["name", "age", "grade", "major"];
    methods = ["study", "takeExam", "getGPA"];
  } else if (topicLower.includes("employee") || topicLower.includes("worker")) {
    className = "Employee";
    properties = ["name", "age", "role", "salary", "department"];
    methods = ["work", "getSalary", "promote"];
  } else if (topicLower.includes("product") || topicLower.includes("item")) {
    className = "Product";
    properties = ["name", "price", "category", "stock"];
    methods = ["applyDiscount", "updateStock", "getInfo"];
  } else if (topicLower.includes("bank") || topicLower.includes("account")) {
    className = "BankAccount";
    properties = ["accountNumber", "balance", "owner", "type"];
    methods = ["deposit", "withdraw", "getBalance"];
  } else if (topicLower.includes("vehicle") || topicLower.includes("car")) {
    className = "Vehicle";
    properties = ["make", "model", "year", "mileage"];
    methods = ["drive", "honk", "getInfo"];
  } else {
    className = "Person";
    properties = ["name", "age", "email"];
    methods = ["greet", "updateInfo"];
  }
  const instance = generateClassInstance(className, language);
  return {
    className,
    properties,
    methods,
    exampleInput: instance,
    exampleOutput: getOOPExampleOutput(className, methods[0], difficulty),
    expectedType: "object",
    description: `Create a ${className} class with properties: ${properties.join(", ")} and methods: ${methods.join(", ")}`,
  };
}

function getOOPExampleOutput(className, method, difficulty) {
  const outputs = {
    Student: {
      study: "Student is studying",
      takeExam: "Exam completed with grade: A",
      getGPA: "3.8",
    },
    Employee: {
      work: "Employee is working",
      getSalary: "75000",
      promote: "Employee promoted to Senior",
    },
    Product: {
      applyDiscount: "Discount applied. New price: 899.99",
      updateStock: "Stock updated to: 45",
      getInfo: "Laptop - Electronics - $999.99",
    },
    BankAccount: {
      deposit: "Deposit successful. New balance: 5500",
      withdraw: "Withdrawal successful. New balance: 4500",
      getBalance: "5000",
    },
    Vehicle: {
      drive: "Vehicle is driving",
      honk: "Beep beep!",
      getInfo: "Toyota Camry 2020",
    },
    Person: {
      greet: "Hello, my name is John Doe",
      updateInfo: "Information updated successfully",
    },
  };
  return outputs[className]?.[method] || "Method executed successfully";
}

// ========== DATA SIZE BY DIFFICULTY ==========
const DIFFICULTY_CONFIG = {
  beginner: {
    arraySize: { min: 5, max: 7 },
    stringLength: { min: 5, max: 8 },
    objectKeys: { min: 2, max: 3 },
    matrixSize: { rows: 2, cols: 3 },
    numberRange: { min: -20, max: 20 },
    description: "Simple, small dataset",
    oopComplexity: "basic",
  },
  intermediate: {
    arraySize: { min: 8, max: 12 },
    stringLength: { min: 8, max: 15 },
    objectKeys: { min: 3, max: 5 },
    matrixSize: { rows: 3, cols: 4 },
    numberRange: { min: -50, max: 50 },
    description: "Moderate dataset with edge cases",
    oopComplexity: "moderate",
  },
  advanced: {
    arraySize: { min: 12, max: 18 },
    stringLength: { min: 15, max: 25 },
    objectKeys: { min: 5, max: 8 },
    matrixSize: { rows: 4, cols: 5 },
    numberRange: { min: -99, max: 99 },
    description: "Large dataset with complex cases",
    oopComplexity: "advanced",
  },
};

function getDifficultyConfig(difficulty) {
  return (
    DIFFICULTY_CONFIG[difficulty?.toLowerCase()] ||
    DIFFICULTY_CONFIG.intermediate
  );
}

// ===================================================
// computeArrayOutput - CHỈ XỬ LÝ CÁC BÀI TOÁN CƠ BẢN
// ===================================================

function computeArrayOutput(topicLower, arr) {
  const sortedAsc = () => [...arr].sort((a, b) => a - b);
  const sumOf = (a) => a.reduce((s, x) => s + x, 0);

  // ── 1. Sort ──────────────────────────────────────────────────────────
  if (topicLower.includes("sort")) {
    return { value: JSON.stringify(sortedAsc()), type: "array" };
  }

  // ── 2. Reverse ──────────────────────────────────────────────────────
  if (topicLower.includes("reverse")) {
    return { value: JSON.stringify([...arr].reverse()), type: "array" };
  }

  // ── 3. Diff (max - min) ──────────────────────────────────────────
  if (
    topicLower.includes("diff") ||
    (topicLower.includes("range") && !topicLower.includes("arrange"))
  ) {
    return {
      value: String(Math.max(...arr) - Math.min(...arr)),
      type: "number",
    };
  }

  // ── 4. Max ──────────────────────────────────────────────────────
  if (
    topicLower.includes("max") ||
    topicLower.includes("maximum") ||
    topicLower.includes("largest")
  ) {
    return { value: String(Math.max(...arr)), type: "number" };
  }

  // ── 5. Min ──────────────────────────────────────────────────────
  if (
    topicLower.includes("min") ||
    topicLower.includes("minimum") ||
    topicLower.includes("smallest")
  ) {
    return { value: String(Math.min(...arr)), type: "number" };
  }

  // ── 6. Sum with conditions ────────────────────────────────────────
  if (topicLower.includes("positive") && topicLower.includes("sum"))
    return { value: String(sumOf(arr.filter((x) => x > 0))), type: "number" };
  if (topicLower.includes("positive") && topicLower.includes("count"))
    return { value: String(arr.filter((x) => x > 0).length), type: "number" };
  if (topicLower.includes("negative") && topicLower.includes("sum"))
    return { value: String(sumOf(arr.filter((x) => x < 0))), type: "number" };
  if (topicLower.includes("negative") && topicLower.includes("count"))
    return { value: String(arr.filter((x) => x < 0).length), type: "number" };
  if (topicLower.includes("even") && topicLower.includes("sum"))
    return {
      value: String(sumOf(arr.filter((x) => x % 2 === 0))),
      type: "number",
    };
  if (topicLower.includes("even") && topicLower.includes("count"))
    return {
      value: String(arr.filter((x) => x % 2 === 0).length),
      type: "number",
    };
  if (topicLower.includes("odd") && topicLower.includes("sum"))
    return {
      value: String(sumOf(arr.filter((x) => x % 2 !== 0))),
      type: "number",
    };
  if (topicLower.includes("odd") && topicLower.includes("count"))
    return {
      value: String(arr.filter((x) => x % 2 !== 0).length),
      type: "number",
    };

  // ── 7. Sum / Total ──────────────────────────────────────────────
  if (topicLower.includes("sum") || topicLower.includes("total"))
    return { value: String(sumOf(arr)), type: "number" };

  // ── 8. Average / Mean ──────────────────────────────────────────
  if (topicLower.includes("average") || topicLower.includes("mean")) {
    const avg = sumOf(arr) / arr.length;
    return { value: String(Math.round(avg * 100) / 100), type: "number" };
  }

  // ── 9. Count / Length ──────────────────────────────────────────
  if (topicLower.includes("count") || topicLower.includes("length"))
    return { value: String(arr.length), type: "number" };

  return null;
}

// ===== HELPERS CHO CÁC BÀI TOÁN PHỨC TẠP =====
function computeMaxSubarrayArray(arr) {
  if (!arr || arr.length === 0) return [];
  let maxSum = arr[0],
    curSum = arr[0];
  let start = 0,
    end = 0,
    curStart = 0;
  for (let i = 1; i < arr.length; i++) {
    if (curSum + arr[i] > arr[i]) {
      curSum += arr[i];
    } else {
      curSum = arr[i];
      curStart = i;
    }
    if (curSum > maxSum) {
      maxSum = curSum;
      start = curStart;
      end = i;
    }
  }
  return arr.slice(start, end + 1);
}

function computeMaxSubarraySum(arr) {
  if (!arr || arr.length === 0) return 0;
  let maxSum = arr[0],
    curSum = arr[0];
  for (let i = 1; i < arr.length; i++) {
    curSum = Math.max(arr[i], curSum + arr[i]);
    maxSum = Math.max(maxSum, curSum);
  }
  return maxSum;
}

function computeAllSubarraySums(arr) {
  if (!arr || arr.length === 0) return [];
  const sums = [];
  for (let i = 0; i < arr.length; i++) {
    let s = 0;
    for (let j = i; j < arr.length; j++) {
      s += arr[j];
      sums.push(s);
    }
  }
  return sums;
}

function computeSecondMaxAndMin(arr) {
  if (!arr || arr.length === 0) return [null, null];
  const unique = [...new Set(arr)].sort((a, b) => a - b);
  if (unique.length < 2) return [null, null];
  return [unique[unique.length - 2], unique[1]];
}

function computeSecondMax(arr) {
  if (!arr || arr.length === 0) return null;
  const unique = [...new Set(arr)].sort((a, b) => a - b);
  if (unique.length < 2) return null;
  return unique[unique.length - 2];
}

function computeSecondMin(arr) {
  if (!arr || arr.length === 0) return null;
  const unique = [...new Set(arr)].sort((a, b) => a - b);
  if (unique.length < 2) return null;
  return unique[1];
}

// ========== GENERATE RANDOM DATA FOR TOPIC ==========
function generateRandomDataForTopic(topic, difficulty, language) {
  const config = getDifficultyConfig(difficulty);
  const topicLower = topic.toLowerCase();
  const category = categorizeTopic(topic);
  let exampleInput = "",
    exampleOutput = "",
    expectedType = "mixed",
    dataDescription = "";

  console.log(`\n========== GENERATING DATA FOR TOPIC ==========`);
  console.log(`Topic: ${topic}`);
  console.log(`Category: ${category}`);
  console.log(`Difficulty: ${difficulty}`);

  if (category === "OOP") {
    const oopData = generateOOPExample(topic, language, difficulty);
    exampleInput = oopData.exampleInput;
    expectedType = "object";
    dataDescription = `OOP example: ${oopData.className} class instance`;
    exampleOutput = `// ${oopData.className}.${oopData.methods[0]}() will return appropriate result`;
    console.log(`Generated OOP data for class: ${oopData.className}`);
  } else if (category === "ARRAY") {
    const size =
      Math.floor(
        Math.random() * (config.arraySize.max - config.arraySize.min + 1),
      ) + config.arraySize.min;
    const arr = generateRandomArray(
      size,
      config.numberRange.min,
      config.numberRange.max,
    );
    expectedType = "array";
    const computed = computeArrayOutput(topicLower, arr);
    if (computed !== null) {
      exampleInput = JSON.stringify(arr);
      exampleOutput = computed.value;
      expectedType = computed.type;
      dataDescription = `Array with ${arr.length} elements`;
    } else {
      exampleInput = JSON.stringify(arr);
      exampleOutput = `// AI will compute based on array operation`;
      dataDescription = `Array with ${size} elements`;
    }
    console.log(`Generated array: ${exampleInput}`);
    console.log(`Computed output: ${exampleOutput}`);
  } else if (category === "GRAPH") {
    const size =
      difficulty === "advanced" ? 9 : difficulty === "intermediate" ? 7 : 5;
    const arr = generateRandomArray(size, -20, 40);
    exampleInput = JSON.stringify(arr);
    expectedType = "number";
    dataDescription = `Binary Tree (level-order, ${size} nodes)`;
    if (
      topicLower.includes("path") &&
      (topicLower.includes("sum") ||
        topicLower.includes("maximum") ||
        topicLower.includes("max"))
    ) {
      const correctSum = computeMaxRootToLeafPathSum(arr);
      exampleOutput = String(correctSum);
      console.log(`✅ Tree Max Root-to-Leaf Path Sum: ${correctSum}`);
    } else {
      exampleOutput = `// AI will compute tree result`;
    }
    console.log(`Generated tree input: ${exampleInput}`);
  } else if (category === "STRING") {
    const length =
      Math.floor(
        Math.random() * (config.stringLength.max - config.stringLength.min + 1),
      ) + config.stringLength.min;
    let str = generateRandomString(length);
    exampleInput = `"${str}"`;
    expectedType = "string";
    dataDescription = `String with ${length} characters`;
    if (topicLower.includes("reverse")) {
      exampleOutput = `"${str.split("").reverse().join("")}"`;
    } else if (topicLower.includes("palindrome")) {
      const half = str.substring(0, Math.floor(str.length / 2));
      const palindrome =
        half +
        str.charAt(Math.floor(str.length / 2)) +
        half.split("").reverse().join("");
      exampleInput = `"${palindrome}"`;
      exampleOutput = "true";
      expectedType = "boolean";
    } else if (topicLower.includes("anagram")) {
      const str1 = generateRandomString(length);
      const str2 = str1
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("");
      exampleInput = `["${str1}", "${str2}"]`;
      exampleOutput = "true";
      expectedType = "boolean";
      dataDescription = "Two strings for anagram check";
    } else if (
      topicLower.includes("count") ||
      topicLower.includes("frequency")
    ) {
      const vowels = "aeiou";
      const count = str
        .split("")
        .filter((c) => vowels.includes(c.toLowerCase())).length;
      exampleOutput = String(count);
      expectedType = "number";
      dataDescription = `Count vowels in "${str}"`;
    } else {
      exampleOutput = `// AI will compute based on string operation`;
    }
    console.log(`Generated string: ${exampleInput}`);
  } else if (category === "MATH") {
    const num = generateRandomNumber(1, difficulty === "advanced" ? 15 : 10);
    exampleInput = String(num);
    expectedType = "number";
    dataDescription = `Number: ${num}`;
    if (topicLower.includes("factorial")) {
      let fact = 1;
      for (let i = 2; i <= num; i++) fact *= i;
      exampleOutput = String(fact);
    } else if (topicLower.includes("fibonacci")) {
      let a = 0,
        b = 1;
      for (let i = 2; i <= num; i++) [a, b] = [b, a + b];
      exampleOutput = String(num <= 1 ? num : b);
    } else if (topicLower.includes("prime")) {
      const isPrime =
        num > 1 &&
        !Array.from({ length: Math.sqrt(num) }, (_, i) => i + 2).some(
          (d) => num % d === 0,
        );
      exampleOutput = isPrime ? "true" : "false";
      expectedType = "boolean";
    } else if (topicLower.includes("gcd") || topicLower.includes("lcm")) {
      const num2 = generateRandomNumber(1, 20);
      exampleInput = `[${num}, ${num2}]`;
      expectedType = "number";
      dataDescription = `Find GCD/LCM of ${num} and ${num2}`;
      if (topicLower.includes("gcd")) {
        let a = num,
          b = num2;
        while (b) {
          [a, b] = [b, a % b];
        }
        exampleOutput = String(a);
      } else {
        let a = num,
          b = num2,
          gcd = a;
        while (b) {
          [gcd, b] = [b, gcd % b];
        }
        exampleOutput = String((a * b) / gcd);
      }
    } else {
      exampleOutput = `// AI will compute math result`;
    }
    console.log(`Generated math input: ${exampleInput}`);
  } else if (category === "MATRIX") {
    const rows = config.matrixSize.rows + (difficulty === "advanced" ? 2 : 0);
    const cols = config.matrixSize.cols + (difficulty === "advanced" ? 2 : 0);
    const matrix = generateRandomMatrix(
      rows,
      cols,
      config.numberRange.min,
      config.numberRange.max,
    );
    exampleInput = JSON.stringify(matrix);
    expectedType = "array";
    dataDescription = `${rows}x${cols} matrix`;
    exampleOutput = `// AI will compute matrix operation result`;
    console.log(`Generated ${rows}x${cols} matrix`);
  } else if (category === "DATA_STRUCTURE") {
    if (topicLower.includes("stack")) {
      const stack = generateRandomArray(5, 1, 100);
      exampleInput = `Stack: ${JSON.stringify(stack)}`;
      expectedType = "mixed";
      dataDescription = "Stack data structure";
    } else if (topicLower.includes("queue")) {
      const queue = generateRandomArray(5, 1, 100);
      exampleInput = `Queue: ${JSON.stringify(queue)}`;
      expectedType = "mixed";
      dataDescription = "Queue data structure";
    } else if (topicLower.includes("hash") || topicLower.includes("map")) {
      const obj = generateRandomObject(4);
      exampleInput = JSON.stringify(obj);
      expectedType = "object";
      dataDescription = "Hash map / dictionary";
    } else {
      exampleInput = JSON.stringify(generateRandomArray(5, 1, 50));
      expectedType = "array";
      dataDescription = "Data structure example";
    }
    exampleOutput = `// AI will compute based on ${topic} operation`;
    console.log(`Generated data structure input: ${exampleInput}`);
  } else {
    const size = Math.min(5, config.arraySize.min);
    const arr = generateRandomArray(size, -20, 20);
    exampleInput = JSON.stringify(arr);
    expectedType = "mixed";
    dataDescription = "General data";
    exampleOutput = `// AI will compute based on ${topic} operation`;
    console.log(`Generated default data: ${exampleInput}`);
  }

  console.log(`Generated input: ${exampleInput}`);
  console.log(`Expected type: ${expectedType}`);
  console.log(`Data description: ${dataDescription}`);
  console.log(`============================================\n`);

  return {
    exampleInput,
    exampleOutput,
    expectedType,
    dataDescription,
    category,
  };
}

// ========== UTILITY ==========
function getMeaningfulLines(code) {
  const lines = code.split("\n");
  const meaningful = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    )
      continue;
    if (/^[{}()\[\];,\s]+$/.test(trimmed)) continue;
    meaningful.push({ lineNum: i + 1, content: lines[i] });
  }
  return meaningful;
}

function validateQuestion(question, code) {
  const lines = code.split("\n");
  const maxLine = lines.length;
  const meaningfulLines = getMeaningfulLines(code);
  const meaningfulLineNumbers = meaningfulLines.map((l) => l.lineNum);
  const lineMatches = question.match(/\b(?:dòng|line)\s+(\d+)\b/gi) || [];
  for (const match of lineMatches) {
    const lineNum = parseInt(match.match(/\d+/)[0]);
    if (lineNum < 1 || lineNum > maxLine) return false;
    if (!meaningfulLineNumbers.includes(lineNum)) return false;
  }
  return true;
}

function isProblemTooComplex(problemStatement, difficulty, topic = "") {
  const wordCount = problemStatement.split(/\s+/).length;
  if (difficulty === "beginner" && wordCount > 80) return true;
  if (difficulty === "intermediate" && wordCount > 120) return true;
  return false;
}

// ========== CALL AI ==========
async function callAI(
  prompt,
  systemMessage = `You are an AI programming expert. Return valid JSON only. No markdown. No explanation outside JSON.`,
  feature = "general",
) {
  const requestId = generateRequestId();
  const model = "llama-3.3-70b-versatile";
  logRequest(model, requestId, prompt, 0.2);
  try {
    const messages = [
      { role: "system", content: systemMessage },
      { role: "user", content: prompt },
    ];
    const startTime = Date.now();
    const result = await groq.invokeWithRetry(messages);
    const durationMs = Date.now() - startTime;
    const responseContent =
      typeof result === "object"
        ? result.content || JSON.stringify(result)
        : result;
    logResponse(model, requestId, responseContent, durationMs);
    const usage = groq.getLastUsage();
    let inputTokens = 0,
      outputTokens = 0,
      totalTokens = 0;
    if (usage) {
      inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
      outputTokens = usage.output_tokens || usage.completion_tokens || 0;
      totalTokens = usage.total_tokens || inputTokens + outputTokens || 0;
    } else {
      inputTokens = Math.ceil(prompt.length / 4);
      outputTokens = Math.ceil(responseContent.length / 4);
      totalTokens = inputTokens + outputTokens;
    }
    logTokenUsage(
      model,
      requestId,
      inputTokens,
      outputTokens,
      totalTokens,
      feature,
    );
    console.log(`\n========== TOKEN USAGE [${feature}] ==========`);
    console.log(`Input tokens: ${inputTokens}`);
    console.log(`Output tokens: ${outputTokens}`);
    console.log(`Total tokens: ${totalTokens}`);
    console.log(`Response preview: ${responseContent.substring(0, 150)}...`);
    console.log(`=============================================\n`);
    return responseContent;
  } catch (error) {
    console.error("LLM Provider Error:", error);
    logError(model, requestId, error, feature);
    return fallbackResponse(prompt);
  }
}

function fallbackResponse(prompt) {
  return JSON.stringify({
    problemStatement:
      "Write a function that takes an array of integers and returns the sum.",
    functionSignature: "function sum(arr) { }",
    content: "Sum array elements",
    testCriteria: "Handle empty array",
    exampleInput: "[1, 2, 3]",
    exampleOutput: "6",
    description: "Sum all numbers in array",
    expectedType: "number",
  });
}

// ========== GENERATE CODE QUESTION WITH RANDOM DATA ==========
async function generateCodeQuestion(language, domain, topic, difficulty) {
  const { style } = getTopicStyle(topic, language, difficulty);
  const topicGuidance = getTopicGuidance(topic, language, difficulty);
  const languageGuidance = getLanguageGuidance(language);
  const domainNote = getDomainNote(domain);
  const randomData = generateRandomDataForTopic(topic, difficulty, language);
  const config = getDifficultyConfig(difficulty);
  const category = categorizeTopic(topic);
  let patternExample = getExampleForTopic(topic, language, difficulty);
  let examples = "";
  if (patternExample) {
    examples = `
EXAMPLE TEMPLATE (use as reference only, create NEW content):
${JSON.stringify(patternExample, null, 2)}

IMPORTANT: 
- Use the random data provided below as exampleInput
- Compute the correct exampleOutput
- Create a completely NEW problem
`;
  }

  let prompt = `You are an expert coding interviewer.
Create ONE coding question with these EXACT requirements:

Language: ${language}
Domain: ${domain}
Topic: ${topic}
Difficulty: ${difficulty}

RULES:
1. The question MUST demonstrate "${topic}" specifically — not generic algorithms.
2. Code must be valid ${language} syntax.
3. Difficulty ${difficulty} means:
   ${difficulty === "beginner" ? "- simple, <15 lines, basic constructs" : difficulty === "intermediate" ? "- 15–30 lines, standard patterns" : "- 30–50 lines, optimized, mention complexity"}
4. Choose the appropriate input type for the topic:
   - OOP/class topics → use object instantiation as exampleInput
   - String topics → use a string as exampleInput
   - Graph/Tree/LinkedList → use a structure description
   - Numeric/Array topics → use a number array
   - YOU decide — pick what fits "${topic}" best.
5. ${difficulty === "advanced" ? "Use LARGER datasets (12-18 elements for arrays)" : difficulty === "intermediate" ? "Use moderate datasets (8-12 elements)" : "Use small datasets (5-7 elements)"}
6. Use numbers in range ${config.numberRange.min} to ${config.numberRange.max} for numeric data
7. exampleOutput MUST be the CORRECT result of running functionSignature on exampleInput.
8. **CRITICAL**: For OOP topics, the exampleInput MUST be a valid object/class instance, NOT an array.
   - Example: new Person("John", 30) NOT [1,2,3,4,5]

${topicGuidance}

${languageGuidance}

${domainNote}

SPECIFIC REQUIREMENTS FOR THIS TOPIC:
${getTopicSpecificRequirements(topic, difficulty, category)}

${examples}

RANDOM DATA TO USE (MUST USE THESE EXACT VALUES):
- exampleInput: ${randomData.exampleInput}
- expectedType: ${randomData.expectedType}
- Category: ${category}

IMPORTANT: 
- Use the exact exampleInput provided above
- For OOP topics (Category: OOP), exampleInput must be a class instance
- Compute the correct exampleOutput for this input
- Do NOT change the exampleInput values

Return ONLY valid JSON:
{
  "problemStatement": "2–4 sentences. What to build, input/output, constraints.",
  "functionSignature": "Complete runnable ${language} code",
  "exampleInput": "${randomData.exampleInput}",
  "exampleOutput": "correct output for the input above",
  "testCriteria": "• criterion 1\\n• criterion 2\\n• criterion 3",
  "description": "one-sentence summary",
  "pattern": "unique_snake_case_name",
  "expectedType": "${randomData.expectedType}"
}`;

  console.log(`\n========== PROMPT SENT TO AI ==========`);
  console.log(`Category: ${category}`);
  console.log(`Prompt length: ${prompt.length} characters`);
  console.log(`======================================\n`);

  const result = await callAI(prompt, undefined, "generateCodeQuestion");
  const parsed = extractJson(result);
  if (parsed && typeof parsed === "object") {
    if (!parsed.exampleInput || parsed.exampleInput === "// Example input") {
      parsed.exampleInput = randomData.exampleInput;
    }
    if (
      randomData.exampleOutput &&
      typeof randomData.exampleOutput === "string" &&
      !randomData.exampleOutput.includes("AI will compute") &&
      !randomData.exampleOutput.trim().startsWith("//") &&
      !randomData.exampleOutput.includes("will return appropriate result")
    ) {
      parsed.exampleOutput = randomData.exampleOutput;
    } else {
      if (
        !parsed.exampleOutput ||
        parsed.exampleOutput.includes("//") ||
        parsed.exampleOutput.includes("compute")
      ) {
        parsed.exampleOutput = computeFallbackOutput(
          topic,
          randomData.exampleInput,
          difficulty,
        );
      }
    }
    if (!parsed.expectedType) {
      parsed.expectedType = randomData.expectedType;
    }
    const fixed = validateAndFixQuestion(
      parsed,
      topic,
      language,
      difficulty,
      randomData,
    );
    return fixed;
  }
  return extractJson(fallbackResponse("coding problem"));
}

// ========== TOPIC SPECIFIC REQUIREMENTS ==========
function getTopicSpecificRequirements(topic, difficulty, category) {
  const topicLower = topic.toLowerCase();
  if (category === "OOP") {
    return `- Create a class with appropriate properties and methods
- ${difficulty === "advanced" ? "Use inheritance and polymorphism" : difficulty === "intermediate" ? "Use encapsulation and methods" : "Basic class with constructor and methods"}
- ExampleInput MUST be a class instance, NOT an array
- Use proper OOP principles`;
  }
  if (category === "ARRAY") {
    return `- Work with arrays/lists
- ${difficulty === "advanced" ? "Handle large datasets with duplicates and edge cases" : "Handle basic edge cases"}`;
  }
  if (category === "GRAPH") {
    return `- Work with trees/graphs
- ${difficulty === "advanced" ? "Complex tree operations like path sum, traversal" : "Basic tree operations"}
- Input is a binary tree represented as level-order array (-1 = null)`;
  }
  if (category === "STRING") {
    return `- Work with strings
- ${difficulty === "advanced" ? "Handle complex string operations with edge cases" : "Basic string manipulation"}`;
  }
  if (category === "MATH") {
    return `- Mathematical computation
- ${difficulty === "advanced" ? "Complex mathematical operations" : "Basic math operations"}`;
  }
  if (category === "MATRIX") {
    return `- Work with 2D arrays/matrices
- ${difficulty === "advanced" ? "Complex matrix operations" : "Basic matrix operations"}`;
  }
  return `- Demonstrate ${topic} concepts
- Handle edge cases appropriately
- Use appropriate data types for the problem`;
}

// ========== computeFallbackOutput ==========
function computeFallbackOutput(topic, input, difficulty) {
  try {
    const topicLower = topic.toLowerCase();
    const category = categorizeTopic(topic);
    if (category === "OOP") return getOOPFallbackOutput(topic);
    let parsedInput;
    try {
      parsedInput = JSON.parse(input);
    } catch {
      if (input.startsWith('"') && input.endsWith('"'))
        parsedInput = input.slice(1, -1);
      else parsedInput = input;
    }
    if (Array.isArray(parsedInput)) {
      const result = computeArrayOutput(topicLower, parsedInput);
      if (result !== null) return result.value;
      if (
        category === "GRAPH" &&
        topicLower.includes("path") &&
        topicLower.includes("sum")
      ) {
        return String(computeMaxRootToLeafPathSum(parsedInput));
      }
    }
    if (typeof parsedInput === "string") {
      if (topicLower.includes("reverse"))
        return `"${parsedInput.split("").reverse().join("")}"`;
      if (topicLower.includes("length") || topicLower.includes("count"))
        return String(parsedInput.length);
      const vowelCount = parsedInput
        .split("")
        .filter((c) => "aeiou".includes(c.toLowerCase())).length;
      if (topicLower.includes("vowel")) return String(vowelCount);
    }
    return `// AI will compute the correct output`;
  } catch (e) {
    console.warn(`[WARNING] Could not compute fallback output: ${e.message}`);
    return `// AI will compute the correct output`;
  }
}

function getOOPFallbackOutput(topic) {
  const topicLower = topic.toLowerCase();
  if (topicLower.includes("student"))
    return "Student instance created with name, age, grade, major";
  if (topicLower.includes("employee"))
    return "Employee instance created with name, age, role, salary";
  if (topicLower.includes("product"))
    return "Product instance created with name, price, category, stock";
  if (topicLower.includes("bank") || topicLower.includes("account"))
    return "BankAccount instance created with accountNumber, balance, owner, type";
  if (topicLower.includes("vehicle") || topicLower.includes("car"))
    return "Vehicle instance created with make, model, year, mileage";
  return "Class instance created successfully";
}

// ========== VALIDATE AND FIX QUESTION ==========
function validateAndFixQuestion(
  parsed,
  topic,
  language,
  difficulty,
  randomData = null,
) {
  const fixed = { ...parsed };
  const category = categorizeTopic(topic);

  // 1. Validate problemStatement
  if (
    !fixed.problemStatement ||
    fixed.problemStatement === "Problem not provided"
  ) {
    fixed.problemStatement = getFallbackProblemStatement(
      topic,
      language,
      difficulty,
    );
  }
  // 2. Validate functionSignature
  if (
    !fixed.functionSignature ||
    fixed.functionSignature === "// Function signature here"
  ) {
    fixed.functionSignature = getFallbackSignature(language, topic, category);
  }
  // 3. Validate exampleInput
  if (!fixed.exampleInput || fixed.exampleInput === "// Example input") {
    fixed.exampleInput = getFallbackExampleInput(language, topic, category);
  }
  // 4. Validate exampleOutput (có thể ghi đè sau)
  const hasValidComputedOutput =
    randomData &&
    randomData.exampleOutput &&
    typeof randomData.exampleOutput === "string" &&
    !randomData.exampleOutput.includes("AI will compute") &&
    !randomData.exampleOutput.trim().startsWith("//") &&
    !randomData.exampleOutput.includes("will return appropriate result");
  if (hasValidComputedOutput) {
    fixed.exampleOutput = randomData.exampleOutput;
  } else if (
    !fixed.exampleOutput ||
    fixed.exampleOutput === "// Example output" ||
    fixed.exampleOutput.includes("compute")
  ) {
    fixed.exampleOutput = getFallbackExampleOutput(topic, category);
  }
  // 5. Validate testCriteria
  if (!fixed.testCriteria) {
    fixed.testCriteria = getFallbackTestCriteria(topic, difficulty);
  }
  // 6. Validate description
  if (!fixed.description) {
    fixed.description = fixed.problemStatement.substring(0, 100);
  }
  // 7. Ensure content exists
  fixed.content = fixed.problemStatement;
  // 8. Add expectedType if missing
  if (!fixed.expectedType) {
    fixed.expectedType = inferExpectedType(fixed.exampleOutput);
  }
  // 9. For OOP topics, ensure exampleInput is not an array
  if (
    category === "OOP" &&
    fixed.exampleInput &&
    fixed.exampleInput.startsWith("[")
  ) {
    const oopData = generateOOPExample(topic, language, difficulty);
    fixed.exampleInput = oopData.exampleInput;
    fixed.expectedType = "object";
  }

  // ========== XỬ LÝ CÁC BÀI TOÁN PHỨC TẠP (dựa trên tên hàm hoặc problemStatement) ==========
  if (category === "ARRAY" && fixed.problemStatement) {
    const ps = fixed.problemStatement.toLowerCase();
    const fn = (fixed.functionSignature || "")
      .toLowerCase()
      .replace(/\s+/g, "");

    let inputArr;
    try {
      inputArr = JSON.parse(fixed.exampleInput);
    } catch (e) {
      /* bỏ qua */
    }

    if (Array.isArray(inputArr) && inputArr.length > 0) {
      // 1. findSubarrayWithMaxSum - trả về mảng con
      if (
        fn.includes("findsubarraywithmaxsum") ||
        (ps.includes("subarray") && ps.includes("maximum sum"))
      ) {
        const sub = computeMaxSubarrayArray(inputArr);
        fixed.exampleOutput = JSON.stringify(sub);
        fixed.expectedType = "array";
        console.log(`[FIX] findSubarrayWithMaxSum: ${fixed.exampleOutput}`);
      }
      // 2. maxSubarraySum - trả về tổng
      else if (
        fn.includes("maxsubarraysum") ||
        (ps.includes("maximum sum") && !ps.includes("return the subarray"))
      ) {
        const sum = computeMaxSubarraySum(inputArr);
        fixed.exampleOutput = String(sum);
        fixed.expectedType = "number";
        console.log(`[FIX] maxSubarraySum: ${fixed.exampleOutput}`);
      }
      // 3. findSubarraySums - trả về mảng tất cả tổng
      else if (
        fn.includes("findsubarraysums") ||
        (ps.includes("subarray") &&
          ps.includes("sum") &&
          !ps.includes("maximum") &&
          !ps.includes("max"))
      ) {
        const sums = computeAllSubarraySums(inputArr);
        fixed.exampleOutput = JSON.stringify(sums);
        fixed.expectedType = "array";
        console.log(`[FIX] findSubarraySums: ${fixed.exampleOutput}`);
      }
      // 4. findSecondMaxAndMin - trả về [secondMax, secondMin]
      else if (
        fn.includes("findsecondmaxandmin") ||
        (ps.includes("second") && ps.includes("max") && ps.includes("min"))
      ) {
        const [secondMax, secondMin] = computeSecondMaxAndMin(inputArr);
        if (secondMax !== null && secondMin !== null) {
          fixed.exampleOutput = JSON.stringify([secondMax, secondMin]);
        } else {
          fixed.exampleOutput = "[null, null]";
        }
        fixed.expectedType = "array";
        console.log(`[FIX] findSecondMaxAndMin: ${fixed.exampleOutput}`);
      }
      // 5. findSecondMax - trả về [secondMax]
      else if (
        fn.includes("findsecondmax") &&
        !fn.includes("findsecondmaxandmin")
      ) {
        const secondMax = computeSecondMax(inputArr);
        if (secondMax !== null) {
          fixed.exampleOutput = JSON.stringify([secondMax]);
        } else {
          fixed.exampleOutput = JSON.stringify([-1]);
        }
        fixed.expectedType = "array";
        console.log(`[FIX] findSecondMax: ${fixed.exampleOutput}`);
      }
      // 6. findSecondMin - trả về [secondMin]
      else if (fn.includes("findsecondmin")) {
        const secondMin = computeSecondMin(inputArr);
        if (secondMin !== null) {
          fixed.exampleOutput = JSON.stringify([secondMin]);
        } else {
          fixed.exampleOutput = JSON.stringify([-1]);
        }
        fixed.expectedType = "array";
        console.log(`[FIX] findSecondMin: ${fixed.exampleOutput}`);
      }
    } else if (Array.isArray(inputArr) && inputArr.length === 0) {
      // Xử lý mảng rỗng
      if (
        fn.includes("findsubarraywithmaxsum") ||
        (ps.includes("subarray") && ps.includes("maximum sum"))
      ) {
        fixed.exampleOutput = "[]";
        fixed.expectedType = "array";
      } else if (
        fn.includes("maxsubarraysum") ||
        (ps.includes("maximum sum") && !ps.includes("return the subarray"))
      ) {
        fixed.exampleOutput = "0";
        fixed.expectedType = "number";
      } else if (
        fn.includes("findsubarraysums") ||
        (ps.includes("subarray") &&
          ps.includes("sum") &&
          !ps.includes("maximum"))
      ) {
        fixed.exampleOutput = "[]";
        fixed.expectedType = "array";
      } else if (
        fn.includes("findsecondmax") ||
        fn.includes("findsecondmin") ||
        fn.includes("findsecondmaxandmin")
      ) {
        fixed.exampleOutput = JSON.stringify([-1]);
        fixed.expectedType = "array";
      }
    }
  }
  // ================================================

  return fixed;
}

function inferExpectedType(exampleOutput) {
  if (!exampleOutput) return "mixed";
  const trimmed = exampleOutput.trim();
  if (trimmed === "true" || trimmed === "false") return "boolean";
  if (trimmed === "null") return "null";
  if (trimmed === "undefined") return "undefined";
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) return "array";
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return "object";
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return "string";
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return "string";
  if (!isNaN(parseFloat(trimmed))) return "number";
  return "mixed";
}

// ========== FALLBACK FUNCTIONS ==========
function getFallbackProblemStatement(topic, language, difficulty) {
  const templates = {
    beginner: `Write a simple function that demonstrates the concept of ${topic} in ${language}. Focus on basic syntax and logic.`,
    intermediate: `Implement a solution that showcases ${topic} in ${language}. Include proper error handling and edge cases.`,
    advanced: `Create a robust implementation of ${topic} in ${language}. Demonstrate best practices and handle complex scenarios.`,
  };
  return templates[difficulty?.toLowerCase()] || templates.intermediate;
}

function getFallbackSignature(language, topic, category) {
  const cleanTopic = topic.toLowerCase().replace(/\s+/g, "_");
  if (category === "OOP") {
    const signatures = {
      javascript: `class ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)} {\n  constructor() { /* implementation */ }\n}`,
      python: `class ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}:\n    def __init__(self):\n        pass`,
      java: `public class ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)} {\n    public ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}() { }\n}`,
      csharp: `public class ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)} {\n    public ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}() { }\n}`,
      cpp: `class ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)} {\npublic:\n    ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)}() { }\n};`,
      go: `type ${cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1)} struct {\n    // fields\n}`,
    };
    return signatures[language] || `// Define ${cleanTopic} class`;
  }
  const signatures = {
    javascript: `function ${cleanTopic}() { /* implementation */ }`,
    python: `def ${cleanTopic}():\n    pass`,
    java: `public static void ${cleanTopic}() { }`,
    csharp: `public static void ${cleanTopic}() { }`,
    cpp: `void ${cleanTopic}() { }`,
    go: `func ${cleanTopic}() { }`,
  };
  return signatures[language] || `// Define ${topic} function/method`;
}

function getFallbackExampleInput(language, topic, category) {
  const topicLower = topic.toLowerCase();
  if (category === "OOP")
    return generateOOPExample(topic, language, "intermediate").exampleInput;
  if (category === "GRAPH") return "[1, 2, 3, 4, 5, 6, 7]";
  if (topicLower.includes("array") || topicLower === "arrays")
    return "[1, 2, 3, 4, 5]";
  if (topicLower.includes("string") || topicLower === "strings")
    return "'hello world'";
  if (topicLower.includes("object") || topicLower === "objects")
    return "{name: 'John', age: 30}";
  if (
    topicLower.includes("math") ||
    topicLower.includes("factorial") ||
    topicLower.includes("fibonacci")
  )
    return "5";
  return "// Example usage";
}

function getFallbackExampleOutput(topic, category) {
  const topicLower = topic.toLowerCase();
  if (category === "OOP") return getOOPFallbackOutput(topic);
  if (
    category === "GRAPH" &&
    topicLower.includes("path") &&
    topicLower.includes("sum")
  )
    return "20";
  if (topicLower.includes("sum") || topicLower.includes("total")) return "15";
  if (topicLower.includes("max")) return "10";
  if (topicLower.includes("min")) return "1";
  if (topicLower.includes("sort")) return "[1, 2, 3, 4, 5]";
  if (topicLower.includes("reverse")) return "'olleh'";
  if (topicLower.includes("palindrome")) return "true";
  if (topicLower.includes("factorial")) return "120";
  if (topicLower.includes("fibonacci")) return "8";
  return "// Expected output";
}

function getFallbackTestCriteria(topic, difficulty) {
  if (difficulty === "beginner") {
    return "• Basic functionality works\n• Simple test cases pass\n• Handles edge cases appropriately";
  } else if (difficulty === "intermediate") {
    return "• Handles edge cases\n• Error handling implemented\n• Efficient solution\n• Uses appropriate data structures";
  } else {
    return "• All edge cases covered\n• Optimized solution\n• Production-ready code\n• Comprehensive error handling\n• Follows best practices";
  }
}

// ========== CÁC HÀM GIẢI THÍCH (có fix số dòng) ==========
async function generateExplanationQuestion(
  language,
  userCode,
  originalQuestion,
  difficulty = "beginner",
  askedLineNumbers = [],
) {
  const meaningfulLines = getMeaningfulLines(userCode);
  let availableLines = meaningfulLines.filter(
    (l) => !askedLineNumbers.includes(l.lineNum),
  );
  if (availableLines.length === 0) availableLines = meaningfulLines;
  const lineList = availableLines
    .map((l) => `Line ${l.lineNum}: ${l.content.trim()}`)
    .join("\n");
  const prompt = `Language: ${language}
Difficulty: ${difficulty}

CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES (not asked before):
${lineList}

Pick ONE line from above. Ask what it does and why it's needed. Quote the exact code.
**YOUR QUESTION MUST START WITH "On line X: " WHERE X IS THE LINE NUMBER.**
Return JSON: {"type": "explain", "question": "...", "lineNumber": line_number}`;
  const result = await callAI(prompt, undefined, "generateExplanationQuestion");
  const parsed = extractJson(result);
  if (
    parsed?.type === "explain" &&
    parsed?.question &&
    parsed?.lineNumber &&
    validateQuestion(parsed.question, userCode)
  ) {
    if (!parsed.question.includes(parsed.lineNumber)) {
      parsed.question = `On line ${parsed.lineNumber}: ${parsed.question}`;
    }
    return {
      type: "explain",
      question: parsed.question,
      lineNumber: parsed.lineNumber,
    };
  }
  if (availableLines.length > 0) {
    const random =
      availableLines[Math.floor(Math.random() * availableLines.length)];
    return {
      type: "explain",
      question: `On line ${random.lineNum}: \`${random.content.trim()}\`. What does this line do and why is it needed?`,
      lineNumber: random.lineNum,
    };
  }
  return {
    type: "explain",
    question: "Explain the overall purpose and logic of the code above.",
    lineNumber: null,
  };
}

async function generateNextExplanationQuestion(
  language,
  userCode,
  userAnswer,
  currentQuestion,
  explainCount,
  difficulty = "beginner",
  askedLineNumbers = [],
) {
  const meaningfulLines = getMeaningfulLines(userCode);
  let availableLines = meaningfulLines.filter(
    (l) => !askedLineNumbers.includes(l.lineNum),
  );
  if (availableLines.length === 0) availableLines = meaningfulLines;
  const lineList = availableLines
    .map((l) => `Line ${l.lineNum}: ${l.content.trim()}`)
    .join("\n");
  const prompt = `Language: ${language}
Previous Q: ${currentQuestion.question}
Student's answer: ${userAnswer}

CODE:
\`\`\`${language}
${userCode}
\`\`\`

MEANINGFUL LINES (not asked before):
${lineList}

Ask about a DIFFERENT line.
**YOUR QUESTION MUST START WITH "On line X: " WHERE X IS THE LINE NUMBER.**
Return JSON: {"type": "explain", "question": "...", "lineNumber": line_number}`;
  const result = await callAI(
    prompt,
    undefined,
    "generateNextExplanationQuestion",
  );
  const parsed = extractJson(result);
  if (
    parsed?.type === "explain" &&
    parsed?.question &&
    parsed?.lineNumber &&
    validateQuestion(parsed.question, userCode)
  ) {
    if (!parsed.question.includes(parsed.lineNumber)) {
      parsed.question = `On line ${parsed.lineNumber}: ${parsed.question}`;
    }
    return {
      type: "explain",
      question: parsed.question,
      lineNumber: parsed.lineNumber,
    };
  }
  if (availableLines.length > 0) {
    const random =
      availableLines[Math.floor(Math.random() * availableLines.length)];
    return {
      type: "explain",
      question: `On line ${random.lineNum}: \`${random.content.trim()}\`. Why is this line necessary?`,
      lineNumber: random.lineNum,
    };
  }
  return {
    type: "explain",
    question: "Explain a different aspect of your code.",
    lineNumber: null,
  };
}

async function evaluateExplanation(language, answer, currentQuestion) {
  const prompt = `Language: ${language}
Question: ${currentQuestion.question}
Student's answer: ${answer}

Evaluate if correct. Return JSON:
{
  "correct": true/false,
  "feedback": "One sentence starting with Correct/Incorrect.",
  "modelAnswer": "Complete answer (2-3 sentences)"
}`;
  try {
    const result = await callAI(prompt, undefined, "evaluateExplanation");
    const parsed = extractJson(result);
    if (
      parsed &&
      typeof parsed.correct === "boolean" &&
      typeof parsed.feedback === "string"
    ) {
      return {
        correct: parsed.correct,
        feedback: parsed.feedback.replace(/\.\.\./g, "."),
        modelAnswer: (parsed.modelAnswer || "No model answer.").replace(
          /\.\.\./g,
          ".",
        ),
      };
    }
    throw new Error("Invalid response");
  } catch (e) {
    console.error("evaluateExplanation error:", e);
    return {
      correct: false,
      feedback: "AI is overloaded. Please try again.",
      modelAnswer: "No model answer due to system error.",
    };
  }
}

async function evaluateCodeAndExplanations(
  language,
  code,
  problemStatement,
  explainAnswers,
) {
  const prompt = `Language: ${language}
Problem: ${problemStatement}

Code:
\`\`\`${language}
${code}
\`\`\`

Explanations: ${JSON.stringify(explainAnswers, null, 2)}

Evaluate overall performance. Return JSON:
{
  "summary": "2-3 sentence summary",
  "feedback": "Specific advice",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"]
}`;
  try {
    const result = await callAI(
      prompt,
      undefined,
      "evaluateCodeAndExplanations",
    );
    const parsed = extractJson(result);
    if (parsed && typeof parsed.summary === "string") {
      const clean = (str) => (str || "").replace(/\.\.\./g, ".");
      const cleanArr = (arr) =>
        Array.isArray(arr) ? arr.map((s) => clean(s)) : [];
      return {
        summary: clean(parsed.summary),
        feedback: clean(parsed.feedback || parsed.summary),
        strengths: cleanArr(parsed.strengths),
        weaknesses: cleanArr(parsed.weaknesses),
      };
    }
    throw new Error("Invalid response");
  } catch (e) {
    console.error("evaluateCodeAndExplanations error:", e);
    return {
      summary: "Unable to evaluate due to system error.",
      feedback: "AI encountered an issue. Please try again.",
      strengths: [],
      weaknesses: [],
    };
  }
}

async function evaluateCodeSubmission(
  language,
  code,
  problemStatement,
  expectedOutput = "",
) {
  const syntaxPrompt = `Check syntax errors in this ${language} code:
\`\`\`${language}
${code}
\`\`\`
Return JSON: {"hasSyntaxError": boolean, "feedback": "..."}`;
  try {
    const syntaxResult = await callAI(
      syntaxPrompt,
      undefined,
      "evaluateCode_syntax",
    );
    const syntaxParsed = extractJson(syntaxResult);
    if (syntaxParsed?.hasSyntaxError === true) {
      return {
        correct: false,
        feedback: (syntaxParsed.feedback || "Syntax error detected.").replace(
          /\.\.\./g,
          ".",
        ),
        modelAnswer: "",
      };
    }
    const logicPrompt = `Language: ${language}
Problem: ${problemStatement}
Expected output: ${expectedOutput}

Code:
\`\`\`${language}
${code}
\`\`\`

Check if correct for typical valid inputs. Return JSON:
{
  "correct": boolean,
  "feedback": "One sentence.",
  "modelAnswer": "Short fix if wrong (empty if correct)"
}`;
    const logicResult = await callAI(
      logicPrompt,
      undefined,
      "evaluateCode_logic",
    );
    const logicParsed = extractJson(logicResult);
    if (logicParsed && typeof logicParsed.correct === "boolean") {
      return {
        correct: logicParsed.correct,
        feedback: (
          logicParsed.feedback ||
          (logicParsed.correct ? "Code is correct." : "Logic error.")
        ).replace(/\.\.\./g, "."),
        modelAnswer: (logicParsed.modelAnswer || "").replace(/\.\.\./g, "."),
      };
    }
    throw new Error("Invalid logic response");
  } catch (e) {
    console.error("evaluateCodeSubmission error:", e);
    return {
      correct: false,
      feedback: "Unable to evaluate code due to AI error.",
      modelAnswer: "",
    };
  }
}

// ========== FORMAT CODE WITH LINE NUMBERS ==========
function formatCodeWithLineNumbers(code) {
  if (!code) return "";
  const lines = code.split("\n");
  return lines.map((line, index) => `${index + 1}: ${line}`).join("\n");
}

// ========== EXPORTS ==========
module.exports = {
  callAI,
  generateCodeQuestion,
  generateExplanationQuestion,
  generateNextExplanationQuestion,
  evaluateExplanation,
  evaluateCodeAndExplanations,
  evaluateCodeSubmission,
  validateQuestion,
  getMeaningfulLines,
  validateAndFixQuestion,
  formatCodeWithLineNumbers,
  generateRandomArray,
  generateRandomString,
  generateRandomObject,
  generateRandomMatrix,
  DIFFICULTY_CONFIG,
  categorizeTopic,
  isOOPTopic,
  isArrayTopic,
  isStringTopic,
  generateOOPExample,
  computeMaxRootToLeafPathSum,
  computeArrayOutput,
  computeMaxSubarrayArray,
  computeMaxSubarraySum,
  computeAllSubarraySums,
  computeSecondMaxAndMin,
  computeSecondMax,
  computeSecondMin,
};
