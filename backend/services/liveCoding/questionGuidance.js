// services/liveCoding/questionGuidance.js - COMPLETE FIXED VERSION WITH DIFFICULTY

// ========== 1. MAP TOPIC -> CATEGORY với STYLE ==========
const TOPIC_CATEGORY = {
  Arrays: { category: "array_basic", style: "function" },
  Lists: { category: "linear_ds", style: "function" },
  Tuples: { category: "linear_ds", style: "function" },
  Sorting: { category: "algorithm", style: "function" },
  Searching: { category: "algorithm", style: "function" },
  "Higher-order Functions": { category: "functional", style: "function" },
  "Pure Functions": { category: "functional", style: "function" },
  Currying: { category: "functional", style: "function" },
  "Error Handling": { category: "error_handling", style: "function" },
  Packages: { category: "error_handling", style: "function" },
  Inheritance: { category: "oop_inheritance", style: "class" },
  Polymorphism: { category: "oop_inheritance", style: "class" },
  Encapsulation: { category: "oop_encapsulation", style: "class" },
  "Private Variables": { category: "oop_encapsulation", style: "class" },
  Abstraction: { category: "oop_abstraction", style: "class" },
  Interfaces: { category: "oop_abstraction", style: "class" },
  Classes: { category: "oop_basic", style: "class" },
  Prototypes: { category: "oop_basic", style: "class" },
  "Magic Methods": { category: "oop_basic", style: "class" },
  List: { category: "linear_ds", style: "auto" },
  Queue: { category: "linear_ds", style: "auto" },
  Stacks: { category: "linear_ds", style: "auto" },
  Queues: { category: "linear_ds", style: "auto" },
  Iterators: { category: "linear_ds", style: "auto" },
  Dictionaries: { category: "hashmap_ds", style: "auto" },
  Sets: { category: "hashmap_ds", style: "auto" },
  Set: { category: "hashmap_ds", style: "auto" },
  Map: { category: "hashmap_ds", style: "auto" },
  "Linked Lists": { category: "linked_list", style: "auto" },
  Trees: { category: "tree_graph", style: "auto" },
  Graphs: { category: "tree_graph", style: "auto" },
  "Smart Pointers": { category: "cpp_smart_pointers", style: "class" },
  "Move Semantics": { category: "cpp_move", style: "function" },
  RAII: { category: "cpp_raii", style: "class" },
  Templates: { category: "cpp_templates", style: "function" },
  STL: { category: "cpp_stl", style: "function" },
  "Virtual Functions": { category: "cpp_virtual", style: "class" },
  Events: { category: "csharp_events", style: "class" },
  Properties: { category: "csharp_properties", style: "class" },
  Indexers: { category: "csharp_indexers", style: "class" },
  Delegates: { category: "csharp_delegates", style: "function" },
  LINQ: { category: "csharp_linq", style: "functional_builtin" },
  "async/await": { category: "csharp_async", style: "async" },
  Goroutines: { category: "go_goroutines", style: "conceptual" },
  Channels: { category: "go_channels", style: "conceptual" },
  Select: { category: "go_select", style: "conceptual" },
  WaitGroups: { category: "go_waitgroups", style: "conceptual" },
  Context: { category: "go_context", style: "conceptual" },
  defer: { category: "go_defer", style: "function" },
  Threads: { category: "concurrency", style: "conceptual" },
  Runnable: { category: "concurrency", style: "conceptual" },
  Synchronized: { category: "concurrency", style: "conceptual" },
  Locks: { category: "concurrency", style: "conceptual" },
  Executors: { category: "concurrency", style: "conceptual" },
  Lambda: { category: "functional", style: "functional_builtin" },
  Lambdas: { category: "functional", style: "functional_builtin" },
  Filter: { category: "functional", style: "functional_builtin" },
  Reduce: { category: "functional", style: "functional_builtin" },
  "Filter/Map/Reduce": { category: "functional", style: "functional_builtin" },
  "Stream API": { category: "functional", style: "functional_builtin" },
  Collectors: { category: "functional", style: "functional_builtin" },
  Decorators: { category: "decorators", style: "decorator" },
  "Function Decorators": { category: "decorators", style: "decorator" },
  "Class Decorators": { category: "decorators", style: "decorator" },
  Functools: { category: "decorators", style: "decorator" },
  Yield: { category: "generators", style: "generator" },
  "Generator Expressions": { category: "generators", style: "generator" },
  "Lazy Evaluation": { category: "generators", style: "generator" },
  Callbacks: { category: "async", style: "async" },
  Promises: { category: "async", style: "async" },
  "Async/Await": { category: "async", style: "async" },
  "Event Loop": { category: "async", style: "async" },
  Selectors: { category: "dom", style: "dom" },
  Events: { category: "dom", style: "dom" },
  "Dynamic Rendering": { category: "dom", style: "dom" },
  Closures: { category: "closures", style: "closure" },
  "Lexical Scoping": { category: "closures", style: "closure" },
  Modules: { category: "closures", style: "closure" },
};

// ========== 2. HÀM XÁC ĐỊNH STYLE ==========
function getTopicStyle(topic, language, difficulty) {
  const topicInfo = TOPIC_CATEGORY[topic];
  if (!topicInfo) return { style: "function", category: "default" };

  let { style, category } = topicInfo;

  if (style === "auto") {
    const lang = language.toLowerCase();
    if (["java", "csharp", "cpp"].includes(lang)) {
      style = "class";
    } else if (["python", "javascript", "typescript"].includes(lang)) {
      style = difficulty === "beginner" ? "function" : "class";
    } else if (lang === "go") {
      style = "function";
    } else {
      style = "function";
    }
  }

  return { style, category };
}

// ========== 3. CONCURRENCY/ASYNC TOPICS ==========
const CONCURRENCY_ASYNC_TOPICS = new Set([
  "Threads",
  "Runnable",
  "Synchronized",
  "Locks",
  "Executors",
  "Async/Await",
  "Event Loop",
  "Promises",
  "Callbacks",
  "Goroutines",
  "Channels",
  "Select",
  "WaitGroups",
  "Context",
]);

function isConcurrencyOrAsyncTopic(topic) {
  return CONCURRENCY_ASYNC_TOPICS.has(topic);
}

// ========== 4. TEMPLATES THEO STYLE ==========
const STYLE_TEMPLATES = {
  function: `
REQUIRED STRUCTURE — FUNCTION-BASED:
- Implement as a SINGLE function (or static method in Java/C#/C++).
- Input: receive all data as arguments.
- Output: return value directly.
- DO NOT create a class wrapper.
- DO NOT require instantiation before calling.`,

  class: `
REQUIRED STRUCTURE — CLASS-BASED:
- Implement as a CLASS with constructor, fields, and methods.
- State maintained between method calls.
- Methods modify/query instance state.`,

  conceptual: `
REQUIRED STRUCTURE — CONCEPTUAL/SIMULATED:
- This is a CONCEPTUAL exercise, not real execution.
- Implement a SINGLE-THREADED simulation.
- Output must be 100% deterministic.`,

  functional_builtin: `
REQUIRED STRUCTURE — FUNCTIONAL STYLE:
- MUST use built-in functional methods (map, filter, reduce, streams).
- DO NOT use manual loops for transformation.
- Prefer method chaining and declarative style.`,

  decorator: `
REQUIRED STRUCTURE — DECORATOR PATTERN (Python):
- Define decorator function using @ syntax.
- Decorator wraps another function to add behavior.`,

  generator: `
REQUIRED STRUCTURE — GENERATOR (Python):
- Define generator function using "yield" keyword.
- Returns generator object, not list.
- Values produced lazily on-demand.`,

  async: `
REQUIRED STRUCTURE — ASYNC PATTERN:
- Use async/await or Promise syntax.
- All async operations resolve immediately for determinism.`,

  dom: `
REQUIRED STRUCTURE — DOM SIMULATION:
- Model DOM as plain JS objects/arrays.
- No real browser DOM.`,

  closure: `
REQUIRED STRUCTURE — CLOSURE:
- Outer function returns inner function(s).
- Inner functions retain access to outer variables.
- Demonstrate state preservation.`,
};

// ========== 5. CATEGORY TEMPLATES (cũ) ==========
const CATEGORY_TEMPLATES = {
  array_basic: `
TOPIC FOCUS — ARRAY OPERATIONS:
- Work with array input, produce single value or new array.
- Common tasks: find max/min, sum, filter, map, search, reverse.
- Edge cases: empty array, single element, duplicates.
- DO NOT require object instantiation - use static/standalone function.`,

  linear_ds: `
TOPIC FOCUS — {TOPIC}:
- {TOPIC} is a fundamental data structure.
- {STYLE_DESCRIPTION}
- Operations should be typical for this structure.
- Handle empty state appropriately.`,

  hashmap_ds: `
TOPIC FOCUS — {TOPIC}:
- Work with key-value pairs or unique elements.
- {STYLE_DESCRIPTION}
- Show insertion, lookup, deletion operations.
- Handle non-existent keys appropriately.`,

  linked_list: `
TOPIC FOCUS — LINKED LISTS:
- Implement node-based linked structure.
- {STYLE_DESCRIPTION}
- Required operations: insert, delete, traverse/search.
- Handle head/tail edge cases.`,

  tree_graph: `
TOPIC FOCUS — {TOPIC} (SIMPLIFIED):
- Keep structure small (max 5-7 nodes for trees, 4 nodes for graphs).
- ONE simple operation: insert, search, or single traversal.
- {STYLE_DESCRIPTION}`,

  algorithm: `
TOPIC FOCUS — {TOPIC} ALGORITHM:
- Implement the algorithm MANUALLY (not using built-in).
- {STYLE_DESCRIPTION}
- State order/criteria explicitly.`,

  oop_inheritance: `
TOPIC FOCUS — {TOPIC}:
- Parent class with common behavior, child class extends.
- Child must override at least one method.
- {STYLE_DESCRIPTION}
- Show polymorphism via parent reference to child instance.`,

  oop_encapsulation: `
TOPIC FOCUS — {TOPIC}:
- Private fields with public getters/setters.
- Validation in setters (reject invalid values).
- {STYLE_DESCRIPTION}`,

  oop_abstraction: `
TOPIC FOCUS — {TOPIC}:
- Abstract class or interface with method declarations.
- Concrete class implementing all abstract methods.
- {STYLE_DESCRIPTION}`,

  oop_basic: `
TOPIC FOCUS — {TOPIC}:
- Single class with constructor and 2-3 meaningful methods.
- {STYLE_DESCRIPTION}`,

  concurrency: `
TOPIC FOCUS — {TOPIC} (CONCEPTUAL):
- Single-threaded simulation of concurrency concept.
- {STYLE_DESCRIPTION}
- Output must be deterministic, no real threading.`,

  functional: `
TOPIC FOCUS — {TOPIC}:
- {STYLE_DESCRIPTION}
- Prefer declarative over imperative approach.
- Avoid side effects when possible.`,

  error_handling: `
TOPIC FOCUS — {TOPIC}:
- Handle error cases explicitly (invalid input, edge conditions).
- {STYLE_DESCRIPTION}
- Show both success and error paths.`,

  cpp_smart_pointers: `
TOPIC FOCUS — SMART POINTERS (C++):
- Use std::unique_ptr, std::shared_ptr, or std::weak_ptr.
- Demonstrate automatic memory management.
- No raw new/delete.`,

  cpp_move: `
TOPIC FOCUS — MOVE SEMANTICS (C++):
- Implement move constructor and move assignment.
- Use std::move appropriately.
- Show resource transfer without copying.`,

  cpp_raii: `
TOPIC FOCUS — RAII (C++):
- Resource acquisition is initialization.
- Constructor acquires resource, destructor releases.
- Use for file handles, locks, memory.`,

  cpp_templates: `
TOPIC FOCUS — TEMPLATES (C++):
- Write generic code using template parameters.
- Can be function templates or class templates.
- Show type safety and code reuse.`,

  cpp_stl: `
TOPIC FOCUS — STL (C++):
- Use Standard Template Library containers/algorithms.
- Examples: vector, map, sort, find, accumulate.
- Prefer STL over manual implementation.`,

  cpp_virtual: `
TOPIC FOCUS — VIRTUAL FUNCTIONS (C++):
- Base class with virtual methods.
- Derived class overrides with 'override' keyword.
- Demonstrate polymorphism via base pointer/reference.`,

  csharp_events: `
TOPIC FOCUS — EVENTS (C#):
- Define event using EventHandler or custom delegate.
- Subscribe/unsubscribe using += and -=.
- Raise event with null check.`,

  csharp_properties: `
TOPIC FOCUS — PROPERTIES (C#):
- Use auto-properties or full properties.
- get/set accessors with validation.
- Computed properties, required/init keywords.`,

  csharp_indexers: `
TOPIC FOCUS — INDEXERS (C#):
- Implement this[] syntax for class.
- Support integer or string keys.
- Can be overloaded and multi-dimensional.`,

  csharp_delegates: `
TOPIC FOCUS — DELEGATES (C#):
- Use Func, Action, or custom delegates.
- Pass methods as parameters.
- Combine delegates (multicast).`,

  csharp_linq: `
TOPIC FOCUS — LINQ (C#):
- Use query syntax or method syntax.
- Operations: Where, Select, GroupBy, OrderBy, Join.
- Deferred execution vs immediate.`,

  csharp_async: `
TOPIC FOCUS — ASYNC/AWAIT (C#):
- Use async Task<T> pattern.
- Await async operations.
- Handle CancellationToken.`,

  go_goroutines: `
TOPIC FOCUS — GOROUTINES (Go):
- Use 'go' keyword to launch goroutine.
- Demonstrate concurrent execution.
- No shared memory - use channels for communication.`,

  go_channels: `
TOPIC FOCUS — CHANNELS (Go):
- Create channels with make(chan Type).
- Send/receive with <- operator.
- Buffered vs unbuffered channels.`,

  go_select: `
TOPIC FOCUS — SELECT (Go):
- Use select to wait on multiple channel operations.
- Handle timeout with time.After.
- Default case for non-blocking.`,

  go_waitgroups: `
TOPIC FOCUS — WAITGROUPS (Go):
- Use sync.WaitGroup to wait for goroutines.
- Add(), Done(), Wait() methods.
- Ensure all goroutines complete.`,

  go_context: `
TOPIC FOCUS — CONTEXT (Go):
- Use context for cancellation and deadlines.
- Propagate context through function calls.
- Handle ctx.Done() signal.`,

  go_defer: `
TOPIC FOCUS — DEFER (Go):
- Use defer for cleanup operations.
- LIFO order execution.
- Common uses: close files, unlock mutexes.`,

  default: `
TOPIC FOCUS — {TOPIC}:
- Problem must be directly about "{TOPIC}".
- {STYLE_DESCRIPTION}
- Ensure solution matches difficulty level.`,
};

// ========== 6. HÀM CHÍNH (có thêm difficulty guide) ==========
function getTopicGuidance(topic, language, difficulty = "intermediate") {
  const { style, category } = getTopicStyle(topic, language, difficulty);

  let shortStyleDesc = "";
  if (style === "function") {
    shortStyleDesc =
      "Implement as a SINGLE function (or static method), NOT a class wrapper.";
  } else if (style === "class") {
    shortStyleDesc =
      "Implement as a CLASS with constructor, fields, and methods.";
  } else if (style === "conceptual") {
    shortStyleDesc =
      "Implement as a CONCEPTUAL simulation (deterministic, no real execution).";
  } else if (style === "functional_builtin") {
    shortStyleDesc =
      "MUST use map/filter/reduce or stream methods. No manual loops.";
  } else {
    shortStyleDesc = `Use ${style} style as appropriate for ${topic}.`;
  }

  let categoryTemplate =
    CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.default;

  let guidance = categoryTemplate
    .replace(/\{TOPIC\}/g, topic)
    .replace(/\{STYLE_DESCRIPTION\}/g, shortStyleDesc);

  // Special case for arrays in Java/C#/C++
  if (
    category === "array_basic" &&
    ["java", "csharp", "cpp"].includes(language.toLowerCase())
  ) {
    guidance += `
IMPORTANT: Use STATIC method, NOT instance method on a wrapper class.
Good: "public static int findMax(int[] arr)"
Bad: "new ArrayManipulator().findMax(arr)"`;
  }

  // ========== THÊM HƯỚNG DẪN THEO DIFFICULTY ==========
  let diffGuide = "";
  if (difficulty === "beginner") {
    diffGuide = `
BEGINNER LEVEL GUIDELINES:
- Keep solution simple (max 15 lines).
- Use basic constructs: loops, conditionals, simple functions.
- No recursion unless extremely trivial.
- Provide clear, runnable code.
- Do not require deep algorithmic knowledge.`;
  } else if (difficulty === "intermediate") {
    diffGuide = `
INTERMEDIATE LEVEL GUIDELINES:
- Solution length 15-30 lines.
- May include a class with few methods or recursion.
- Handle edge cases (empty input, nulls).
- Reasonable efficiency, but not necessarily optimal.
- Expected to demonstrate understanding of the topic.`;
  } else if (difficulty === "advanced") {
    diffGuide = `
ADVANCED LEVEL GUIDELINES:
- Solution length 30-50 lines.
- May use inheritance, generics, concurrency simulation, functional patterns.
- Must handle all edge cases robustly.
- Optimize for time/space (e.g., O(n log n) instead of O(n²)).
- Provide complexity analysis in comments.
- Production-quality code.`;
  }

  return guidance + diffGuide;
}

// ========== 7. LANGUAGE GUIDANCE ==========
const LANGUAGE_GUIDANCE = {
  java: `
JAVA SYNTAX RULES:
- Methods: "public static ReturnType methodName(ParamType param)"
- Classes: "public class Name { private fields; public constructor; public methods; }"
- Arrays: "int[] arr" or "String[] arr"
- Generics: "class Name<T>", "List<String>"
- Use standard library where appropriate.`,

  python: `
PYTHON SYNTAX RULES:
- Functions: "def func_name(param: type) -> return_type:"
- Classes: "class Name: def __init__(self): ..."
- Type hints encouraged but optional.
- Use list, dict, set built-ins.
- Decorators: "@decorator_name" above function.`,

  javascript: `
JAVASCRIPT SYNTAX RULES:
- Functions: "function name(param) { return ... }" or "const name = (param) => ..."
- Classes: "class Name { constructor() { ... } method() { ... } }"
- Use const/let, avoid var.
- Async: "async function fetch() { await ... }"`,

  cpp: `
C++ SYNTAX RULES:
- Functions: "ReturnType functionName(const vector<Type>& param)"
- Classes: "class Name { private: fields; public: constructor; methods; };"
- Smart pointers: "auto ptr = make_unique<Type>()"
- Move: "Type(Type&& other) noexcept : data(other.data) { other.data = nullptr; }"
- Use std::vector, std::string, not raw arrays.`,

  csharp: `
C# SYNTAX RULES:
- Methods: "public static ReturnType MethodName(ParamType param)"
- Classes: "public class Name { private fields; public constructor; public methods; }"
- Properties: "public int MyProperty { get; set; }"
- Events: "public event EventHandler MyEvent;"
- Async: "public async Task<int> GetDataAsync() { await ... }"
- LINQ: "var result = list.Where(x => x > 0).Select(x => x * 2);"`,

  go: `
GO SYNTAX RULES:
- Functions: "func FuncName(param Type) ReturnType"
- Methods: "func (r ReceiverType) MethodName() ReturnType"
- No classes - use structs with methods.
- Goroutines: "go funcName()"
- Channels: "ch := make(chan int)"
- Defer: "defer file.Close()"
- Multiple returns: "func find(arr []int) (int, error)"`,
};

function getLanguageGuidance(language) {
  const key = (language || "").toLowerCase().trim();
  return (
    LANGUAGE_GUIDANCE[key] ||
    `
${language.toUpperCase()} SYNTAX RULES:
- All code must be syntactically correct, idiomatic ${language}.
- Follow standard naming conventions for ${language}.`
  );
}

// ========== 8. DOMAIN GUIDANCE ==========
const DOMAIN_NOTE = {
  Concurrency: `NOTE: All concurrency problems are CONCEPTUAL simulations. No real threading/parallelism.`,
  Async: `NOTE: Async problems resolve immediately for deterministic output.`,
  "DOM Manipulation": `NOTE: No real browser DOM - model as plain JS objects/arrays.`,
  DSA: `NOTE: Focus on algorithm correctness, not fancy syntax.`,
  OOP: `NOTE: Use proper encapsulation, inheritance, or abstraction as specified.`,
  STL: `NOTE: Prefer STL algorithms over manual loops when possible.`,
  LINQ: `NOTE: Use LINQ for query operations, not manual loops.`,
};

function getDomainNote(domain) {
  return DOMAIN_NOTE[domain] || "";
}

// ========== 9. EXPORTS ==========
module.exports = {
  getTopicGuidance,
  getLanguageGuidance,
  getDomainNote,
  isConcurrencyOrAsyncTopic,
  TOPIC_CATEGORY,
  getTopicStyle,
};
